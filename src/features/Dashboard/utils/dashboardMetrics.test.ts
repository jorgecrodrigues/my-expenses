import { describe, expect, it } from "vitest";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  createEmptyTotals,
  filterByMonth,
  filterByYear,
  getExpenseStatus,
  getMonthLabel,
  getMonthlyAmountsByKey,
  getPreviousMonth,
  groupBy,
  groupByMonth,
  isInMonth,
  percentChange,
  summarizeExpenses,
  type Expense,
} from "./dashboardMetrics";

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

describe("getExpenseStatus", () => {
  it("returns paid when the expense has a payment date", () => {
    expect(
      getExpenseStatus(
        makeExpense({ date: "2025-01-01T10:00", paidAt: "2025-01-02T10:00" }),
        NOW,
      ),
    ).toBe("paid");
  });

  it("returns overdue for unpaid expenses due before now", () => {
    expect(
      getExpenseStatus(makeExpense({ date: "2025-03-10T10:00" }), NOW),
    ).toBe("overdue");
  });

  it("returns pending for unpaid expenses due after now", () => {
    expect(
      getExpenseStatus(makeExpense({ date: "2025-03-20T10:00" }), NOW),
    ).toBe("pending");
  });

  it("treats an empty payment date as unpaid", () => {
    expect(
      getExpenseStatus(
        makeExpense({ date: "2025-03-20T10:00", paidAt: "" }),
        NOW,
      ),
    ).toBe("pending");
  });
});

describe("summarizeExpenses", () => {
  it("returns empty totals for no expenses", () => {
    expect(summarizeExpenses([], NOW)).toEqual(createEmptyTotals());
  });

  it("splits amounts and counts by status", () => {
    const totals = summarizeExpenses(
      [
        makeExpense({ amount: 100, paidAt: "2025-03-01T10:00" }),
        makeExpense({ amount: 50, date: "2025-03-01T10:00" }),
        makeExpense({ amount: 25, date: "2025-03-30T10:00" }),
      ],
      NOW,
    );

    expect(totals).toEqual({
      total: 175,
      paid: 100,
      pending: 25,
      overdue: 50,
      count: 3,
      paidCount: 1,
      pendingCount: 1,
      overdueCount: 1,
    });
  });
});

describe("month and year filters", () => {
  const expenses = [
    makeExpense({ _id: "a" as Id<"expenses">, date: "2025-03-01T00:30" }),
    makeExpense({ _id: "b" as Id<"expenses">, date: "2025-04-01T10:00" }),
    makeExpense({ _id: "c" as Id<"expenses">, date: "2024-03-10T10:00" }),
  ];

  it("checks whether an expense is in a month", () => {
    expect(isInMonth(expenses[0], 2025, 2)).toBe(true);
    expect(isInMonth(expenses[0], 2025, 3)).toBe(false);
    expect(isInMonth(expenses[2], 2025, 2)).toBe(false);
  });

  it("filters by month", () => {
    expect(filterByMonth(expenses, 2025, 2).map((e) => e._id)).toEqual(["a"]);
    expect(filterByMonth(expenses, 2025, 5)).toEqual([]);
  });

  it("filters by year", () => {
    expect(filterByYear(expenses, 2025).map((e) => e._id)).toEqual(["a", "b"]);
  });
});

describe("groupByMonth", () => {
  it("returns 12 months with totals and ignores other years", () => {
    const months = groupByMonth(
      [
        makeExpense({
          amount: 10,
          date: "2025-01-05T10:00",
          paidAt: "2025-01-05T10:00",
        }),
        makeExpense({ amount: 20, date: "2025-01-20T10:00" }),
        makeExpense({ amount: 30, date: "2025-12-01T10:00" }),
        makeExpense({ amount: 99, date: "2024-01-01T10:00" }),
      ],
      2025,
      NOW,
    );

    expect(months).toHaveLength(12);
    expect(months[0]).toMatchObject({
      monthIndex: 0,
      total: 30,
      paid: 10,
      overdue: 20,
      count: 2,
    });
    expect(months[11]).toMatchObject({
      monthIndex: 11,
      total: 30,
      pending: 30,
    });
    expect(months[5].total).toBe(0);
  });
});

describe("groupBy", () => {
  it("groups by key sorted by total desc, then by key", () => {
    const groups = groupBy(
      [
        makeExpense({ category: "Food", amount: 10 }),
        makeExpense({ category: "Housing", amount: 50 }),
        makeExpense({ category: "Food", amount: 40 }),
        makeExpense({ category: "Bills", amount: 50 }),
      ],
      (expense) => expense.category,
      NOW,
    );

    expect(groups.map((g) => [g.key, g.total, g.count])).toEqual([
      ["Bills", 50, 1],
      ["Food", 50, 2],
      ["Housing", 50, 1],
    ]);
  });

  it("returns an empty list for no expenses", () => {
    expect(groupBy([], (expense) => expense.name, NOW)).toEqual([]);
  });
});

describe("getMonthlyAmountsByKey", () => {
  it("sums amounts per key and month for the given year", () => {
    const months = getMonthlyAmountsByKey(
      [
        makeExpense({ name: "Rent", amount: 100, date: "2025-02-01T10:00" }),
        makeExpense({ name: "Rent", amount: 100, date: "2025-02-10T10:00" }),
        makeExpense({ name: "Water", amount: 30, date: "2025-02-10T10:00" }),
        makeExpense({ name: "Water", amount: 30, date: "2026-02-10T10:00" }),
      ],
      2025,
      (expense) => expense.name,
    );

    expect(months).toHaveLength(12);
    expect(months[1]).toEqual({ Rent: 200, Water: 30 });
    expect(months[0]).toEqual({});
  });
});

describe("getPreviousMonth", () => {
  it("returns the previous month in the same year", () => {
    expect(getPreviousMonth(2025, 5)).toEqual({ year: 2025, monthIndex: 4 });
  });

  it("wraps January to December of the previous year", () => {
    expect(getPreviousMonth(2025, 0)).toEqual({ year: 2024, monthIndex: 11 });
  });
});

describe("percentChange", () => {
  it("returns the percentage change", () => {
    expect(percentChange(150, 100)).toBe(50);
    expect(percentChange(50, 100)).toBe(-50);
  });

  it("returns null when the previous value is zero", () => {
    expect(percentChange(100, 0)).toBeNull();
  });
});

describe("getMonthLabel", () => {
  it("returns long and short month names", () => {
    const long = getMonthLabel(0);
    const short = getMonthLabel(0, "short");
    expect(long.length).toBeGreaterThan(0);
    expect(short.length).toBeGreaterThan(0);
    expect(short.length).toBeLessThanOrEqual(long.length);
  });
});
