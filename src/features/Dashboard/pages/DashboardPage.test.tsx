// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Capture navigate calls
let navigateMock = vi.fn();
let locationMock = "/dashboard";
let paramsMock: Record<string, string | undefined> = {};

vi.mock("wouter", () => ({
  useLocation: () => [locationMock, navigateMock],
  useParams: () => paramsMock,
}));

vi.mock("@chakra-ui/react", () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Heading: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  HStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  VStack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  parseDate: (d: Date) => ({ month: d.getMonth() + 1, year: d.getFullYear() }),
}));

vi.mock("@/shared/components/CustomMonthPicker", () => ({
  default: ({
    onPreviousMonth,
    onNextMonth,
    onValueChange,
  }: {
    onPreviousMonth?: () => void;
    onNextMonth?: () => void;
    onValueChange?: (details: { value: Array<{ month: number; year: number }> }) => void;
  }) => (
    <div data-testid="month-picker">
      <button data-testid="prev-month" onClick={onPreviousMonth}>
        Prev
      </button>
      <button data-testid="next-month" onClick={onNextMonth}>
        Next
      </button>
      <button
        data-testid="change-date"
        onClick={() => onValueChange?.({ value: [{ month: 3, year: 2025 }] })}
      >
        Change
      </button>
    </div>
  ),
}));

vi.mock("../components/CategoryBarSegment", () => ({
  default: () => <div data-testid="category-bar-segment" />,
}));

vi.mock("../components/CategoryDetail", () => ({
  default: () => <div data-testid="category-detail" />,
}));

import DashboardPage from "./DashboardPage";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DashboardPage", () => {
  beforeEach(() => {
    paramsMock = {};
    locationMock = "/dashboard";
    navigateMock = vi.fn();
  });

  it("renders the Dashboard heading", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders the welcome text", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Welcome to the Dashboard!")).toBeInTheDocument();
  });

  it("renders the CategoryBarSegment component", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("category-bar-segment")).toBeInTheDocument();
  });

  it("renders the CategoryDetail component", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("category-detail")).toBeInTheDocument();
  });

  it("renders the month picker", () => {
    render(<DashboardPage />);
    expect(screen.getByTestId("month-picker")).toBeInTheDocument();
  });

  it("navigates to previous month when prev button is clicked", () => {
    paramsMock = { month: "3", year: "2025" };
    render(<DashboardPage />);
    fireEvent.click(screen.getByTestId("prev-month"));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("/dashboard/month/2/year/2025"),
    );
  });

  it("navigates to next month when next button is clicked", () => {
    paramsMock = { month: "3", year: "2025" };
    render(<DashboardPage />);
    fireEvent.click(screen.getByTestId("next-month"));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("/dashboard/month/4/year/2025"),
    );
  });

  it("navigates to previous month from December wraps to November", () => {
    paramsMock = { month: "1", year: "2025" };
    render(<DashboardPage />);
    fireEvent.click(screen.getByTestId("prev-month"));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("/dashboard/month/12/year/2024"),
    );
  });

  it("navigates with category param preserved on prev month", () => {
    paramsMock = { month: "3", year: "2025", category: "Food" };
    render(<DashboardPage />);
    fireEvent.click(screen.getByTestId("prev-month"));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("/category/Food"),
    );
  });

  it("navigates with category param preserved on next month", () => {
    paramsMock = { month: "3", year: "2025", category: "Food" };
    render(<DashboardPage />);
    fireEvent.click(screen.getByTestId("next-month"));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("/category/Food"),
    );
  });

  it("navigates to selected month/year when date changes", () => {
    paramsMock = { month: "3", year: "2025" };
    render(<DashboardPage />);
    fireEvent.click(screen.getByTestId("change-date"));
    expect(navigateMock).toHaveBeenCalledWith(
      expect.stringContaining("/dashboard/month/3/year/2025"),
    );
  });

  it("uses current date when no params are provided", () => {
    paramsMock = {};
    render(<DashboardPage />);
    // No navigation should have happened yet
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
