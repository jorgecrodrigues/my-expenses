// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

const { setExpensesPaid, toasterCreate } = vi.hoisted(() => ({
  setExpensesPaid: vi.fn(),
  toasterCreate: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: { expenses: { setExpensesPaid: "setExpensesPaid" } },
}));

vi.mock("convex/react", () => ({
  useMutation: () => setExpensesPaid,
}));

vi.mock("@/components/ui/toaster", () => ({
  toaster: { create: toasterCreate },
}));

vi.mock("@/features/Expense/modals/CreateOrEditExpense", () => ({
  default: ({ expense }: { expense: { name: string } }) => (
    <button type="button">{`Edit ${expense.name}`}</button>
  ),
}));

vi.mock("@tabler/icons-react", () => ({
  IconArrowBackUp: () => <span data-testid="icon-arrow-back-up" />,
  IconCheck: () => <span data-testid="icon-check" />,
  IconArrowDown: () => <span data-testid="icon-arrow-down" />,
  IconArrowUp: () => <span data-testid="icon-arrow-up" />,
  IconSearch: () => <span data-testid="icon-search" />,
}));

import type { Id } from "../../../../convex/_generated/dataModel";
import type { Expense } from "@/features/Dashboard/utils/dashboardMetrics";
import BillsTable from "./BillsTable";

const NOW = new Date(2025, 2, 15, 12, 0);

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    _id: "exp1" as Id<"expenses">,
    _creationTime: 0,
    userId: "user1" as Id<"users">,
    name: "Rent",
    amount: 100,
    category: "Housing",
    date: "2025-03-20T10:00",
    ...overrides,
  };
}

const expenses = [
  makeExpense({
    _id: "rent" as Id<"expenses">,
    name: "Rent",
    amount: 1500,
    date: "2025-03-05T10:00",
    paidAt: "2025-03-05T10:00",
  }),
  makeExpense({
    _id: "power" as Id<"expenses">,
    name: "Power",
    description: "Electricity bill",
    category: "Utilities",
    amount: 200,
    date: "2025-03-10T10:00",
  }),
  makeExpense({
    _id: "internet" as Id<"expenses">,
    name: "Internet",
    category: "Utilities",
    amount: 100,
    date: "2025-03-18T10:00",
  }),
];

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function renderTable(
  props: Partial<React.ComponentProps<typeof BillsTable>> = {},
) {
  const onCategoryChange = vi.fn();
  render(
    <ChakraProvider value={defaultSystem}>
      <BillsTable
        expenses={expenses}
        monthLabel="March 2025"
        onCategoryChange={onCategoryChange}
        now={NOW}
        {...props}
      />
    </ChakraProvider>,
  );
  return { onCategoryChange };
}

function bodyRowNames() {
  const [, body] = screen.getAllByRole("rowgroup");
  return within(body)
    .getAllByRole("row")
    .map(
      (row) =>
        within(row).getAllByRole("cell")[1].querySelector("p")?.textContent,
    );
}

describe("BillsTable", () => {
  it("shows skeletons while loading", () => {
    renderTable({ expenses: undefined });
    expect(screen.getByText("Bills")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows an empty message when the month has no bills", () => {
    renderTable({ expenses: [] });
    expect(screen.getByText("No bills for this month.")).toBeInTheDocument();
  });

  it("lists bills sorted by due date with status and details", () => {
    renderTable();

    expect(bodyRowNames()).toEqual(["Rent", "Power", "Internet"]);
    expect(screen.getByText("Electricity bill")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("5d late")).toBeInTheDocument();
    expect(screen.getByText("Due in 3d")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Edit Rent" }),
    ).toBeInTheDocument();
    expect(screen.getByText("3 bills")).toBeInTheDocument();
  });

  it("filters by status", () => {
    renderTable();

    fireEvent.click(screen.getByRole("button", { name: "Overdue (1)" }));
    expect(bodyRowNames()).toEqual(["Power"]);

    fireEvent.click(screen.getByRole("button", { name: "Open (2)" }));
    expect(bodyRowNames()).toEqual(["Power", "Internet"]);

    fireEvent.click(screen.getByRole("button", { name: "Paid (1)" }));
    expect(bodyRowNames()).toEqual(["Rent"]);
  });

  it("filters by search term", () => {
    renderTable();
    fireEvent.change(screen.getByRole("textbox", { name: "Search bills" }), {
      target: { value: "electricity" },
    });
    expect(bodyRowNames()).toEqual(["Power"]);

    fireEvent.change(screen.getByRole("textbox", { name: "Search bills" }), {
      target: { value: "nothing" },
    });
    expect(
      screen.getByText("No bills match the current filters."),
    ).toBeInTheDocument();
  });

  it("sorts by amount and toggles the direction", () => {
    renderTable();

    fireEvent.click(screen.getByRole("button", { name: "Sort by Amount" }));
    expect(bodyRowNames()).toEqual(["Rent", "Power", "Internet"]);

    fireEvent.click(screen.getByRole("button", { name: "Sort by Amount" }));
    expect(bodyRowNames()).toEqual(["Internet", "Power", "Rent"]);

    fireEvent.click(screen.getByRole("button", { name: "Sort by Bill" }));
    expect(bodyRowNames()).toEqual(["Internet", "Power", "Rent"]);
  });

  it("shows the selection summary and marks selected bills as paid", async () => {
    const user = userEvent.setup();
    setExpensesPaid.mockResolvedValue(null);
    renderTable();

    await user.click(screen.getByRole("checkbox", { name: "Select Power" }));
    await user.click(screen.getByRole("checkbox", { name: "Select Rent" }));

    await waitFor(() =>
      expect(
        screen.getByRole("status").textContent?.replace(/\s/g, " "),
      ).toContain("2 selected · R$ 1.700,00"),
    );

    await user.click(screen.getByRole("button", { name: "Mark as paid" }));

    await waitFor(() =>
      expect(setExpensesPaid).toHaveBeenCalledWith({
        ids: ["power"],
        paid: true,
      }),
    );
    await waitFor(() =>
      expect(toasterCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          title: "1 bill marked as paid",
        }),
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );
  });

  it("marks selected paid bills as unpaid", async () => {
    const user = userEvent.setup();
    setExpensesPaid.mockResolvedValue(null);
    renderTable();

    await user.click(screen.getByRole("checkbox", { name: "Select Rent" }));
    const markAsPaid = await screen.findByRole("button", {
      name: "Mark as paid",
    });
    expect(markAsPaid).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Mark as unpaid" }));

    await waitFor(() =>
      expect(setExpensesPaid).toHaveBeenCalledWith({
        ids: ["rent"],
        paid: false,
      }),
    );
  });

  it("reports errors when updating fails", async () => {
    const user = userEvent.setup();
    setExpensesPaid.mockRejectedValue(new Error("Unauthorized"));
    renderTable();

    await user.click(screen.getByRole("checkbox", { name: "Select Power" }));
    await user.click(
      await screen.findByRole("button", { name: "Mark as paid" }),
    );

    await waitFor(() =>
      expect(toasterCreate).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", description: "Unauthorized" }),
      ),
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("selects and clears all visible bills", async () => {
    const user = userEvent.setup();
    renderTable();

    await user.click(
      screen.getByRole("checkbox", { name: "Select all bills" }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("3 selected");
    expect(
      screen.getByRole("checkbox", { name: "Select Internet" }),
    ).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Clear selection" }));
    await waitFor(() =>
      expect(screen.queryByRole("status")).not.toBeInTheDocument(),
    );
  });

  it("shows the category filter and lets the user clear it", () => {
    const { onCategoryChange } = renderTable({ category: "Utilities" });
    fireEvent.click(
      screen.getByRole("button", { name: "Clear category filter" }),
    );
    expect(onCategoryChange).toHaveBeenCalledWith(undefined);
  });

  it("filters by category when a category is clicked", () => {
    const { onCategoryChange } = renderTable();
    fireEvent.click(
      screen.getAllByRole("button", { name: "Filter by Utilities" })[0],
    );
    expect(onCategoryChange).toHaveBeenCalledWith("Utilities");
  });

  it("shows plain category labels when filtering is not available", () => {
    renderTable({ onCategoryChange: undefined, category: "Utilities" });
    expect(
      screen.queryByRole("button", { name: /^Filter by/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Clear category filter" }),
    ).not.toBeInTheDocument();
  });

  it("marks a single bill as paid or unpaid from its row", async () => {
    setExpensesPaid.mockResolvedValue(null);
    renderTable();

    fireEvent.click(screen.getByRole("button", { name: "Mark Power as paid" }));
    await waitFor(() =>
      expect(setExpensesPaid).toHaveBeenCalledWith({
        ids: ["power"],
        paid: true,
      }),
    );
    await waitFor(() =>
      expect(toasterCreate).toHaveBeenCalledWith(
        expect.objectContaining({ title: "1 bill marked as paid" }),
      ),
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Mark Rent as unpaid" }),
    );
    await waitFor(() =>
      expect(setExpensesPaid).toHaveBeenLastCalledWith({
        ids: ["rent"],
        paid: false,
      }),
    );
  });

  it("keeps the selection when a single row is updated", async () => {
    const user = userEvent.setup();
    setExpensesPaid.mockResolvedValue(null);
    renderTable();

    await user.click(screen.getByRole("checkbox", { name: "Select Internet" }));
    await screen.findByRole("status");
    await user.click(
      screen.getByRole("button", { name: "Mark Power as paid" }),
    );

    await waitFor(() => expect(setExpensesPaid).toHaveBeenCalled());
    expect(screen.getByRole("status")).toHaveTextContent("1 selected");
  });

  it("renders custom row actions", () => {
    renderTable({
      renderActions: (expense) => (
        <button type="button">{`Delete ${expense.name}`}</button>
      ),
    });
    expect(
      screen.getByRole("button", { name: "Delete Rent" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit Rent" }),
    ).not.toBeInTheDocument();
  });
});
