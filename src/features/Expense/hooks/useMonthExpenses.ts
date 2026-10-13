import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { toDateInputValue } from "../utils/recurrence";

/**
 * Loads the expenses of the given month and of the previous one (for the
 * month-over-month comparison). The range is padded by a day on each side
 * because dates are bucketed by local time on the client.
 */
export default function useMonthExpenses(year: number, monthIndex: number) {
  return useQuery(api.expenses.getExpensesInRange, {
    start: toDateInputValue(new Date(year, monthIndex - 1, 0)),
    end: toDateInputValue(new Date(year, monthIndex + 1, 2)),
  });
}
