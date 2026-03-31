// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// --- Mocks ---

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    users: { viewer: "viewer" },
    expenses: { getExpenseByCategoryValues: "getExpenseByCategoryValues" },
  },
}));

const useQueryMock = vi.fn();
let paramsMock: Record<string, string | undefined> = {};
const navigateMock = vi.fn();

vi.mock("convex/react", () => ({
  useQuery: (key: string) => useQueryMock(key),
}));

vi.mock("wouter", () => ({
  useParams: () => paramsMock,
  useLocation: () => ["/dashboard", navigateMock],
}));

vi.mock("@/shared/utils/color", () => ({
  generateColorByString: () => "#123456",
}));

vi.mock("@chakra-ui/charts", () => ({
  BarSegment: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-segment-root">{children}</div>
    ),
    Content: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Value: () => <div data-testid="bar-segment-value" />,
    Bar: () => <div data-testid="bar-segment-bar" />,
    Label: () => <div data-testid="bar-segment-label" />,
    Legend: () => <div data-testid="bar-segment-legend" />,
  },
  useChart: ({ data }: { data: Array<{ name: string; value: number; color: string }> }) => ({
    data,
    getTotal: (key: string) =>
      data.reduce(
        (sum: number, item: Record<string, number | string>) =>
          sum + (Number(item[key]) || 0),
        0,
      ),
  }),
}));

vi.mock("@chakra-ui/react", () => ({
  HStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Skeleton: () => <div data-testid="skeleton" />,
  SkeletonCircle: () => <div data-testid="skeleton-circle" />,
  Stack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));

import CategoryBarSegment from "./CategoryBarSegment";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  paramsMock = {};
});

describe("CategoryBarSegment", () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue(undefined);
  });

  it("renders the section heading", () => {
    render(<CategoryBarSegment />);
    expect(screen.getByText("Expenses by Category")).toBeInTheDocument();
  });

  it("renders skeleton when data is undefined (loading)", () => {
    useQueryMock.mockReturnValue(undefined);
    render(<CategoryBarSegment />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
  });

  it("renders the BarSegment when data is loaded", () => {
    useQueryMock.mockReturnValue([
      { category: "Food", total: 100 },
      { category: "Transport", total: 50 },
    ]);
    render(<CategoryBarSegment />);
    expect(screen.getByTestId("bar-segment-root")).toBeInTheDocument();
  });

  it("renders the total when data is loaded", () => {
    useQueryMock.mockReturnValue([
      { category: "Food", total: 100 },
      { category: "Transport", total: 50 },
    ]);
    render(<CategoryBarSegment />);
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
  });

  it("shows 'No expenses found' text when data is an empty array", () => {
    useQueryMock.mockReturnValue([]);
    render(<CategoryBarSegment />);
    expect(screen.getByText("No expenses found for this month.")).toBeInTheDocument();
  });

  it("uses month/year from url params when provided", () => {
    paramsMock = { month: "6", year: "2025" };
    useQueryMock.mockReturnValue([]);
    render(<CategoryBarSegment />);
    // Renders without crash using params
    expect(screen.getByText("Expenses by Category")).toBeInTheDocument();
  });
});
