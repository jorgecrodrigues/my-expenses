// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    users: { viewer: "users.viewer" },
    expenses: { getExpenseByCategory: "getExpenseByCategory" },
  },
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("wouter", () => ({
  useParams: vi.fn(),
}));

vi.mock("@/shared/utils/color", () => ({
  generateColorByString: () => "#336699",
  getContrastingTextColor: () => "#ffffff",
}));

vi.mock("@chakra-ui/charts", () => ({
  Chart: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="chart-root">{children}</div>
    ),
    Tooltip: () => null,
  },
  useChart: (opts: {
    data: unknown[];
    series: Array<{ name: string; color: string; stackId: string }>;
  }) => ({
    data: opts.data,
    series: opts.series,
    key: (k: string) => k,
    color: (c: string) => c,
    formatNumber: () => (n: number) => String(n),
  }),
}));

vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="recharts-bar-chart">{children}</div>
  ),
  Bar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="recharts-bar">{children}</div>
  ),
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  LabelList: () => null,
}));

vi.mock("@chakra-ui/react", () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Checkbox: {
    Root: ({
      children,
      checked,
      onCheckedChange,
    }: {
      children: React.ReactNode;
      checked?: boolean;
      onCheckedChange?: (details: { checked: boolean }) => void;
    }) => {
      const labelText =
        React.Children.toArray(children)
          .filter(React.isValidElement)
          .map((child) => (child.props as { children?: React.ReactNode }).children)
          .find((value) => typeof value === "string") ?? "expense";

      return (
        <label>
          <input
            type="checkbox"
            aria-label={labelText}
            checked={checked}
            onChange={(event) =>
              onCheckedChange?.({ checked: event.target.checked })
            }
          />
          {children}
        </label>
      );
    },
    HiddenInput: () => null,
    Control: () => null,
    Label: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
  },
  HStack: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Progress: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="progress-root">{children}</div>
    ),
    ValueText: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
    Track: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Range: () => null,
  },
  SimpleGrid: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Skeleton: () => <div data-testid="skeleton" />,
  Span: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  VStack: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

import { useQuery } from "convex/react";
import { useParams } from "wouter";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import CategoryDetail from "./CategoryDetail";

function makeExpense(overrides: Partial<Doc<"expenses">> = {}): Doc<"expenses"> {
  return {
    _id: "exp1" as Id<"expenses">,
    _creationTime: Date.now(),
    userId: "user1" as Id<"users">,
    name: "Rent",
    description: "Monthly",
    amount: 200,
    category: "Housing",
    date: "2025-03-15T12:00:00.000Z",
    paidAt: undefined,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CategoryDetail", () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({
      month: "3",
      year: "2025",
      category: "Housing",
    });
    vi.mocked(useQuery).mockImplementation(
      ((query: unknown) => {
        if (query === "users.viewer") return { _id: "user1" };
        if (query === "getExpenseByCategory") return [makeExpense()];
        return undefined;
      }) as typeof useQuery,
    );
  });

  it("shows chart and subcategory skeletons while expenses are loading", () => {
    vi.mocked(useQuery).mockImplementation(
      ((query: unknown) => {
        if (query === "users.viewer") return { _id: "user1" };
        if (query === "getExpenseByCategory") return undefined;
        return undefined;
      }) as typeof useQuery,
    );
    render(<CategoryDetail />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("chart-root")).not.toBeInTheDocument();
  });

  it("renders the breakdown title with category and year from the route", () => {
    render(<CategoryDetail />);
    const title = screen.getByText(/Breakdown of expenses by month for/);
    expect(title).toHaveTextContent("Housing");
    expect(title).toHaveTextContent("2025");
  });

  it("renders the chart when data is available", () => {
    render(<CategoryDetail />);
    expect(screen.getByTestId("chart-root")).toBeInTheDocument();
    expect(screen.getByTestId("recharts-bar-chart")).toBeInTheDocument();
  });

  it("renders paid progress copy and the by-name grid for expenses", () => {
    render(<CategoryDetail />);
    expect(screen.getAllByText(/paid/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/left to pay/i).length).toBeGreaterThan(0);
    expect(screen.getByText("By expense name")).toBeInTheDocument();
    expect(screen.getByText("Rent")).toBeInTheDocument();
  });

  it("renders expense name checkboxes and toggles chart visibility", () => {
    render(<CategoryDetail />);
    const checkbox = screen.getByRole("checkbox", { name: "Rent" });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
