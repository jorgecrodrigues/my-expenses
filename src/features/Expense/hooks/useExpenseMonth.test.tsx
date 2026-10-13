// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import useExpenseMonth, { formatMonthParam } from "./useExpenseMonth";

const search = () => new URLSearchParams(window.location.search);

beforeEach(() => {
  window.history.pushState({}, "", "/expenses");
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("formatMonthParam", () => {
  it("pads the month number", () => {
    expect(formatMonthParam(2025, 0)).toBe("2025-01");
    expect(formatMonthParam(2025, 11)).toBe("2025-12");
  });
});

describe("useExpenseMonth", () => {
  it("defaults to the current month without a category", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2025, 6, 31, 23, 30));

    const { result } = renderHook(() => useExpenseMonth());
    expect(result.current).toMatchObject({
      year: 2025,
      monthIndex: 6,
      category: undefined,
    });
  });

  it("reads the month and category from the query string", () => {
    window.history.pushState(
      {},
      "",
      "/expenses?month=2024-02&category=Food%20%26%20Drinks",
    );
    const { result } = renderHook(() => useExpenseMonth());
    expect(result.current).toMatchObject({
      year: 2024,
      monthIndex: 1,
      category: "Food & Drinks",
    });
  });

  it("ignores invalid months", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2025, 3, 10));
    window.history.pushState({}, "", "/expenses?month=2024-13");

    const { result } = renderHook(() => useExpenseMonth());
    expect(result.current).toMatchObject({ year: 2025, monthIndex: 3 });
  });

  it("navigates between months, rolling over the year", () => {
    window.history.pushState({}, "", "/expenses?month=2025-01&category=Food");
    const { result } = renderHook(() => useExpenseMonth());

    act(() => result.current.goToMonth(2025, -1));
    expect(search().get("month")).toBe("2024-12");
    expect(search().get("category")).toBe("Food");
    expect(result.current).toMatchObject({ year: 2024, monthIndex: 11 });

    act(() => result.current.goToMonth(2024, 12));
    expect(search().get("month")).toBe("2025-01");
  });

  it("sets and clears the category while keeping the month", () => {
    window.history.pushState({}, "", "/expenses?month=2025-05");
    const { result } = renderHook(() => useExpenseMonth());

    act(() => result.current.setCategory("Food & Drinks"));
    expect(result.current.category).toBe("Food & Drinks");
    expect(search().get("month")).toBe("2025-05");

    act(() => result.current.setCategory(undefined));
    expect(result.current.category).toBeUndefined();
    expect(search().has("category")).toBe(false);
    expect(window.location.pathname).toBe("/expenses");
  });
});
