// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// --- Mocks ---

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    users: { viewer: "viewer" },
    expenses: { getExpenseByCategory: "getExpenseByCategory" },
  },
}));

const useQueryMock = vi.fn();
let paramsMock: Record<string, string | undefined> = {};

vi.mock("convex/react", () => ({
  useQuery: (key: string) => useQueryMock(key),
}));

vi.mock("wouter", () => ({
  useParams: () => paramsMock,
}));

vi.mock("@/shared/utils/color", () => ({
  generateColorByString: () => "#123456",
  getContrastingTextColor: () => "#ffffff",
}));

// Mock recharts components
vi.mock("recharts", () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  CartesianGrid: () => null,
  LabelList: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

vi.mock("@chakra-ui/charts", () => ({
  Chart: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="chart-root">{children}</div>
    ),
    Tooltip: () => null,
  },
  useChart: ({
    data,
    series,
  }: {
    data: unknown[];
    series?: Array<{ name: string; color: string; stackId: string }>;
  }) => ({
    data,
    series: series ?? [],
    key: (k: string) => k,
    color: () => "#000",
    formatNumber: () => (v: number) => String(v),
  }),
}));

vi.mock("@chakra-ui/react", () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  HStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Progress: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Track: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Range: () => null,
    ValueText: ({ children }: { children: React.ReactNode }) => (
      <span>{children}</span>
    ),
  },
  SimpleGrid: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Skeleton: () => <div data-testid="skeleton" />,
  Span: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Text: ({ children }: { children: React.ReactNode }) => (
    <span>{children}</span>
  ),
  VStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// --- Fixtures ---

const makeExpenseItem = (overrides: object = {}) => ({
  _id: "exp1",
  _creationTime: new Date("2025-01-15").getTime(),
  userId: "user1",
  name: "Coffee",
  description: "Daily coffee",
  amount: 10.0,
  date: new Date("2025-03-10").getTime(),
  category: "Food",
  paidAt: undefined,
  ...overrides,
});

import CategoryDetail from "./CategoryDetail";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  paramsMock = {};
});

describe("CategoryDetail", () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue(undefined);
    paramsMock = {};
  });

  it("renders without crashing", () => {
    expect(() => render(<CategoryDetail />)).not.toThrow();
  });

  it("renders the breakdown description text", () => {
    render(<CategoryDetail />);
    expect(screen.getByText(/Breakdown of expenses by month/)).toBeInTheDocument();
  });

  it("shows 'All Time' when no year param is provided", () => {
    paramsMock = {};
    render(<CategoryDetail />);
    expect(screen.getByText(/All Time/)).toBeInTheDocument();
  });

  it("shows the year when year param is provided", () => {
    paramsMock = { month: "3", year: "2025" };
    useQueryMock.mockReturnValue([]);
    render(<CategoryDetail />);
    expect(screen.getByText(/2025/)).toBeInTheDocument();
  });

  it("renders skeleton while data is loading (undefined)", () => {
    useQueryMock.mockReturnValue(undefined);
    render(<CategoryDetail />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders the bar chart when data is loaded", () => {
    useQueryMock.mockReturnValue([makeExpenseItem()]);
    render(<CategoryDetail />);
    expect(screen.getByTestId("chart-root")).toBeInTheDocument();
  });

  it("renders subcategory rows when data has items", () => {
    useQueryMock.mockReturnValue([
      makeExpenseItem({ name: "Coffee", amount: 10 }),
      makeExpenseItem({ _id: "exp2", name: "Coffee", amount: 5, paidAt: Date.now() }),
    ]);
    render(<CategoryDetail />);
    expect(screen.getAllByText("Coffee").length).toBeGreaterThan(0);
  });

  it("renders the category name in the description when param is set", () => {
    paramsMock = { category: "Food" };
    useQueryMock.mockReturnValue([]);
    render(<CategoryDetail />);
    expect(screen.getByText(/Food/)).toBeInTheDocument();
  });

  it("renders 'By expense name' label when subcategory rows exist", () => {
    useQueryMock.mockReturnValue([makeExpenseItem()]);
    render(<CategoryDetail />);
    expect(screen.getByText("By expense name")).toBeInTheDocument();
  });

  it("renders paid/left-to-pay progress when data is loaded", () => {
    useQueryMock.mockReturnValue([
      makeExpenseItem({ amount: 100, paidAt: Date.now() }),
    ]);
    render(<CategoryDetail />);
    expect(screen.getByText(/paid/)).toBeInTheDocument();
    expect(screen.getByText(/left to pay/)).toBeInTheDocument();
  });
});
