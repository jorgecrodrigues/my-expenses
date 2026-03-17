// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import useIntersectionObserver from "./useIntersectionObserver";

type IOCallback = (entries: IntersectionObserverEntry[]) => void;

describe("useIntersectionObserver", () => {
  it("observes the node and updates entry when the observer fires", () => {
    let lastCallback: IOCallback | null = null;
    const observeMock = vi.fn();
    const disconnectMock = vi.fn();

    const IO = vi.fn().mockImplementation((cb: IOCallback) => {
      lastCallback = cb;
      return {
        observe: observeMock,
        disconnect: disconnectMock,
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).IntersectionObserver = IO;

    const { result } = renderHook(() => useIntersectionObserver());

    const node = document.createElement("div");
    act(() => {
      result.current.ref(node);
    });

    expect(IO).toHaveBeenCalledTimes(1);
    expect(observeMock).toHaveBeenCalledWith(node);

    const entry = { isIntersecting: true } as IntersectionObserverEntry;
    act(() => {
      lastCallback?.([entry]);
    });

    expect(result.current.entry).toBe(entry);
  });

  it("disconnects when ref changes from one node to another and on unmount", () => {
    const observeMock = vi.fn();
    const disconnectMock = vi.fn();

    const IO = vi.fn().mockImplementation(() => ({
      observe: observeMock,
      disconnect: disconnectMock,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).IntersectionObserver = IO;

    const { result, unmount } = renderHook(() => useIntersectionObserver());

    const nodeA = document.createElement("div");
    const nodeB = document.createElement("div");

    act(() => result.current.ref(nodeA));
    act(() => result.current.ref(nodeB));

    // once for switching nodes (disconnect old observer)
    expect(disconnectMock).toHaveBeenCalledTimes(1);

    unmount();

    // once more for unmount cleanup
    expect(disconnectMock).toHaveBeenCalledTimes(2);
  });

  it("sets entry to null when ref is set to null", () => {
    let lastCallback: IOCallback | null = null;
    const IO = vi.fn().mockImplementation((cb: IOCallback) => {
      lastCallback = cb;
      return {
        observe: vi.fn(),
        disconnect: vi.fn(),
      };
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).IntersectionObserver = IO;

    const { result } = renderHook(() => useIntersectionObserver());

    const entry = { isIntersecting: true } as IntersectionObserverEntry;
    act(() => {
      result.current.ref(document.createElement("div"));
    });
    act(() => {
      lastCallback?.([entry]);
    });
    expect(result.current.entry).toBe(entry);

    act(() => {
      result.current.ref(null);
    });
    expect(result.current.entry).toBeNull();
  });
});

