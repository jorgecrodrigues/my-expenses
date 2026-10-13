// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

const { useQuery } = vi.hoisted(() => ({ useQuery: vi.fn() }));

vi.mock("../../../../convex/_generated/api", () => ({
  api: { expenses: { getExpensesInRange: "getExpensesInRange" } },
}));

vi.mock("convex/react", () => ({ useQuery }));

import useMonthExpenses from "./useMonthExpenses";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("useMonthExpenses", () => {
  it("queries the previous and selected months with a day of padding", () => {
    useQuery.mockReturnValue([]);
    const { result } = renderHook(() => useMonthExpenses(2025, 2));

    expect(useQuery).toHaveBeenCalledWith("getExpensesInRange", {
      start: "2025-01-31",
      end: "2025-04-02",
    });
    expect(result.current).toEqual([]);
  });

  it("crosses year boundaries", () => {
    renderHook(() => useMonthExpenses(2025, 0));
    expect(useQuery).toHaveBeenLastCalledWith("getExpensesInRange", {
      start: "2024-11-30",
      end: "2025-02-02",
    });

    renderHook(() => useMonthExpenses(2024, 11));
    expect(useQuery).toHaveBeenLastCalledWith("getExpensesInRange", {
      start: "2024-10-31",
      end: "2025-01-02",
    });
  });
});
