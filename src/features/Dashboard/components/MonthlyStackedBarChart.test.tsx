// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("@chakra-ui/charts", () => ({
  Chart: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="chart-root">{children}</div>
    ),
    Tooltip: () => null,
    Legend: () => null,
  },
  useChart: (opts: { data: unknown[]; series?: Array<{ name: string }> }) => ({
    data: opts.data,
    series: opts.series ?? [],
    key: (k: string) => k,
    color: (c: string) => c,
    getSeriesOpacity: () => undefined,
  }),
}));

vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({
    name,
    onClick,
  }: {
    name: string;
    onClick?: (data: unknown, index: number) => void;
  }) => (
    <button type="button" onClick={() => onClick?.({}, 4)}>
      {`bar-${name}`}
    </button>
  ),
  CartesianGrid: () => null,
  Legend: () => <div data-testid="legend" />,
  ReferenceArea: ({ x1 }: { x1: string }) => (
    <div data-testid="selected-month" data-month={x1} />
  ),
  ReferenceLine: ({ label }: { label: { value: string } }) => (
    <div data-testid="average-line">{label.value}</div>
  ),
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

import { getMonthLabel } from "@/features/Dashboard/utils/dashboardMetrics";
import MonthlyStackedBarChart from "./MonthlyStackedBarChart";

const series = [
  { id: "paid", label: "Paid", color: "green.solid" },
  { id: "pending", label: "Pending", color: "blue.solid" },
];

function makeData(): Record<string, number>[] {
  const data: Record<string, number>[] = Array.from({ length: 12 }, () => ({}));
  data[0] = { paid: 100 };
  data[1] = { paid: 200, pending: 100 };
  return data;
}

afterEach(() => {
  cleanup();
});

describe("MonthlyStackedBarChart", () => {
  it("renders one bar per series and the legend", () => {
    render(<MonthlyStackedBarChart data={makeData()} series={series} />);
    expect(
      screen.getByRole("button", { name: "bar-paid" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "bar-pending" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("legend")).toBeInTheDocument();
  });

  it("hides the legend when requested", () => {
    render(
      <MonthlyStackedBarChart
        data={makeData()}
        series={series}
        showLegend={false}
      />,
    );
    expect(screen.queryByTestId("legend")).not.toBeInTheDocument();
  });

  it("calls onSelectMonth with the clicked bar index", () => {
    const onSelectMonth = vi.fn();
    render(
      <MonthlyStackedBarChart
        data={makeData()}
        series={series}
        onSelectMonth={onSelectMonth}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "bar-paid" }));
    expect(onSelectMonth).toHaveBeenCalledWith(4);
  });

  it("highlights the selected month", () => {
    render(
      <MonthlyStackedBarChart
        data={makeData()}
        series={series}
        selectedMonthIndex={2}
      />,
    );
    expect(screen.getByTestId("selected-month")).toHaveAttribute(
      "data-month",
      getMonthLabel(2, "short"),
    );
  });

  it("draws the average of the months with spending", () => {
    render(<MonthlyStackedBarChart data={makeData()} series={series} />);
    expect(
      screen.getByTestId("average-line").textContent?.replace(/\s/g, " "),
    ).toBe("Avg R$ 200");
  });

  it("omits the average line when there is no spending", () => {
    render(
      <MonthlyStackedBarChart
        data={Array.from({ length: 12 }, () => ({}))}
        series={series}
      />,
    );
    expect(screen.queryByTestId("average-line")).not.toBeInTheDocument();
    expect(screen.queryByTestId("selected-month")).not.toBeInTheDocument();
  });
});
