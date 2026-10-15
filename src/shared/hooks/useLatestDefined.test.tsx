// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

import useLatestDefined from "./useLatestDefined";

afterEach(() => {
  cleanup();
});

describe("useLatestDefined", () => {
  it("is undefined until a value arrives", () => {
    const { result } = renderHook(({ value }) => useLatestDefined(value), {
      initialProps: { value: undefined as number | undefined },
    });
    expect(result.current).toBeUndefined();
  });

  it("keeps the last value while the next one is undefined", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useLatestDefined(value),
      { initialProps: { value: 1 as number | undefined } },
    );

    rerender({ value: undefined });
    expect(result.current).toBe(1);

    rerender({ value: 2 });
    expect(result.current).toBe(2);

    rerender({ value: undefined });
    expect(result.current).toBe(2);
  });
});
