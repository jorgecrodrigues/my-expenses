import React from "react";
import { useSearchParams } from "wouter";

const MONTH_PARAM_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function formatMonthParam(year: number, monthIndex: number): string {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

/**
 * Reads the selected month (`?month=YYYY-MM`, defaulting to the current month)
 * and category (`?category=`) from the query string, so the expenses page
 * keeps its state on reload and works with the browser history.
 */
export default function useExpenseMonth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const monthParam = searchParams.get("month");
  const category = searchParams.get("category") || undefined;

  const { year, monthIndex } = React.useMemo(() => {
    const match = monthParam?.match(MONTH_PARAM_PATTERN);
    if (match) {
      return { year: Number(match[1]), monthIndex: Number(match[2]) - 1 };
    }
    const today = new Date();
    return { year: today.getFullYear(), monthIndex: today.getMonth() };
  }, [monthParam]);

  const updateParams = React.useCallback(
    (changes: Record<string, string | undefined>) =>
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      }),
    [setSearchParams],
  );

  const goToMonth = React.useCallback(
    (nextYear: number, nextMonthIndex: number) => {
      const target = new Date(nextYear, nextMonthIndex, 1);
      updateParams({
        month: formatMonthParam(target.getFullYear(), target.getMonth()),
      });
    },
    [updateParams],
  );

  const setCategory = React.useCallback(
    (nextCategory?: string) => updateParams({ category: nextCategory }),
    [updateParams],
  );

  return { year, monthIndex, category, goToMonth, setCategory };
}
