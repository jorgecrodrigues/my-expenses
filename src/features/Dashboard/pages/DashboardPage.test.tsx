// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const setLocation = vi.fn();

vi.mock("wouter", () => ({
  useParams: vi.fn(),
  useLocation: () => ["/dashboard", setLocation],
}));

vi.mock("@chakra-ui/react", () => ({
  parseDate: (d: Date) => d,
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Heading: ({ children }: { children: React.ReactNode }) => (
    <h1>{children}</h1>
  ),
  Text: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  HStack: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  VStack: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@/shared/components/CustomMonthPicker", () => ({
  default: () => <div data-testid="month-picker" />,
}));

vi.mock("../components/CategoryBarSegment", () => ({
  default: () => <div data-testid="category-bar-segment" />,
}));

vi.mock("../components/CategoryDetail", () => ({
  default: () => <div data-testid="category-detail" />,
}));

import { useParams } from "wouter";
import DashboardPage from "./DashboardPage";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("DashboardPage", () => {
  it("renders the dashboard heading and welcome text", () => {
    vi.mocked(useParams).mockReturnValue({});
    render(<DashboardPage />);
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Welcome to the Dashboard!")).toBeInTheDocument();
  });

  it("renders the month picker and dashboard sections", () => {
    vi.mocked(useParams).mockReturnValue({});
    render(<DashboardPage />);
    expect(screen.getByTestId("month-picker")).toBeInTheDocument();
    expect(screen.getByTestId("category-bar-segment")).toBeInTheDocument();
    expect(screen.getByTestId("category-detail")).toBeInTheDocument();
  });

  it("passes route params through to child sections", () => {
    vi.mocked(useParams).mockReturnValue({
      month: "4",
      year: "2026",
      category: "Food",
    });
    render(<DashboardPage />);
    expect(screen.getByTestId("category-bar-segment")).toBeInTheDocument();
    expect(screen.getByTestId("category-detail")).toBeInTheDocument();
  });
});
