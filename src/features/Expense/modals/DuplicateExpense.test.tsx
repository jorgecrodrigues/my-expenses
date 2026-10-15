// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

const { addRecurringExpenses, toasterCreate } = vi.hoisted(() => ({
  addRecurringExpenses: vi.fn(),
  toasterCreate: vi.fn(),
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    expenses: {
      addRecurringExpenses: "addRecurringExpenses",
      getExpenseCategoryOptions: "getExpenseCategoryOptions",
    },
  },
}));

vi.mock("convex/react", () => ({
  useMutation: () => addRecurringExpenses,
  useQuery: () => [{ value: "Software", label: "Software" }],
}));

vi.mock("@/components/ui/toaster", () => ({
  toaster: { create: toasterCreate },
}));

vi.mock("@/shared/animation/chakraMotion", () => ({
  dialogBackdropMotion: {},
  dialogContentMotion: {},
}));

vi.mock("@/shared/components/CategoryCombobox", () => ({
  default: ({
    selectedItem,
    inputProps,
  }: {
    selectedItem?: string;
    inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  }) => (
    <input aria-label="Category" defaultValue={selectedItem} {...inputProps} />
  ),
}));

vi.mock("@tabler/icons-react", () => ({
  IconCopyPlusFilled: () => <span data-testid="icon-copy" />,
}));

import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import DuplicateExpenseDialog from "./DuplicateExpense";
import { toDateTimeLocalValue } from "../utils/recurrence";

const ORIGINAL_DATE = new Date(2025, 3, 10, 12, 0);

const mockExpense: Doc<"expenses"> = {
  _id: "exp1" as Id<"expenses">,
  _creationTime: 0,
  userId: "user1" as Id<"users">,
  name: "Subscription",
  description: "App fee",
  amount: 29.9,
  category: "Software",
  date: ORIGINAL_DATE.toISOString(),
};

const monthlyDates = (count: number) =>
  Array.from({ length: count }, (_, index) =>
    new Date(2025, 4 + index, 10, 12, 0).toISOString(),
  );

async function openDialog() {
  const user = userEvent.setup();
  render(
    <ChakraProvider value={defaultSystem}>
      <DuplicateExpenseDialog expense={mockExpense} />
    </ChakraProvider>,
  );
  await user.click(screen.getByRole("button", { name: "Duplicate Expense" }));
  await screen.findByRole("dialog");
  return user;
}

beforeAll(() => {
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DuplicateExpenseDialog", () => {
  it("renders the duplicate icon button trigger", () => {
    render(
      <ChakraProvider value={defaultSystem}>
        <DuplicateExpenseDialog expense={mockExpense} />
      </ChakraProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Duplicate Expense" }),
    ).toBeInTheDocument();
  });

  it("pre-fills the bill details from the expense", async () => {
    await openDialog();

    expect(
      screen.getByRole("heading", { name: "Duplicate Expense" }),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter name")).toHaveValue(
      "Subscription",
    );
    expect(
      screen.getByPlaceholderText("Enter description (optional)"),
    ).toHaveValue("App fee");
    expect(screen.getByPlaceholderText("Enter amount")).toHaveValue(
      "R$\u00a029,90",
    );
    expect(screen.getByLabelText("Category")).toHaveValue("Software");
  });

  it("defaults to 12 monthly bills starting the month after the original", async () => {
    await openDialog();

    expect(screen.getByLabelText(/First due date/)).toHaveValue(
      toDateTimeLocalValue(new Date(2025, 4, 10, 12, 0)),
    );
    expect(
      screen.getByRole("status", { name: "Schedule preview" }),
    ).toHaveTextContent(/12 bills will be created · R\$\s358,80 in total/);
    expect(
      screen.getByRole("button", { name: "Create 12 bills" }),
    ).toBeEnabled();
  });

  it("creates the scheduled bills and closes the dialog", async () => {
    addRecurringExpenses.mockResolvedValue([]);
    const user = await openDialog();

    await user.click(screen.getByRole("button", { name: "Create 12 bills" }));

    expect(addRecurringExpenses).toHaveBeenCalledWith({
      name: "Subscription",
      description: "App fee",
      amount: 29.9,
      category: "Software",
      dates: monthlyDates(12),
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(toasterCreate).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", title: "12 bills created." }),
    );
  });

  it("sends the edited amount and omits an empty description", async () => {
    addRecurringExpenses.mockResolvedValue([]);
    const user = await openDialog();

    fireEvent.change(screen.getByPlaceholderText("Enter amount"), {
      target: { value: "4500" },
    });
    await user.clear(
      screen.getByPlaceholderText("Enter description (optional)"),
    );
    await user.click(screen.getByRole("button", { name: "Just once" }));
    await user.click(screen.getByRole("button", { name: "Create 1 bill" }));

    expect(addRecurringExpenses).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 45,
        description: undefined,
        dates: monthlyDates(1),
      }),
    );
  });

  it("disables submission when the schedule is empty", async () => {
    await openDialog();

    fireEvent.change(
      screen.getByRole("spinbutton", { name: "Number of bills" }),
      {
        target: { value: "0" },
      },
    );
    expect(
      screen.getByRole("button", { name: "Create 0 bills" }),
    ).toBeDisabled();
  });

  it("keeps the dialog open and reports errors", async () => {
    addRecurringExpenses.mockRejectedValue(new Error("Not authenticated"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const user = await openDialog();

    await user.click(screen.getByRole("button", { name: "Create 12 bills" }));

    await waitFor(() =>
      expect(toasterCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "error",
          title: "Failed to duplicate expense.",
          description: "Not authenticated",
        }),
      ),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
