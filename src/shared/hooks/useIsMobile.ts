import React from "react";

/** Matches below Chakra's `md` breakpoint (48rem), same as the bottom nav. */
export const MOBILE_MEDIA_QUERY = "(max-width: 47.99rem)";

const getMediaQueryList = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(MOBILE_MEDIA_QUERY)
    : undefined;

const subscribe = (callback: () => void) => {
  const mediaQueryList = getMediaQueryList();
  mediaQueryList?.addEventListener("change", callback);
  return () => mediaQueryList?.removeEventListener("change", callback);
};

const getSnapshot = () => getMediaQueryList()?.matches ?? false;

/**
 * Whether the viewport is phone-sized. Lets components render a different
 * layout (e.g. cards instead of a table) instead of mounting both and hiding
 * one with CSS. Falls back to `false` where `matchMedia` is unavailable.
 */
export default function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}
