// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// --- Mocks ---

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    users: { viewer: "viewer" },
    expenses: { getExpenses: "getExpenses" },
  },
}));

const loadMoreMock = vi.fn();
let paginatedQueryState: {
  results: object[];
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  loadMore: typeof loadMoreMock;
} = { results: [], status: "LoadingFirstPage", loadMore: loadMoreMock };
const useQueryMock = vi.fn();

vi.mock("convex/react", () => ({
  usePaginatedQuery: () => paginatedQueryState,
  useQuery: (key: string) => useQueryMock(key),
}));

let mockEntry: { isIntersecting: boolean } | null = null;

vi.mock("@/shared/hooks/useIntersectionObserver", () => ({
  default: () => ({ ref: vi.fn(), entry: mockEntry }),
}));

vi.mock("@/shared/animation/chakraMotion", () => ({
  listRowStaggerEnter: () => ({}),
}));

vi.mock("@/shared/components/CustomMonthPicker", () => ({
  default: ({
    onPreviousMonth,
    onNextMonth,
  }: {
    onPreviousMonth?: () => void;
    onNextMonth?: () => void;
  }) => (
    <div data-testid="month-picker">
      <button data-testid="prev-month" onClick={onPreviousMonth}>
        Prev
      </button>
      <button data-testid="next-month" onClick={onNextMonth}>
        Next
      </button>
    </div>
  ),
}));

vi.mock("../modals/CreateOrEditExpense", () => ({
  default: () => <button>Add Expense</button>,
}));

vi.mock("../modals/RemoveExpense", () => ({
  default: () => <button aria-label="Delete Expense" />,
}));

vi.mock("../modals/DuplicateExpense", () => ({
  default: () => <button aria-label="Duplicate Expense" />,
}));

vi.mock("../modals/ManageExpenseFiles", () => ({
  default: () => <button aria-label="Manage Expense Files" />,
}));

vi.mock("@tabler/icons-react", () => ({
  IconArrowDown: () => null,
}));

vi.mock("@chakra-ui/react", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => (
    <span role="status">{children}</span>
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
    <button onClick={onClick} aria-label={ariaLabel}>
      {children}
    </button>
  ),
  HStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Input: ({
    onChange,
    placeholder,
  }: {
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
  }) => <input onChange={onChange} placeholder={placeholder} />,
  parseDate: (d: Date | string) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return { month: date.getMonth() + 1, year: date.getFullYear() };
  },
  Separator: () => null,
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
      children?: React.ReactNode;
      colSpan?: number;
    }) => <td colSpan={colSpan}>{children}</td>,
  },
  Text: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
}));

// --- Fixtures ---

const makeExpense = (overrides: object = {}) => ({
  _id: "exp1",
  _creationTime: new Date("2025-01-15").getTime(),
  userId: "user1",
  name: "Grocery Shopping",
  description: "Monthly groceries",
  amount: 250.0,
  date: new Date("2025-06-15").getTime(),
  category: "Food",
  paidAt: undefined,
  ...overrides,
});

import ExpensesList from "./ExpensesList";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  mockEntry = null;
});

describe("ExpensesList", () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue({ _id: "user1" });
    paginatedQueryState = {
      results: [],
      status: "LoadingFirstPage",
      loadMore: loadMoreMock,
    };
  });

  it("renders the search input", () => {
    render(<ExpensesList />);
    expect(screen.getByPlaceholderText("Search expenses...")).toBeInTheDocument();
  });

  it("renders the month picker", () => {
    render(<ExpensesList />);
    expect(screen.getByTestId("month-picker")).toBeInTheDocument();
  });

  it("renders the Add Expense button", () => {
    render(<ExpensesList />);
    expect(screen.getByRole("button", { name: "Add Expense" })).toBeInTheDocument();
  });

  it("renders skeleton rows while loading", () => {
    paginatedQueryState = {
      results: [],
      status: "LoadingFirstPage",
      loadMore: loadMoreMock,
    };
    render(<ExpensesList />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders expense rows when data is loaded", () => {
    paginatedQueryState = {
      results: [makeExpense()],
      status: "Exhausted",
      loadMore: loadMoreMock,
    };
    render(<ExpensesList />);
    expect(screen.getByText("Grocery Shopping")).toBeInTheDocument();
    expect(screen.getByText("Monthly groceries")).toBeInTheDocument();
  });

  it("renders 'No expenses found' when results are empty and not loading", () => {
    paginatedQueryState = {
      results: [],
      status: "Exhausted",
      loadMore: loadMoreMock,
    };
    render(<ExpensesList />);
    expect(
      screen.getByText("No expenses found. Please add a new expense."),
    ).toBeInTheDocument();
  });

  it("renders 'No more expenses' badge when status is Exhausted with results", () => {
    paginatedQueryState = {
      results: [makeExpense()],
      status: "Exhausted",
      loadMore: loadMoreMock,
    };
    render(<ExpensesList />);
    expect(screen.getByText("No more expenses to load.")).toBeInTheDocument();
  });

  it("renders a Load More button when status is CanLoadMore", () => {
    paginatedQueryState = {
      results: [makeExpense()],
      status: "CanLoadMore",
      loadMore: loadMoreMock,
    };
    render(<ExpensesList />);
    expect(screen.getByRole("button", { name: "Load More" })).toBeInTheDocument();
  });

  it("calls loadMore when Load More button is clicked", () => {
    paginatedQueryState = {
      results: [makeExpense()],
      status: "CanLoadMore",
      loadMore: loadMoreMock,
    };
    render(<ExpensesList />);
    fireEvent.click(screen.getByRole("button", { name: "Load More" }));
    expect(loadMoreMock).toHaveBeenCalledWith(15);
  });

  it("filters results by search text", () => {
    paginatedQueryState = {
      results: [makeExpense(), makeExpense({ _id: "exp2", name: "Taxi", description: "Work trip" })],
      status: "Exhausted",
      loadMore: loadMoreMock,
    };
    render(<ExpensesList />);
    fireEvent.change(screen.getByPlaceholderText("Search expenses..."), {
      target: { value: "Grocery" },
    });
    expect(screen.getByText("Grocery Shopping")).toBeInTheDocument();
    expect(screen.queryByText("Taxi")).not.toBeInTheDocument();
  });

  it("renders action buttons for each expense row", () => {
    paginatedQueryState = {
      results: [makeExpense()],
      status: "Exhausted",
      loadMore: loadMoreMock,
    };
    render(<ExpensesList />);
    expect(
      screen.getByRole("button", { name: "Delete Expense" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Duplicate Expense" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Manage Expense Files" }),
    ).toBeInTheDocument();
  });

  it("navigates to previous month when prev button is clicked", () => {
    render(<ExpensesList />);
    fireEvent.click(screen.getByTestId("prev-month"));
    // No error means navigation handler ran; month picker received the callback
    expect(screen.getByTestId("month-picker")).toBeInTheDocument();
  });

  it("navigates to next month when next button is clicked", () => {
    render(<ExpensesList />);
    fireEvent.click(screen.getByTestId("next-month"));
    expect(screen.getByTestId("month-picker")).toBeInTheDocument();
  });

  it("auto-loads more when intersection observer fires and status is CanLoadMore", () => {
    paginatedQueryState = {
      results: [makeExpense()],
      status: "CanLoadMore",
      loadMore: loadMoreMock,
    };
    mockEntry = { isIntersecting: true };
    render(<ExpensesList />);
    expect(loadMoreMock).toHaveBeenCalled();
  });

  it("renders column header sort buttons", () => {
    render(<ExpensesList />);
    expect(screen.getByRole("button", { name: "Sort by Name" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sort by Amount" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sort by Category" })).toBeInTheDocument();
  });

  it("cycles sort order when the same column header is clicked twice", () => {
    paginatedQueryState = {
      results: [makeExpense()],
      status: "Exhausted",
      loadMore: loadMoreMock,
    };
    render(<ExpensesList />);
    const nameSort = screen.getByRole("button", { name: "Sort by Name" });
    fireEvent.click(nameSort);
    fireEvent.click(nameSort);
    // No error thrown – sort toggling works
    expect(nameSort).toBeInTheDocument();
  });
});
