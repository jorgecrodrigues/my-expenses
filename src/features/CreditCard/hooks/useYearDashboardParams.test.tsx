// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import useYearDashboardParams from "./useYearDashboardParams";

const search = () => new URLSearchParams(window.location.search);

beforeEach(() => {
  window.history.pushState({}, "", "/credit-card");
});

afterEach(() => {
  cleanup();
});

describe("useYearDashboardParams", () => {
  it("has no selection by default", () => {
    const { result } = renderHook(() => useYearDashboardParams());
    expect(result.current).toMatchObject({
      year: undefined,
      monthIndex: undefined,
      category: undefined,
    });
  });

  it("reads the year, month and category from the query string", () => {
    window.history.pushState(
      {},
      "",
      "/credit-card?year=2025&month=03&category=food%20%26%20drinks",
    );
    const { result } = renderHook(() => useYearDashboardParams());
    expect(result.current).toMatchObject({
      year: 2025,
      monthIndex: 2,
      category: "food & drinks",
    });
  });

  it("ignores malformed years and months", () => {
    window.history.pushState({}, "", "/credit-card?year=25&month=13");
    const { result } = renderHook(() => useYearDashboardParams());
    expect(result.current.year).toBeUndefined();
    expect(result.current.monthIndex).toBeUndefined();
  });

  it("changes the year and clears the month, keeping the category", () => {
    window.history.pushState({}, "", "/credit-card?year=2025&month=3&category=food");
    const { result } = renderHook(() => useYearDashboardParams());

    act(() => result.current.goToYear(2024));

    expect(search().get("year")).toBe("2024");
    expect(search().get("month")).toBeNull();
    expect(search().get("category")).toBe("food");
    expect(result.current.year).toBe(2024);
  });

  it("selects and clears the month", () => {
    const { result } = renderHook(() => useYearDashboardParams());

    act(() => result.current.selectMonth(11));
    expect(search().get("month")).toBe("12");
    expect(result.current.monthIndex).toBe(11);

    act(() => result.current.selectMonth(undefined));
    expect(search().get("month")).toBeNull();
  });

  it("selects and clears the category", () => {
    const { result } = renderHook(() => useYearDashboardParams());

    act(() => result.current.selectCategory("transport"));
    expect(search().get("category")).toBe("transport");

    act(() => result.current.selectCategory(undefined));
    expect(search().get("category")).toBeNull();
  });
});
