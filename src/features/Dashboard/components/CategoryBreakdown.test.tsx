// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

vi.mock("@chakra-ui/charts", () => ({
  Chart: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="chart-root">{children}</div>
    ),
    Tooltip: () => null,
    RadialText: ({ title }: { title: React.ReactNode }) => <span>{title}</span>,
  },
  useChart: (opts: { data: unknown[] }) => ({
    data: opts.data,
    key: (k: string) => k,
    color: (c: string) => c,
  }),
}));

vi.mock("recharts", () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Pie: ({
    data,
    onClick,
  }: {
    data: Array<{ name: string }>;
    onClick?: (data: unknown, index: number) => void;
  }) => (
    <div data-testid="pie">
      {data.map((slice, index) => (
        <button
          key={slice.name}
          type="button"
          onClick={() => onClick?.(slice, index)}
        >
          {`slice-${slice.name}`}
        </button>
      ))}
    </div>
  ),
  Label: () => null,
  Tooltip: () => null,
}));

import type { Id } from "../../../../convex/_generated/dataModel";
import type { Expense } from "@/features/Dashboard/utils/dashboardMetrics";
import CategoryBreakdown from "./CategoryBreakdown";

const NOW = new Date(2025, 2, 15, 12, 0);

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    _id: "exp1" as Id<"expenses">,
    _creationTime: 0,
    userId: "user1" as Id<"users">,
    name: "Rent",
    amount: 100,
    category: "Housing",
    date: "2025-03-20T10:00",
    ...overrides,
  };
}

const expenses = [
  makeExpense({ category: "Housing", amount: 300, paidAt: "2025-03-01T10:00" }),
  makeExpense({ category: "Food", amount: 75, date: "2025-03-01T10:00" }),
  makeExpense({ category: "Food", amount: 25 }),
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
});

function renderBreakdown(
  props: Partial<React.ComponentProps<typeof CategoryBreakdown>> = {},
) {
  const onSelectCategory = vi.fn();
  render(
    <ChakraProvider value={defaultSystem}>
      <CategoryBreakdown
        expenses={expenses}
        monthLabel="March 2025"
        onSelectCategory={onSelectCategory}
        now={NOW}
        {...props}
      />
    </ChakraProvider>,
  );
  return { onSelectCategory };
}

const categoryButton = (name: string) =>
  within(screen.getByRole("list", { name: "Categories" })).getByRole("button", {
    name: new RegExp(name),
  });

describe("CategoryBreakdown", () => {
  it("shows the title and a skeleton while loading", () => {
    renderBreakdown({ expenses: undefined });
    expect(screen.getByText("Spending by category")).toBeInTheDocument();
    expect(screen.getByText("March 2025")).toBeInTheDocument();
    expect(screen.queryByTestId("pie")).not.toBeInTheDocument();
  });

  it("shows an empty state when the month has no expenses", () => {
    renderBreakdown({ expenses: [] });
    expect(
      screen.getByText("No expenses found for this month."),
    ).toBeInTheDocument();
  });

  it("lists categories ranked by total with share and status", () => {
    renderBreakdown();
    const items = within(
      screen.getByRole("list", { name: "Categories" }),
    ).getAllByRole("button");

    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Housing");
    expect(items[0]).toHaveTextContent("75.0%");
    expect(items[0]).toHaveTextContent("1 bill · all paid");
    expect(items[1]).toHaveTextContent("Food");
    expect(items[1]).toHaveTextContent("25.0%");
    expect(items[1]).toHaveTextContent("2 bills · 2 open · 1 overdue");
  });

  it("selects a category from the list", () => {
    const { onSelectCategory } = renderBreakdown();
    fireEvent.click(categoryButton("Food"));
    expect(onSelectCategory).toHaveBeenCalledWith("Food");
  });

  it("deselects the selected category and allows clearing the filter", () => {
    const { onSelectCategory } = renderBreakdown({ selectedCategory: "Food" });

    const food = categoryButton("Food");
    expect(food).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(food);
    expect(onSelectCategory).toHaveBeenCalledWith(undefined);

    fireEvent.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(onSelectCategory).toHaveBeenLastCalledWith(undefined);
  });

  it("selects a category from the donut slices", () => {
    const { onSelectCategory } = renderBreakdown();
    fireEvent.click(screen.getByRole("button", { name: "slice-Housing" }));
    expect(onSelectCategory).toHaveBeenCalledWith("Housing");
  });

  it("groups small categories into an unselectable Other slice", () => {
    const many = Array.from({ length: 9 }, (_, i) =>
      makeExpense({ category: `Cat ${i}`, amount: 100 - i }),
    );
    const { onSelectCategory } = renderBreakdown({ expenses: many });

    const slices = within(screen.getByTestId("pie")).getAllByRole("button");
    expect(slices).toHaveLength(8);
    fireEvent.click(screen.getByRole("button", { name: "slice-Other" }));
    expect(onSelectCategory).not.toHaveBeenCalled();
  });
});
