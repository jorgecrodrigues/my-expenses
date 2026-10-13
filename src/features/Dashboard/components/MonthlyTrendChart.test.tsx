// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

type ChartProps = {
  data: Record<string, number>[];
  series: Array<{ id: string; label: string }>;
  selectedMonthIndex?: number;
  onSelectMonth?: (monthIndex: number) => void;
};

const { chartProps } = vi.hoisted(() => ({
  chartProps: { current: null as ChartProps | null },
}));

vi.mock("./MonthlyStackedBarChart", () => ({
  default: (props: ChartProps) => {
    chartProps.current = props;
    return <div data-testid="stacked-chart" />;
  },
}));

import type { Id } from "../../../../convex/_generated/dataModel";
import type { Expense } from "@/features/Dashboard/utils/dashboardMetrics";
import MonthlyTrendChart from "./MonthlyTrendChart";

const NOW = new Date(2025, 2, 15, 12, 0);

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    _id: "exp1" as Id<"expenses">,
    _creationTime: 0,
    userId: "user1" as Id<"users">,
    name: "Rent",
    amount: 100,
    category: "Housing",
    date: "2025-01-10T10:00",
    ...overrides,
  };
}

const expenses = [
  makeExpense({ amount: 100, paidAt: "2025-01-10T10:00" }),
  makeExpense({ amount: 300, category: "Food", date: "2025-03-01T10:00" }),
  makeExpense({ amount: 50, category: "Food", date: "2025-04-01T10:00" }),
];

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
  chartProps.current = null;
});

function renderChart(
  props: Partial<React.ComponentProps<typeof MonthlyTrendChart>> = {},
) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <MonthlyTrendChart
        expenses={expenses}
        year={2025}
        selectedMonthIndex={2}
        onSelectMonth={vi.fn()}
        now={NOW}
        {...props}
      />
    </ChakraProvider>,
  );
}

describe("MonthlyTrendChart", () => {
  it("shows a skeleton while loading", () => {
    renderChart({ expenses: undefined });
    expect(screen.getByText("Monthly overview · 2025")).toBeInTheDocument();
    expect(screen.queryByTestId("stacked-chart")).not.toBeInTheDocument();
  });

  it("shows an empty state when the year has no expenses", () => {
    renderChart({ expenses: [] });
    expect(
      screen.getByText("No expenses recorded in 2025."),
    ).toBeInTheDocument();
  });

  it("shows the year total and monthly average", () => {
    renderChart();
    const summary = screen
      .getByText(/Year total/)
      .textContent?.replace(/\s/g, " ");
    expect(summary).toBe("Year total R$ 450,00 · Monthly average R$ 150,00");
  });

  it("charts the months by status by default", () => {
    const onSelectMonth = vi.fn();
    renderChart({ onSelectMonth });

    expect(chartProps.current?.series.map((s) => s.id)).toEqual([
      "paid",
      "pending",
      "overdue",
    ]);
    expect(chartProps.current?.data[0]).toEqual({
      paid: 100,
      pending: 0,
      overdue: 0,
    });
    expect(chartProps.current?.data[2]).toEqual({
      paid: 0,
      pending: 0,
      overdue: 300,
    });
    expect(chartProps.current?.data[3]).toEqual({
      paid: 0,
      pending: 50,
      overdue: 0,
    });
    expect(chartProps.current?.selectedMonthIndex).toBe(2);

    chartProps.current?.onSelectMonth?.(5);
    expect(onSelectMonth).toHaveBeenCalledWith(5);
  });

  it("switches to the category view", () => {
    renderChart();
    fireEvent.click(screen.getByRole("button", { name: "By category" }));

    expect(chartProps.current?.series.map((s) => s.label)).toEqual([
      "Food",
      "Housing",
    ]);
    expect(chartProps.current?.data[0]).toEqual({ k1: 100 });
    expect(chartProps.current?.data[2]).toEqual({ k0: 300 });
  });
});
