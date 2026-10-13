import type { Doc } from "../../../../convex/_generated/dataModel";

export type Expense = Doc<"expenses">;

export type ExpenseStatus = "paid" | "pending" | "overdue";

export interface ExpenseTotals {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  count: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
}

export interface MonthTotals extends ExpenseTotals {
  monthIndex: number;
}

export interface GroupTotals extends ExpenseTotals {
  key: string;
}

const STATUS_COUNT_KEY = {
  paid: "paidCount",
  pending: "pendingCount",
  overdue: "overdueCount",
} as const satisfies Record<ExpenseStatus, keyof ExpenseTotals>;

export const createEmptyTotals = (): ExpenseTotals => ({
  total: 0,
  paid: 0,
  pending: 0,
  overdue: 0,
  count: 0,
  paidCount: 0,
  pendingCount: 0,
  overdueCount: 0,
});

/**
 * A bill is "paid" when it has a payment date, "overdue" when its due date is
 * before `now`, and "pending" otherwise.
 */
export function getExpenseStatus(
  expense: Pick<Expense, "date" | "paidAt">,
  now: Date,
): ExpenseStatus {
  if (expense.paidAt) return "paid";
  return new Date(expense.date).getTime() < now.getTime()
    ? "overdue"
    : "pending";
}

function addToTotals(totals: ExpenseTotals, expense: Expense, now: Date) {
  const status = getExpenseStatus(expense, now);
  totals.total += expense.amount;
  totals.count += 1;
  totals[status] += expense.amount;
  totals[STATUS_COUNT_KEY[status]] += 1;
}

export function summarizeExpenses(
  expenses: Expense[],
  now: Date,
): ExpenseTotals {
  const totals = createEmptyTotals();
  for (const expense of expenses) {
    addToTotals(totals, expense, now);
  }
  return totals;
}

export function isInMonth(
  expense: Pick<Expense, "date">,
  year: number,
  monthIndex: number,
): boolean {
  const date = new Date(expense.date);
  return date.getFullYear() === year && date.getMonth() === monthIndex;
}

export function filterByMonth(
  expenses: Expense[],
  year: number,
  monthIndex: number,
): Expense[] {
  return expenses.filter((expense) => isInMonth(expense, year, monthIndex));
}

export function filterByYear(expenses: Expense[], year: number): Expense[] {
  return expenses.filter(
    (expense) => new Date(expense.date).getFullYear() === year,
  );
}

/** Returns 12 entries (January to December) with the totals of `year`. */
export function groupByMonth(
  expenses: Expense[],
  year: number,
  now: Date,
): MonthTotals[] {
  const months: MonthTotals[] = Array.from({ length: 12 }, (_, monthIndex) => ({
    monthIndex,
    ...createEmptyTotals(),
  }));

  for (const expense of expenses) {
    const date = new Date(expense.date);
    if (date.getFullYear() !== year) continue;
    addToTotals(months[date.getMonth()], expense, now);
  }

  return months;
}

/** Groups expenses by `getKey`, sorted by total (desc) and then by key. */
export function groupBy(
  expenses: Expense[],
  getKey: (expense: Expense) => string,
  now: Date,
): GroupTotals[] {
  const groups = new Map<string, GroupTotals>();

  for (const expense of expenses) {
    const key = getKey(expense);
    let group = groups.get(key);
    if (!group) {
      group = { key, ...createEmptyTotals() };
      groups.set(key, group);
    }
    addToTotals(group, expense, now);
  }

  return [...groups.values()].sort(
    (a, b) => b.total - a.total || a.key.localeCompare(b.key),
  );
}

/**
 * Returns 12 records (January to December) mapping each key to the amount
 * spent in that month of `year`.
 */
export function getMonthlyAmountsByKey(
  expenses: Expense[],
  year: number,
  getKey: (expense: Expense) => string,
): Record<string, number>[] {
  const months: Record<string, number>[] = Array.from(
    { length: 12 },
    () => ({}),
  );

  for (const expense of expenses) {
    const date = new Date(expense.date);
    if (date.getFullYear() !== year) continue;
    const month = months[date.getMonth()];
    const key = getKey(expense);
    month[key] = (month[key] ?? 0) + expense.amount;
  }

  return months;
}

export function getPreviousMonth(
  year: number,
  monthIndex: number,
): { year: number; monthIndex: number } {
  return monthIndex === 0
    ? { year: year - 1, monthIndex: 11 }
    : { year, monthIndex: monthIndex - 1 };
}

/** Percentage change from `previous` to `current`, or null when undefined. */
export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function getMonthLabel(
  monthIndex: number,
  format: "long" | "short" = "long",
): string {
  return new Date(2000, monthIndex, 1).toLocaleString(undefined, {
    month: format,
  });
}
