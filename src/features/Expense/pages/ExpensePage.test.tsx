// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { Id } from "../../../../convex/_generated/dataModel";
import type {
  Expense,
  ExpenseTotals,
} from "@/features/Dashboard/utils/dashboardMetrics";

type Captured = Record<string, Record<string, unknown> | undefined>;

const { captured, monthState, expensesState, rangeArgs } = vi.hoisted(() => ({
  captured: {} as Captured,
  monthState: {
    current: {
      year: 2025,
      monthIndex: 2,
      category: undefined as string | undefined,
      goToMonth: (() => {}) as (year: number, monthIndex: number) => void,
      setCategory: (() => {}) as (category?: string) => void,
    },
  },
  expensesState: { current: undefined as Expense[] | undefined },
  rangeArgs: { current: [] as number[] },
}));

const goToMonth = vi.fn();
const setCategory = vi.fn();

vi.mock("../hooks/useExpenseMonth", () => ({
  default: () => monthState.current,
  formatMonthParam: (year: number, monthIndex: number) =>
    `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
}));

vi.mock("../hooks/useMonthExpenses", () => ({
  default: (year: number, monthIndex: number) => {
    rangeArgs.current = [year, monthIndex];
    return expensesState.current;
  },
}));

vi.mock("@chakra-ui/react", () => ({
  parseDate: (value: string) => value,
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  Heading: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  HStack: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Stack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/shared/components/CustomMonthPicker", () => ({
  default: ({
    value,
    onPreviousMonth,
    onNextMonth,
    onValueChange,
  }: {
    value: string[];
    onPreviousMonth: () => void;
    onNextMonth: () => void;
    onValueChange: (details: {
      value: Array<{ month: number; year: number }>;
    }) => void;
  }) => (
    <div data-testid="month-picker" data-value={value[0]}>
      <button type="button" onClick={onPreviousMonth}>
        Previous month
      </button>
      <button type="button" onClick={onNextMonth}>
        Next month
      </button>
      <button
        type="button"
        onClick={() => onValueChange({ value: [{ month: 7, year: 2024 }] })}
      >
        Pick July 2024
      </button>
    </div>
  ),
}));

function captureMock(name: string) {
  return {
    default: (props: Record<string, unknown>) => {
      captured[name] = props;
      return <div data-testid={name} />;
    },
  };
}

vi.mock("@/features/Dashboard/components/SummaryCards", () =>
  captureMock("summary-cards"),
);
vi.mock("../components/BillsTable", () => captureMock("bills-table"));

vi.mock("../modals/CreateOrEditExpense", () => ({
  default: ({ expense }: { expense?: Expense }) => (
    <button type="button">
      {expense ? `Edit ${expense.name}` : "Add Expense"}
    </button>
  ),
}));
vi.mock("../modals/DuplicateExpense", () => ({
  default: ({ expense }: { expense: Expense }) => (
    <button type="button">{`Duplicate ${expense.name}`}</button>
  ),
}));
vi.mock("../modals/ManageExpenseFiles", () => ({
  default: ({ expense }: { expense: Expense }) => (
    <button type="button">{`Files of ${expense.name}`}</button>
  ),
}));
vi.mock("../modals/RemoveExpense", () => ({
  default: ({ expense }: { expense: Expense }) => (
    <button type="button">{`Delete ${expense.name}`}</button>
  ),
}));

import ExpensePage from "./ExpensePage";

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    _id: "exp1" as Id<"expenses">,
    _creationTime: 0,
    userId: "user1" as Id<"users">,
    name: "Rent",
    amount: 100,
    category: "Housing",
    date: "2025-03-10T10:00",
    ...overrides,
  };
}

const expenses = [
  makeExpense({ _id: "mar-housing" as Id<"expenses"> }),
  makeExpense({
    _id: "mar-food" as Id<"expenses">,
    name: "Groceries",
    category: "Food",
    amount: 40,
  }),
  makeExpense({
    _id: "feb" as Id<"expenses">,
    amount: 50,
    date: "2025-02-10T10:00",
  }),
  makeExpense({
    _id: "apr" as Id<"expenses">,
    amount: 70,
    date: "2025-04-01T10:00",
  }),
];

const ids = (value: unknown) =>
  (value as Expense[] | undefined)?.map((e) => e._id);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2025, 2, 15, 12));
  monthState.current = {
    year: 2025,
    monthIndex: 2,
    category: undefined,
    goToMonth,
    setCategory,
  };
  expensesState.current = expenses;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
  for (const key of Object.keys(captured)) delete captured[key];
});

describe("ExpensePage", () => {
  it("renders the heading, month picker and add button", () => {
    render(<ExpensePage />);

    expect(
      screen.getByRole("heading", { name: "Expenses" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Manage and track your bills for/),
    ).toHaveTextContent("2025");
    expect(screen.getByTestId("month-picker")).toHaveAttribute(
      "data-value",
      "2025-03-01",
    );
    expect(
      screen.getByRole("button", { name: "Add Expense" }),
    ).toBeInTheDocument();
    expect(rangeArgs.current).toEqual([2025, 2]);
  });

  it("passes undefined data while loading", () => {
    expensesState.current = undefined;
    render(<ExpensePage />);

    expect(captured["summary-cards"]?.current).toBeUndefined();
    expect(captured["bills-table"]?.expenses).toBeUndefined();
  });

  it("lists the bills of the month and compares with the previous month", () => {
    render(<ExpensePage />);

    expect(ids(captured["bills-table"]?.expenses)).toEqual([
      "mar-housing",
      "mar-food",
    ]);
    expect((captured["summary-cards"]?.current as ExpenseTotals).total).toBe(
      140,
    );
    expect((captured["summary-cards"]?.previous as ExpenseTotals).total).toBe(
      50,
    );
  });

  it("filters the bills by category and lets the table change it", () => {
    monthState.current = { ...monthState.current, category: "Food" };
    render(<ExpensePage />);

    expect(ids(captured["bills-table"]?.expenses)).toEqual(["mar-food"]);
    expect(captured["bills-table"]?.category).toBe("Food");
    expect((captured["summary-cards"]?.current as ExpenseTotals).total).toBe(
      140,
    );

    (captured["bills-table"]?.onCategoryChange as (c?: string) => void)(
      undefined,
    );
    expect(setCategory).toHaveBeenCalledWith(undefined);
  });

  it("renders every row action for a bill", () => {
    render(<ExpensePage />);
    const renderActions = captured["bills-table"]?.renderActions as (
      expense: Expense,
    ) => React.ReactNode;

    cleanup();
    render(<>{renderActions(expenses[0])}</>);
    for (const name of [
      "Duplicate Rent",
      "Files of Rent",
      "Edit Rent",
      "Delete Rent",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("navigates between months", () => {
    render(<ExpensePage />);

    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(goToMonth).toHaveBeenCalledWith(2025, 1);

    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(goToMonth).toHaveBeenCalledWith(2025, 3);

    fireEvent.click(screen.getByRole("button", { name: "Pick July 2024" }));
    expect(goToMonth).toHaveBeenCalledWith(2024, 6);
  });

  it("offers a shortcut back to the current month", () => {
    monthState.current = { ...monthState.current, year: 2024, monthIndex: 6 };
    render(<ExpensePage />);

    fireEvent.click(screen.getByRole("button", { name: "This month" }));
    expect(goToMonth).toHaveBeenCalledWith(2025, 2);
  });

  it("hides the shortcut on the current month", () => {
    render(<ExpensePage />);
    expect(
      screen.queryByRole("button", { name: "This month" }),
    ).not.toBeInTheDocument();
  });
});
