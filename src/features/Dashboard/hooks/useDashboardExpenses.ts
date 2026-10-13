import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

/**
 * Loads every expense needed by the dashboard for `year`: the whole year plus
 * the previous December (for month-over-month comparison). The range is padded
 * by a day on each side because dates are bucketed by local time on the client.
 */
export default function useDashboardExpenses(year: number) {
  return useQuery(api.expenses.getExpensesInRange, {
    start: `${year - 1}-11-30`,
    end: `${year + 1}-01-02`,
  });
}
