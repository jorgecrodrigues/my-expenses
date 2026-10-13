import React from "react";
import { useLocation, useParams } from "wouter";

type DashboardParams = {
  month?: string;
  year?: string;
  category?: string;
};

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function buildDashboardPath(
  year: number,
  monthIndex: number,
  category?: string,
): string {
  const base = `/dashboard/month/${monthIndex + 1}/year/${year}`;
  return category ? `${base}/category/${encodeURIComponent(category)}` : base;
}

/**
 * Reads the dashboard month/year/category from the route (defaulting to the
 * current month) and exposes helpers to navigate between them.
 */
export default function useDashboardRoute() {
  const params = useParams<DashboardParams>();
  const [, setLocation] = useLocation();

  const date = React.useMemo(() => {
    const month = params.month ? parseInt(params.month, 10) - 1 : NaN;
    const year = params.year ? parseInt(params.year, 10) : NaN;

    if (Number.isNaN(month) || Number.isNaN(year)) {
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1);
    }

    return new Date(year, month, 1);
  }, [params.month, params.year]);

  const year = date.getFullYear();
  const monthIndex = date.getMonth();
  const category = params.category ? safeDecode(params.category) : undefined;

  const goToMonth = React.useCallback(
    (nextYear: number, nextMonthIndex: number) => {
      const target = new Date(nextYear, nextMonthIndex, 1);
      setLocation(
        buildDashboardPath(target.getFullYear(), target.getMonth(), category),
      );
    },
    [category, setLocation],
  );

  const selectCategory = React.useCallback(
    (nextCategory?: string) => {
      setLocation(buildDashboardPath(year, monthIndex, nextCategory));
    },
    [monthIndex, setLocation, year],
  );

  return { date, year, monthIndex, category, goToMonth, selectCategory };
}
