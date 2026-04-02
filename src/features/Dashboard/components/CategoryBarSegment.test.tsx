// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

vi.mock("../../../../convex/_generated/api", () => ({
  api: {
    users: { viewer: "users.viewer" },
    expenses: { getExpenseByCategoryValues: "getExpenseByCategoryValues" },
  },
}));

const setLocation = vi.fn();

vi.mock("wouter", () => ({
  useParams: vi.fn(),
  useLocation: () => ["/dashboard", setLocation],
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/shared/utils/color", () => ({
  generateColorByString: () => "#3366cc",
}));

vi.mock("@chakra-ui/charts", () => ({
  BarSegment: {
    Root: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-segment-root">{children}</div>
    ),
    Content: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    Value: () => null,
    Bar: ({
      tooltip,
    }: {
      tooltip?: (props: { payload: { name: string } }) => React.ReactNode;
    }) => (
      <div data-testid="bar-segment-bar">
        {tooltip?.({ payload: { name: "Food" } })}
      </div>
    ),
    Label: () => null,
    Legend: () => null,
  },
  useChart: vi.fn(() => ({
    getTotal: (key: string) => (key === "value" ? 250 : 0),
  })),
}));

vi.mock("@chakra-ui/react", () => ({
  HStack: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Stack: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  Skeleton: () => <div data-testid="skeleton" />,
  SkeletonCircle: () => <div data-testid="skeleton-circle" />,
  Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  Button: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

import { useQuery } from "convex/react";
import { useParams } from "wouter";
import CategoryBarSegment from "./CategoryBarSegment";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CategoryBarSegment", () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ month: "3", year: "2025" });
    vi.mocked(useQuery).mockImplementation(
      ((query: unknown) => {
        if (query === "users.viewer") return { _id: "user1" };
        if (query === "getExpenseByCategoryValues") {
          return [{ category: "Food", total: 100 }];
        }
        return undefined;
      }) as typeof useQuery,
    );
  });

  it("shows skeletons while category totals are loading", () => {
    vi.mocked(useQuery).mockImplementation(
      ((query: unknown) => {
        if (query === "users.viewer") return { _id: "user1" };
        if (query === "getExpenseByCategoryValues") return undefined;
        return undefined;
      }) as typeof useQuery,
    );
    render(<CategoryBarSegment />);
    expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
    expect(screen.queryByTestId("bar-segment-root")).not.toBeInTheDocument();
  });

  it("renders the section title and total when data is loaded", () => {
    render(<CategoryBarSegment />);
    expect(screen.getByText("Expenses by Category")).toBeInTheDocument();
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    expect(screen.getByTestId("bar-segment-root")).toBeInTheDocument();
  });

  it("shows a message when there are no expenses for the month", () => {
    vi.mocked(useQuery).mockImplementation(
      ((query: unknown) => {
        if (query === "users.viewer") return { _id: "user1" };
        if (query === "getExpenseByCategoryValues") return [];
        return undefined;
      }) as typeof useQuery,
    );
    render(<CategoryBarSegment />);
    expect(
      screen.getByText("No expenses found for this month."),
    ).toBeInTheDocument();
  });

  it("navigates to the category detail route when a bar segment is activated", () => {
    render(<CategoryBarSegment />);
    fireEvent.click(screen.getByTestId("bar-segment-bar").querySelector("button")!);
    expect(setLocation).toHaveBeenCalledWith(
      "/dashboard/month/3/year/2025/category/Food",
    );
  });

  it("passes undefined month and year to the query when route omits month/year params", () => {
    vi.mocked(useParams).mockReturnValue({});
    const getExpenseArgs: unknown[] = [];
    vi.mocked(useQuery).mockImplementation(
      ((query: unknown, args?: unknown) => {
        if (query === "users.viewer") return { _id: "user1" };
        if (query === "getExpenseByCategoryValues") {
          getExpenseArgs.push(args);
          return [{ category: "Food", total: 100 }];
        }
        return undefined;
      }) as typeof useQuery,
    );

    render(<CategoryBarSegment />);

    expect(getExpenseArgs[0]).toEqual(
      expect.objectContaining({
        userId: "user1",
        month: undefined,
        year: undefined,
      }),
    );
    expect(screen.getByTestId("bar-segment-root")).toBeInTheDocument();
  });

  it("passes undefined month and year when only one of month or year is in the route", () => {
    vi.mocked(useParams).mockReturnValue({ month: "6" });
    const getExpenseArgs: unknown[] = [];
    vi.mocked(useQuery).mockImplementation(
      ((query: unknown, args?: unknown) => {
        if (query === "users.viewer") return { _id: "user1" };
        if (query === "getExpenseByCategoryValues") {
          getExpenseArgs.push(args);
          return [];
        }
        return undefined;
      }) as typeof useQuery,
    );

    render(<CategoryBarSegment />);

    expect(getExpenseArgs[0]).toEqual(
      expect.objectContaining({
        month: undefined,
        year: undefined,
      }),
    );
  });
});
