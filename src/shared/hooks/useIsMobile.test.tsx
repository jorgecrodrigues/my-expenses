// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import useIsMobile, { MOBILE_MEDIA_QUERY } from "./useIsMobile";
import { mockMatchMedia } from "@/test/mockMatchMedia";

const originalMatchMedia = window.matchMedia;

afterEach(() => {
  window.matchMedia = originalMatchMedia;
});

describe("useIsMobile", () => {
  it("returns false when matchMedia is unavailable", () => {
    // @ts-expect-error — jsdom does not implement matchMedia
    window.matchMedia = undefined;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("reflects the mobile media query and follows its changes", () => {
    const media = mockMatchMedia(true);
    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
    expect(media.queries).toContain(MOBILE_MEDIA_QUERY);

    act(() => media.setMatches(false));
    expect(result.current).toBe(false);
  });
});
