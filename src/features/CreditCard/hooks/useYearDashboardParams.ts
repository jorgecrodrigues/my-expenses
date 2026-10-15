import React from "react";
import { useSearchParams } from "wouter";

const YEAR_PARAM_PATTERN = /^\d{4}$/;
const MONTH_PARAM_PATTERN = /^(0?[1-9]|1[0-2])$/;

/**
 * Reads the yearly dashboard selection from the query string (`?year=YYYY`,
 * `?month=1..12`, `?category=`), so the credit card page keeps its state on
 * reload and works with the browser history. `year` is undefined when the URL
 * does not pick one, letting the caller choose a default.
 */
export default function useYearDashboardParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const category = searchParams.get("category") || undefined;

  const year =
    yearParam && YEAR_PARAM_PATTERN.test(yearParam)
      ? Number(yearParam)
      : undefined;
  const monthIndex =
    monthParam && MONTH_PARAM_PATTERN.test(monthParam)
      ? Number(monthParam) - 1
      : undefined;

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

  /** Changes the year and clears the selected month. */
  const goToYear = React.useCallback(
    (nextYear: number) =>
      updateParams({ year: String(nextYear), month: undefined }),
    [updateParams],
  );

  const selectMonth = React.useCallback(
    (nextMonthIndex?: number) =>
      updateParams({
        month:
          nextMonthIndex === undefined ? undefined : String(nextMonthIndex + 1),
      }),
    [updateParams],
  );

  const selectCategory = React.useCallback(
    (nextCategory?: string) => updateParams({ category: nextCategory }),
    [updateParams],
  );

  return {
    year,
    monthIndex,
    category,
    goToYear,
    selectMonth,
    selectCategory,
  };
}
