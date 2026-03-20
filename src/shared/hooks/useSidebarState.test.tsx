// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useSidebarState } from "./useSidebarState";

describe("useSidebarState", () => {
  it("returns null when no sidebar state is stored", () => {
    window.localStorage.removeItem("__sidebar_state__");
    const { result } = renderHook(() => useSidebarState());
    expect(result.current[0]).toBeNull();
  });

  it("sets localStorage and updates state when setSidebarState is called", async () => {
    window.localStorage.removeItem("__sidebar_state__");
    const { result } = renderHook(() => useSidebarState());

    act(() => {
      result.current[1]("collapsed");
    });

    expect(window.localStorage.getItem("__sidebar_state__")).toBe("collapsed");

    await waitFor(() => {
      expect(result.current[0]).toBe("collapsed");
    });
  });

  it("updates state when a storage event is dispatched (cross-tab sync)", async () => {
    window.localStorage.removeItem("__sidebar_state__");
    const { result } = renderHook(() => useSidebarState());
    expect(result.current[0]).toBeNull();

    window.localStorage.setItem("__sidebar_state__", "expanded");
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "__sidebar_state__",
          newValue: "expanded",
        }),
      );
    });

    await waitFor(() => {
      expect(result.current[0]).toBe("expanded");
    });
  });
});

