// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const setLocation = vi.fn();

vi.mock("wouter", () => ({
  useParams: vi.fn(),
  useLocation: () => ["/dashboard", setLocation],
}));

import { useParams } from "wouter";
import useDashboardRoute, { buildDashboardPath } from "./useDashboardRoute";

afterEach(() => {
  vi.clearAllMocks();
});

describe("buildDashboardPath", () => {
  it("builds month paths with 1-based months", () => {
    expect(buildDashboardPath(2025, 0)).toBe("/dashboard/month/1/year/2025");
  });

  it("encodes the category", () => {
    expect(buildDashboardPath(2025, 11, "Health & Beauty")).toBe(
      "/dashboard/month/12/year/2025/category/Health%20%26%20Beauty",
    );
  });
});

describe("useDashboardRoute", () => {
  it("defaults to the current month when the route has no date", () => {
    vi.mocked(useParams).mockReturnValue({});
    const { result } = renderHook(() => useDashboardRoute());
    const today = new Date();

    expect(result.current.year).toBe(today.getFullYear());
    expect(result.current.monthIndex).toBe(today.getMonth());
    expect(result.current.category).toBeUndefined();
  });

  it("parses month, year and decodes the category", () => {
    vi.mocked(useParams).mockReturnValue({
      month: "3",
      year: "2025",
      category: "Health %26 Beauty",
    });
    const { result } = renderHook(() => useDashboardRoute());

    expect(result.current.year).toBe(2025);
    expect(result.current.monthIndex).toBe(2);
    expect(result.current.category).toBe("Health & Beauty");
  });

  it("keeps malformed categories as-is", () => {
    vi.mocked(useParams).mockReturnValue({
      month: "3",
      year: "2025",
      category: "100%",
    });
    const { result } = renderHook(() => useDashboardRoute());
    expect(result.current.category).toBe("100%");
  });

  it("navigates between months keeping the category and wrapping years", () => {
    vi.mocked(useParams).mockReturnValue({
      month: "1",
      year: "2025",
      category: "Food",
    });
    const { result } = renderHook(() => useDashboardRoute());

    act(() => result.current.goToMonth(2025, -1));
    expect(setLocation).toHaveBeenCalledWith(
      "/dashboard/month/12/year/2024/category/Food",
    );

    act(() => result.current.goToMonth(2025, 12));
    expect(setLocation).toHaveBeenCalledWith(
      "/dashboard/month/1/year/2026/category/Food",
    );
  });

  it("selects and clears the category for the current month", () => {
    vi.mocked(useParams).mockReturnValue({ month: "6", year: "2025" });
    const { result } = renderHook(() => useDashboardRoute());

    act(() => result.current.selectCategory("Food"));
    expect(setLocation).toHaveBeenCalledWith(
      "/dashboard/month/6/year/2025/category/Food",
    );

    act(() => result.current.selectCategory(undefined));
    expect(setLocation).toHaveBeenCalledWith("/dashboard/month/6/year/2025");
  });
});
