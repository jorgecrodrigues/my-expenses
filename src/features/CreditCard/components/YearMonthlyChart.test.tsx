// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

vi.mock("@/features/Dashboard/components/MonthlyStackedBarChart", () => ({
  default: ({
    data,
    series,
    selectedMonthIndex,
    onSelectMonth,
  }: {
    data: Record<string, number>[];
    series: { id: string; label: string }[];
    selectedMonthIndex?: number;
    onSelectMonth?: (monthIndex: number) => void;
  }) => (
    <div>
      <span>Series {series.map((s) => s.label).join(",")}</span>
      <span>March {JSON.stringify(data[2])}</span>
      <span>Selected {String(selectedMonthIndex)}</span>
      <button onClick={() => onSelectMonth?.(2)}>bar-march</button>
    </div>
  ),
}));

import YearMonthlyChart from "./YearMonthlyChart";
import type {
  PeriodSummary,
  YearReport,
} from "../../../../convex/lib/creditCardReport";

const emptyPeriod: PeriodSummary = {
  statementCount: 0,
  totalSpentCents: 0,
  refundsCents: 0,
  netCents: 0,
  transactionCount: 0,
  internationalCents: 0,
  iofCents: 0,
  feesCents: 0,
  interestCents: 0,
  byIssuer: [],
  byCategory: [],
  topMerchants: [],
};

function makeReport(totalSpentCents = 50000): YearReport {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: `2026-${String(i + 1).padStart(2, "0")}`,
    ...emptyPeriod,
  }));
  months[2] = {
    ...months[2],
    totalSpentCents,
    byIssuer: [
      { issuer: "nubank", totalSpentCents: 30000 },
      { issuer: "inter", totalSpentCents: 20000 },
    ],
    byCategory: [
      { category: "food", totalCents: 40000, count: 4 },
      { category: "transport", totalCents: 10000, count: 1 },
    ],
  };
  return {
    year: 2026,
    ...emptyPeriod,
    totalSpentCents,
    byIssuer: months[2].byIssuer,
    byCategory: months[2].byCategory,
    months,
  };
}

function renderChart(
  props: Partial<ComponentProps<typeof YearMonthlyChart>> = {},
) {
  const onSelectMonth = vi.fn();
  render(
    <ChakraProvider value={defaultSystem}>
      <YearMonthlyChart
        report={makeReport()}
        onSelectMonth={onSelectMonth}
        {...props}
      />
    </ChakraProvider>,
  );
  return { onSelectMonth: props.onSelectMonth ?? onSelectMonth };
}

afterEach(() => {
  cleanup();
});

const normalizeSpaces = (value: string | null) => value?.replace(/\s/g, " ");

describe("YearMonthlyChart", () => {
  it("stacks the months by card by default", () => {
    renderChart();
    expect(screen.getByText("Monthly overview · 2026")).toBeInTheDocument();
    expect(screen.getByText("Series Nubank,Inter")).toBeInTheDocument();
    expect(
      screen.getByText('March {"nubank":300,"inter":200}'),
    ).toBeInTheDocument();
    expect(
      normalizeSpaces(screen.getByText(/^Year total/).textContent),
    ).toBe("Year total R$ 500,00 · Monthly average R$ 500,00");
  });

  it("switches to one series per category", () => {
    renderChart();
    fireEvent.click(screen.getByRole("button", { name: "By category" }));
    expect(screen.getByText("Series Food,Transport")).toBeInTheDocument();
    expect(screen.getByText('March {"k0":400,"k1":100}')).toBeInTheDocument();
  });

  it("shows only the selected category in the category view", () => {
    renderChart({ selectedCategory: "transport" });
    fireEvent.click(screen.getByRole("button", { name: "By category" }));
    expect(screen.getByText("Series Transport")).toBeInTheDocument();
    expect(screen.getByText(/^Transport · Year total/)).toBeInTheDocument();
  });

  it("selects a month and clears it when clicked again", () => {
    const first = renderChart();
    fireEvent.click(screen.getByRole("button", { name: "bar-march" }));
    expect(first.onSelectMonth).toHaveBeenCalledWith(2);
    cleanup();

    const second = renderChart({ selectedMonthIndex: 2 });
    expect(screen.getByText("Selected 2")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "bar-march" }));
    expect(second.onSelectMonth).toHaveBeenCalledWith(undefined);
  });

  it("explains when there is nothing to chart", () => {
    renderChart({ report: makeReport(0) });
    expect(screen.getByText("No processed statements in 2026.")).toBeInTheDocument();
    cleanup();

    renderChart({ report: makeReport(0), selectedCategory: "food" });
    expect(screen.getByText("No spending in Food in 2026.")).toBeInTheDocument();
  });
});
