// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";

import useIsOverflowing from "./useIsOverflowing";

const originalResizeObserver = globalThis.ResizeObserver;

function sizedNode(scrollHeight: number, clientHeight: number) {
  const node = document.createElement("div");
  node.appendChild(document.createElement("div"));
  Object.defineProperty(node, "scrollHeight", { configurable: true, value: scrollHeight });
  Object.defineProperty(node, "clientHeight", { configurable: true, value: clientHeight });
  return node;
}

function mockResizeObserver() {
  const observer = { callback: null as (() => void) | null, observe: vi.fn(), disconnect: vi.fn() };
  class MockResizeObserver {
    observe = observer.observe;
    disconnect = observer.disconnect;
    constructor(callback: () => void) {
      observer.callback = callback;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ResizeObserver = MockResizeObserver;
  return observer;
}

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

describe("useIsOverflowing", () => {
  it("is false until a node is attached", () => {
    mockResizeObserver();
    const { result } = renderHook(() => useIsOverflowing<HTMLDivElement>());
    expect(result.current[1]).toBe(false);
  });

  it("observes the node and its children and reports overflow", () => {
    const observer = mockResizeObserver();
    const { result } = renderHook(() => useIsOverflowing<HTMLDivElement>());
    const node = sizedNode(500, 200);

    act(() => result.current[0](node));

    expect(observer.observe).toHaveBeenCalledWith(node);
    expect(observer.observe).toHaveBeenCalledWith(node.firstElementChild);
    expect(result.current[1]).toBe(true);
  });

  it("updates when the observer fires after a resize", () => {
    const observer = mockResizeObserver();
    const { result } = renderHook(() => useIsOverflowing<HTMLDivElement>());
    const node = sizedNode(200, 200);

    act(() => result.current[0](node));
    expect(result.current[1]).toBe(false);

    Object.defineProperty(node, "scrollHeight", { configurable: true, value: 400 });
    act(() => observer.callback?.());
    expect(result.current[1]).toBe(true);
  });

  it("disconnects on unmount", () => {
    const observer = mockResizeObserver();
    const { result, unmount } = renderHook(() => useIsOverflowing<HTMLDivElement>());

    act(() => result.current[0](sizedNode(200, 200)));
    unmount();

    expect(observer.disconnect).toHaveBeenCalledTimes(1);
  });

  it("stays false without ResizeObserver", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).ResizeObserver;
    const { result } = renderHook(() => useIsOverflowing<HTMLDivElement>());

    act(() => result.current[0](sizedNode(500, 200)));

    expect(result.current[1]).toBe(false);
  });
});
