// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";

vi.mock("@chakra-ui/charts", () => ({
  Chart: {
    Root: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Tooltip: () => null,
    RadialText: () => null,
  },
  useChart: (opts: { data: unknown[] }) => ({
    data: opts.data,
    key: (k: string) => k,
  }),
}));

vi.mock("recharts", () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({
    data,
    onClick,
  }: {
    data: { name: string; fillOpacity: number }[];
    onClick?: (entry: unknown, index: number) => void;
  }) => (
    <div>
      {data.map((slice, index) => (
        <span
          key={slice.name}
          data-testid={`slice-${slice.name}`}
          data-opacity={slice.fillOpacity}
          onClick={() => onClick?.({}, index)}
        />
      ))}
    </div>
  ),
  Label: () => null,
  Tooltip: () => null,
}));

import StatementCategoryChart from "./StatementCategoryChart";

const categories = [
  { category: "food", totalCents: 30000, count: 3 },
  { category: "transport", totalCents: 10000, count: 1 },
  { category: "refunds only", totalCents: -500, count: 1 },
];

function renderChart(
  props: Partial<React.ComponentProps<typeof StatementCategoryChart>> = {},
) {
  render(
    <ChakraProvider value={defaultSystem}>
      <StatementCategoryChart categories={categories} {...props} />
    </ChakraProvider>,
  );
}

afterEach(() => {
  cleanup();
});

describe("StatementCategoryChart", () => {
  it("lists the categories with spending as plain text by default", () => {
    renderChart({ subtitle: "Mar 2026" });
    expect(screen.getByText("Mar 2026")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("75.0%")).toBeInTheDocument();
    expect(screen.queryByText("Refunds only")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows the empty message", () => {
    renderChart({ categories: [], emptyMessage: "Nothing here." });
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("selects a category from the list or the pie when interactive", () => {
    const onSelectCategory = vi.fn();
    renderChart({ onSelectCategory });

    fireEvent.click(screen.getByRole("button", { name: /transport/i }));
    expect(onSelectCategory).toHaveBeenCalledWith("transport");

    fireEvent.click(screen.getByTestId("slice-Food"));
    expect(onSelectCategory).toHaveBeenCalledWith("food");
  });

  it("highlights the selected category and toggles it off", () => {
    const onSelectCategory = vi.fn();
    renderChart({ onSelectCategory, selectedCategory: "food" });

    expect(screen.getByRole("button", { name: /food/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("slice-Transport")).toHaveAttribute("data-opacity", "0.3");

    fireEvent.click(screen.getByRole("button", { name: /food/i }));
    expect(onSelectCategory).toHaveBeenLastCalledWith(undefined);

    fireEvent.click(screen.getByRole("button", { name: "Clear filter" }));
    expect(onSelectCategory).toHaveBeenLastCalledWith(undefined);
  });
});
