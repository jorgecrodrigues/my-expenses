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

const { captured, routeState, expensesState } = vi.hoisted(() => ({
  captured: {} as Captured,
  routeState: {
    current: {
      date: new Date(2025, 2, 1),
      year: 2025,
      monthIndex: 2,
      category: undefined as string | undefined,
      goToMonth: () => {},
      selectCategory: () => {},
    },
  },
  expensesState: { current: undefined as Expense[] | undefined },
}));

const goToMonth = vi.fn();
const selectCategory = vi.fn();

vi.mock("@/features/Dashboard/hooks/useDashboardRoute", () => ({
  default: () => routeState.current,
}));

vi.mock("@/features/Dashboard/hooks/useDashboardExpenses", () => ({
  default: () => expensesState.current,
}));

vi.mock("@chakra-ui/react", () => ({
  parseDate: (d: Date) => d,
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Heading: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  HStack: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Stack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SimpleGrid: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/shared/components/CustomMonthPicker", () => ({
  default: ({
    onPreviousMonth,
    onNextMonth,
    onValueChange,
  }: {
    onPreviousMonth: () => void;
    onNextMonth: () => void;
    onValueChange: (details: {
      value: Array<{ month: number; year: number }>;
    }) => void;
  }) => (
    <div data-testid="month-picker">
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

vi.mock("../components/SummaryCards", () => captureMock("summary-cards"));
vi.mock("../components/MonthlyTrendChart", () => captureMock("monthly-trend"));
vi.mock("../components/CategoryBreakdown", () =>
  captureMock("category-breakdown"),
);
vi.mock("../components/CategoryDetail", () => captureMock("category-detail"));
vi.mock("@/features/Expense/components/BillsTable", () =>
  captureMock("bills-table"),
);

import DashboardPage from "./DashboardPage";

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
    category: "Food",
    amount: 40,
  }),
  makeExpense({
    _id: "feb" as Id<"expenses">,
    amount: 50,
    date: "2025-02-10T10:00",
  }),
  makeExpense({
    _id: "dec" as Id<"expenses">,
    amount: 70,
    date: "2024-12-10T10:00",
  }),
];

const ids = (value: unknown) =>
  (value as Expense[] | undefined)?.map((e) => e._id);

beforeEach(() => {
  routeState.current = {
    date: new Date(2025, 2, 1),
    year: 2025,
    monthIndex: 2,
    category: undefined,
    goToMonth,
    selectCategory,
  };
  expensesState.current = expenses;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  for (const key of Object.keys(captured)) delete captured[key];
});

describe("DashboardPage", () => {
  it("renders the heading with the selected month", () => {
    render(<DashboardPage />);
    expect(
      screen.getByRole("heading", { name: "Dashboard" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Overview of your bills for/)).toHaveTextContent(
      "2025",
    );
    expect(screen.getByTestId("month-picker")).toBeInTheDocument();
  });

  it("passes undefined data to every section while loading", () => {
    expensesState.current = undefined;
    render(<DashboardPage />);

    expect(captured["summary-cards"]?.current).toBeUndefined();
    expect(captured["monthly-trend"]?.expenses).toBeUndefined();
    expect(captured["category-breakdown"]?.expenses).toBeUndefined();
    expect(captured["bills-table"]?.expenses).toBeUndefined();
  });

  it("splits expenses into year, month and previous month data", () => {
    render(<DashboardPage />);

    expect(ids(captured["monthly-trend"]?.expenses)).toEqual([
      "mar-housing",
      "mar-food",
      "feb",
    ]);
    expect(ids(captured["category-breakdown"]?.expenses)).toEqual([
      "mar-housing",
      "mar-food",
    ]);
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
    expect(screen.queryByTestId("category-detail")).not.toBeInTheDocument();
  });

  it("compares January with the previous December", () => {
    routeState.current = {
      ...routeState.current,
      monthIndex: 0,
      date: new Date(2025, 0, 1),
    };
    render(<DashboardPage />);
    expect((captured["summary-cards"]?.previous as ExpenseTotals).total).toBe(
      70,
    );
  });

  it("filters the bills and shows the category detail when a category is selected", () => {
    routeState.current = { ...routeState.current, category: "Housing" };
    render(<DashboardPage />);

    expect(ids(captured["bills-table"]?.expenses)).toEqual(["mar-housing"]);
    expect(captured["bills-table"]?.category).toBe("Housing");
    expect(ids(captured["category-detail"]?.expenses)).toEqual([
      "mar-housing",
      "feb",
    ]);
    expect(captured["category-breakdown"]?.selectedCategory).toBe("Housing");

    (captured["category-detail"]?.onClose as () => void)();
    expect(selectCategory).toHaveBeenCalledWith(undefined);
  });

  it("navigates between months", () => {
    render(<DashboardPage />);

    fireEvent.click(screen.getByRole("button", { name: "Previous month" }));
    expect(goToMonth).toHaveBeenCalledWith(2025, 1);

    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(goToMonth).toHaveBeenCalledWith(2025, 3);

    fireEvent.click(screen.getByRole("button", { name: "Pick July 2024" }));
    expect(goToMonth).toHaveBeenCalledWith(2024, 6);

    (captured["monthly-trend"]?.onSelectMonth as (m: number) => void)(8);
    expect(goToMonth).toHaveBeenCalledWith(2025, 8);
  });

  it("selects categories from the breakdown", () => {
    render(<DashboardPage />);
    (captured["category-breakdown"]?.onSelectCategory as (c?: string) => void)(
      "Food",
    );
    expect(selectCategory).toHaveBeenCalledWith("Food");
  });

  it("lets the bills table change the category", () => {
    render(<DashboardPage />);
    (captured["bills-table"]?.onCategoryChange as (c?: string) => void)(
      "Housing",
    );
    expect(selectCategory).toHaveBeenCalledWith("Housing");
  });
});
