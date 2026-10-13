// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
import CategoryDetail from "./CategoryDetail";

const NOW = new Date(2025, 2, 15, 12, 0);

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    _id: "exp1" as Id<"expenses">,
    _creationTime: 0,
    userId: "user1" as Id<"users">,
    name: "Rent",
    amount: 1000,
    category: "Housing",
    date: "2025-01-10T10:00",
    ...overrides,
  };
}

const expenses = [
  makeExpense({ paidAt: "2025-01-10T10:00" }),
  makeExpense({ date: "2025-02-10T10:00" }),
  makeExpense({ name: "Condo fee", amount: 300, date: "2025-02-10T10:00" }),
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

function renderDetail(
  props: Partial<React.ComponentProps<typeof CategoryDetail>> = {},
) {
  const onClose = vi.fn();
  const onSelectMonth = vi.fn();
  render(
    <ChakraProvider value={defaultSystem}>
      <CategoryDetail
        category="Housing"
        year={2025}
        expenses={expenses}
        selectedMonthIndex={1}
        onSelectMonth={onSelectMonth}
        onClose={onClose}
        now={NOW}
        {...props}
      />
    </ChakraProvider>,
  );
  return { onClose, onSelectMonth };
}

describe("CategoryDetail", () => {
  it("shows the title and a skeleton while loading", () => {
    renderDetail({ expenses: undefined });
    expect(screen.getByText("Housing · 2025")).toBeInTheDocument();
    expect(screen.queryByTestId("stacked-chart")).not.toBeInTheDocument();
  });

  it("shows an empty state when the category has no expenses", () => {
    renderDetail({ expenses: [] });
    expect(
      screen.getByText("No expenses in Housing for 2025."),
    ).toBeInTheDocument();
  });

  it("summarizes the category totals", () => {
    renderDetail();
    expect(screen.getByText(/R\$\s2\.300,00/).parentElement).toHaveTextContent(
      /^Total/,
    );
    expect(
      screen
        .getAllByText(/R\$\s1\.300,00/)
        .map((el) => el.parentElement?.textContent?.split(/\s/)[0]),
    ).toEqual(["Left", "Overdue"]);
    expect(screen.getByText("43% paid")).toBeInTheDocument();
  });

  it("charts one series per bill name and forwards month selection", () => {
    const { onSelectMonth } = renderDetail();

    expect(chartProps.current?.series.map((s) => s.label)).toEqual([
      "Rent",
      "Condo fee",
    ]);
    expect(chartProps.current?.data[1]).toEqual({ k0: 1000, k1: 300 });
    expect(chartProps.current?.selectedMonthIndex).toBe(1);

    chartProps.current?.onSelectMonth?.(3);
    expect(onSelectMonth).toHaveBeenCalledWith(3);
  });

  it("toggles bills shown in the chart", async () => {
    const user = userEvent.setup();
    renderDetail();
    const rent = screen.getByRole("checkbox", { name: /Rent/ });
    expect(rent).toBeChecked();

    await user.click(rent);
    await waitFor(() =>
      expect(chartProps.current?.series.map((s) => s.label)).toEqual([
        "Condo fee",
      ]),
    );
    expect(rent).not.toBeChecked();
    expect(
      screen.getByText("Bills shown in the chart (1/2)"),
    ).toBeInTheDocument();

    await user.click(rent);
    await waitFor(() =>
      expect(chartProps.current?.series.map((s) => s.label)).toEqual([
        "Rent",
        "Condo fee",
      ]),
    );
  });

  it("clears and selects all bills", () => {
    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(
      screen.getByText("Select at least one bill to see the chart."),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("stacked-chart")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(screen.getByTestId("stacked-chart")).toBeInTheDocument();
  });

  it("renders a card per bill with paid and overdue info", () => {
    renderDetail();
    expect(screen.getAllByText("1 overdue")).toHaveLength(2);
    expect(screen.getByText(/Total \(2 bills\)/)).toBeInTheDocument();
    expect(screen.getByText(/Total \(1 bill\)/)).toBeInTheDocument();
  });

  it("filters the bill list when there are many bills", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      makeExpense({ name: `Bill ${i}` }),
    );
    renderDetail({ expenses: many });

    fireEvent.change(screen.getByRole("textbox", { name: "Filter bills" }), {
      target: { value: "Bill 3" },
    });
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
  });

  it("calls onClose from the close button", () => {
    const { onClose } = renderDetail();
    fireEvent.click(
      screen.getByRole("button", { name: "Close category detail" }),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
