// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const loadMore = vi.fn();

const intersection = vi.hoisted(() => ({
  entry: { isIntersecting: false } as { isIntersecting: boolean },
}));

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    users: { viewer: "users.viewer" },
    expenses: { getExpenses: "expenses.getExpenses" },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
  usePaginatedQuery: vi.fn(),
}));

vi.mock("@/shared/hooks/useIntersectionObserver", () => ({
  default: () => ({
    ref: vi.fn(),
    get entry() {
      return intersection.entry;
    },
  }),
}));

vi.mock("@/shared/components/CustomMonthPicker", () => ({
  default: () => <div data-testid="month-picker" />,
}));

vi.mock("../modals/CreateOrEditExpense", () => ({
  default: () => <div data-testid="create-or-edit-expense" />,
}));

vi.mock("../modals/RemoveExpense", () => ({
  default: () => <div data-testid="remove-expense" />,
}));

vi.mock("../modals/DuplicateExpense", () => ({
  default: () => <div data-testid="duplicate-expense" />,
}));

vi.mock("../modals/ManageExpenseFiles", () => ({
  default: () => <div data-testid="manage-expense-files" />,
}));

vi.mock("@tabler/icons-react", () => ({
  IconArrowDown: () => <span data-icon="arrow-down" />,
}));

vi.mock("@chakra-ui/react", () => ({
  parseDate: (s: string) => new Date(s),
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span data-testid="badge">{children}</span>
  ),
  Button: ({
    children,
    onClick,
    "aria-label": ariaLabel,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    "aria-label"?: string;
  }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
  HStack: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Input: ({
    placeholder,
    onChange,
  }: {
    placeholder?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => <input placeholder={placeholder} onChange={onChange} />,
  Separator: () => <hr />,
  Skeleton: () => <div data-testid="skeleton" />,
  SkeletonCircle: () => <div data-testid="skeleton-circle" />,
  Table: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <table>{children}</table>
    ),
    Header: ({ children }: { children: React.ReactNode }) => (
      <thead>{children}</thead>
    ),
    Body: ({ children }: { children: React.ReactNode }) => (
      <tbody>{children}</tbody>
    ),
    Row: ({ children }: { children: React.ReactNode }) => <tr>{children}</tr>,
    ColumnHeader: ({ children }: { children: React.ReactNode }) => (
      <th>{children}</th>
    ),
    Cell: ({
      children,
      colSpan,
    }: {
      children: React.ReactNode;
      colSpan?: number;
    }) => <td colSpan={colSpan}>{children}</td>,
  },
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

import { usePaginatedQuery, useQuery } from "convex/react";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import ExpensesList from "./ExpensesList";

const userId = "user1" as Id<"users">;

function makeExpense(overrides: Partial<Doc<"expenses">> = {}): Doc<"expenses"> {
  return {
    _id: "exp1" as Id<"expenses">,
    _creationTime: new Date("2025-06-01T12:00:00Z").getTime(),
    userId,
    name: "Coffee",
    description: "Morning brew",
    amount: 12.5,
    category: "Food",
    date: "2025-06-15T10:00:00.000Z",
    paidAt: undefined,
    ...overrides,
  };
}

function firstBodyDataRow(table: HTMLElement) {
  const tbody = table.querySelector("tbody");
  const rows = tbody?.querySelectorAll("tr");
  return rows?.[0] ?? null;
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  intersection.entry = { isIntersecting: false };
});

describe("ExpensesList", () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockImplementation(
      ((query: unknown) => {
        if (query === "users.viewer") return { _id: userId };
        return undefined;
      }) as typeof useQuery,
    );
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [makeExpense()],
      status: "Exhausted",
      isLoading: false,
      loadMore,
    });
  });

  it("renders search input and month picker", () => {
    render(<ExpensesList />);
    expect(
      screen.getByPlaceholderText("Search expenses..."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("month-picker")).toBeInTheDocument();
  });

  it("renders expense rows and action placeholders", () => {
    render(<ExpensesList />);
    expect(screen.getByText("Coffee")).toBeInTheDocument();
    expect(screen.getByText("Morning brew")).toBeInTheDocument();
    expect(screen.getByTestId("duplicate-expense")).toBeInTheDocument();
    expect(screen.getByTestId("manage-expense-files")).toBeInTheDocument();
    expect(screen.getAllByTestId("create-or-edit-expense")).toHaveLength(2);
    expect(screen.getByTestId("remove-expense")).toBeInTheDocument();
  });

  it("filters rows by search term (name)", () => {
    render(<ExpensesList />);
    fireEvent.change(screen.getByPlaceholderText("Search expenses..."), {
      target: { value: "nomatch" },
    });
    expect(screen.queryByText("Coffee")).not.toBeInTheDocument();
  });

  it("filters rows when search matches category", () => {
    render(<ExpensesList />);
    fireEvent.change(screen.getByPlaceholderText("Search expenses..."), {
      target: { value: "food" },
    });
    expect(screen.getByText("Coffee")).toBeInTheDocument();
  });

  it("filters rows when search matches description", () => {
    render(<ExpensesList />);
    fireEvent.change(screen.getByPlaceholderText("Search expenses..."), {
      target: { value: "brew" },
    });
    expect(screen.getByText("Coffee")).toBeInTheDocument();
  });

  it("shows footer totals for unpaid and paid amounts", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [
        makeExpense({
          _id: "e1" as Id<"expenses">,
          name: "A",
          amount: 10,
          paidAt: undefined,
        }),
        makeExpense({
          _id: "e2" as Id<"expenses">,
          name: "B",
          amount: 25,
          paidAt: "2025-06-15T12:00:00.000Z",
        }),
      ],
      status: "Exhausted",
      isLoading: false,
      loadMore,
    });
    render(<ExpensesList />);

    const totalsRow = screen.getByText("Total:").closest("tr");
    expect(totalsRow).toBeTruthy();
    expect(totalsRow).toHaveTextContent("Unpaid:");
    expect(totalsRow).toHaveTextContent("Paid:");
    expect(totalsRow).toHaveTextContent("35,00");
    expect(totalsRow).toHaveTextContent("10,00");
    expect(totalsRow).toHaveTextContent("25,00");
  });

  it("reorders rows when sorting by name twice (asc then desc)", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [
        makeExpense({
          _id: "e1" as Id<"expenses">,
          name: "Zebra",
        }),
        makeExpense({
          _id: "e2" as Id<"expenses">,
          name: "Alpha",
        }),
      ],
      status: "Exhausted",
      isLoading: false,
      loadMore,
    });
    render(<ExpensesList />);

    const table = screen.getByRole("table");
    expect(firstBodyDataRow(table)).toHaveTextContent("Zebra");

    fireEvent.click(screen.getByRole("button", { name: "Sort by Name" }));
    expect(firstBodyDataRow(table)).toHaveTextContent("Alpha");

    fireEvent.click(screen.getByRole("button", { name: "Sort by Name" }));
    expect(firstBodyDataRow(table)).toHaveTextContent("Zebra");
  });

  it("calls loadMore when Load More is clicked", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [makeExpense()],
      status: "CanLoadMore",
      isLoading: false,
      loadMore,
    });
    render(<ExpensesList />);
    fireEvent.click(screen.getByRole("button", { name: "Load More" }));
    expect(loadMore).toHaveBeenCalledWith(15);
  });

  it("calls loadMore when the sentinel intersects and more pages exist", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [makeExpense()],
      status: "CanLoadMore",
      isLoading: false,
      loadMore,
    });
    const { rerender } = render(<ExpensesList />);
    expect(loadMore).not.toHaveBeenCalled();

    intersection.entry = { isIntersecting: true };
    rerender(<ExpensesList />);

    expect(loadMore).toHaveBeenCalledWith(15);
  });

  it("does not call loadMore on intersection when status is exhausted", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [makeExpense()],
      status: "Exhausted",
      isLoading: false,
      loadMore,
    });
    const { rerender } = render(<ExpensesList />);
    intersection.entry = { isIntersecting: true };
    rerender(<ExpensesList />);
    expect(loadMore).not.toHaveBeenCalled();
  });

  it("shows exhausted badge when pagination is exhausted", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [makeExpense()],
      status: "Exhausted",
      isLoading: false,
      loadMore,
    });
    render(<ExpensesList />);
    expect(
      screen.getByText("No more expenses to load."),
    ).toBeInTheDocument();
  });

  it("shows skeleton placeholders while loading the first page", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [],
      status: "LoadingFirstPage",
      isLoading: true,
      loadMore,
    });
    render(<ExpensesList />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("skeleton-circle").length).toBeGreaterThan(0);
  });

  it("shows a loading row while fetching more pages", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [makeExpense()],
      status: "LoadingMore",
      isLoading: true,
      loadMore,
    });
    render(<ExpensesList />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("shows empty state when there are no expenses", () => {
    vi.mocked(usePaginatedQuery).mockReturnValue({
      results: [],
      status: "Exhausted",
      isLoading: false,
      loadMore,
    });
    render(<ExpensesList />);
    expect(
      screen.getByText("No expenses found. Please add a new expense."),
    ).toBeInTheDocument();
  });

  it("exposes column headers for sorting", () => {
    render(<ExpensesList />);
    const table = screen.getByRole("table");
    const header = within(table).getAllByRole("columnheader");
    expect(header.some((th) => th.textContent?.includes("Name"))).toBe(true);
    expect(header.some((th) => th.textContent?.includes("Amount"))).toBe(true);
    expect(header.some((th) => th.textContent?.includes("Category"))).toBe(true);
  });
});
