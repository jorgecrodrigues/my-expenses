/**
 * Reusable CSS animation props for Chakra components (see `index.css` @keyframes).
 * Disclosure primitives use `data-state`; `_open` / `_closed` map to enter/exit.
 *
 * **Composable runs:** use `composeParallelAnimations` when keyframes target *different*
 * properties (e.g. `fade-in` + `scale-in`). Do not compose two animations that both set
 * `transform`—use a single combined keyframe in CSS instead.
 */

/** Shared easings (Chakra / CSS timing-function strings). */
export const EASING = {
  out: "cubic-bezier(0.16, 1, 0.3, 1)",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  inOut: "cubic-bezier(0.45, 0, 0.55, 1)",
} as const;

/** Default durations (ms) for presets. */
export const DURATION_MS = {
  instant: 120,
  fast: 180,
  normal: 220,
  slow: 360,
  staggerStep: 50,
} as const;

const easeOut = EASING.out;
const easeIn = EASING.in;

export const dialogBackdropMotion = {
  _open: {
    animationName: "fade-in",
    animationDuration: "0.2s",
    animationTimingFunction: easeOut,
    animationFillMode: "both",
  },
  _closed: {
    animationName: "fade-out",
    animationDuration: "0.15s",
    animationTimingFunction: easeIn,
    animationFillMode: "both",
  },
} as const;

export const dialogContentMotion = {
  _open: {
    animationName: "dialog-content-in",
    animationDuration: "0.22s",
    animationTimingFunction: easeOut,
    animationFillMode: "both",
  },
  _closed: {
    animationName: "dialog-content-out",
    animationDuration: "0.16s",
    animationTimingFunction: easeIn,
    animationFillMode: "both",
  },
} as const;

export const popoverContentMotion = {
  _open: {
    animationName: "popover-content-in",
    animationDuration: "0.18s",
    animationTimingFunction: easeOut,
    animationFillMode: "both",
  },
  _closed: {
    animationName: "popover-content-out",
    animationDuration: "0.14s",
    animationTimingFunction: easeIn,
    animationFillMode: "both",
  },
} as const;

/** Mobile-style bottom sheet (pair with `_open` / `_closed` on the sheet panel). */
export const sheetBottomMotion = {
  _open: {
    animationName: "sheet-bottom-in",
    animationDuration: "0.28s",
    animationTimingFunction: easeOut,
    animationFillMode: "both",
  },
  _closed: {
    animationName: "sheet-bottom-out",
    animationDuration: "0.22s",
    animationTimingFunction: easeIn,
    animationFillMode: "both",
  },
} as const;

export type CssAnimationFillMode =
  | "none"
  | "forwards"
  | "backwards"
  | "both";

export interface ParallelAnimationPart {
  /** Registered `@keyframes` name from `index.css`. */
  name: string;
  durationMs: number;
  timingFunction?: string;
}

export interface ParallelAnimationOptions {
  delayMs?: number;
  fillMode?: CssAnimationFillMode;
}

/**
 * Run multiple keyframes in parallel (comma-separated). Use when each keyframe
 * animates a different property (e.g. opacity vs transform).
 */
export function composeParallelAnimations(
  parts: ReadonlyArray<ParallelAnimationPart>,
  options?: ParallelAnimationOptions,
): {
  animationName: string;
  animationDuration: string;
  animationTimingFunction: string;
  animationFillMode: CssAnimationFillMode;
  animationDelay?: string;
} {
  if (parts.length === 0) {
    throw new Error("composeParallelAnimations: at least one animation part is required");
  }

  const names = parts.map((p) => p.name).join(", ");
  const durations = parts.map((p) => `${p.durationMs}ms`).join(", ");
  const timings = parts
    .map((p) => p.timingFunction ?? easeOut)
    .join(", ");

  return {
    animationName: names,
    animationDuration: durations,
    animationTimingFunction: timings,
    animationFillMode: options?.fillMode ?? "both",
    ...(options?.delayMs != null && options.delayMs > 0
      ? { animationDelay: `${options.delayMs}ms` }
      : {}),
  };
}

/** Parallel fade + scale (transform-only `scale-in` + opacity `fade-in`). */
export function fadeScaleEnter(options?: {
  durationMs?: number;
  delayMs?: number;
  timingFunction?: string;
}) {
  const d = options?.durationMs ?? DURATION_MS.fast;
  return composeParallelAnimations(
    [
      { name: "fade-in", durationMs: d, timingFunction: options?.timingFunction },
      {
        name: "scale-in",
        durationMs: d,
        timingFunction: options?.timingFunction,
      },
    ],
    { delayMs: options?.delayMs, fillMode: "both" },
  );
}

export function fadeScaleExit(options?: {
  durationMs?: number;
  delayMs?: number;
  timingFunction?: string;
}) {
  const d = options?.durationMs ?? DURATION_MS.instant;
  return composeParallelAnimations(
    [
      { name: "fade-out", durationMs: d, timingFunction: options?.timingFunction },
      {
        name: "scale-out",
        durationMs: d,
        timingFunction: options?.timingFunction,
      },
    ],
    { delayMs: options?.delayMs, fillMode: "both" },
  );
}

/** Single combined keyframe: stronger “hero” entrance than `slide-up-fade-in`. */
export function contentRevealEnter(options?: {
  durationMs?: number;
  delayMs?: number;
  timingFunction?: string;
}) {
  const d = options?.durationMs ?? DURATION_MS.slow;
  return {
    animationName: "content-reveal",
    animationDuration: `${d}ms`,
    animationTimingFunction: options?.timingFunction ?? EASING.inOut,
    animationFillMode: "both" as const,
    ...(options?.delayMs != null && options.delayMs > 0
      ? { animationDelay: `${options.delayMs}ms` }
      : {}),
  };
}

export function slideFromLeftEnter(options?: {
  durationMs?: number;
  delayMs?: number;
  timingFunction?: string;
}) {
  const d = options?.durationMs ?? DURATION_MS.normal;
  return {
    animationName: "slide-from-left-fade-in",
    animationDuration: `${d}ms`,
    animationTimingFunction: options?.timingFunction ?? easeOut,
    animationFillMode: "both" as const,
    ...(options?.delayMs != null && options.delayMs > 0
      ? { animationDelay: `${options.delayMs}ms` }
      : {}),
  };
}

export function slideFromRightEnter(options?: {
  durationMs?: number;
  delayMs?: number;
  timingFunction?: string;
}) {
  const d = options?.durationMs ?? DURATION_MS.normal;
  return {
    animationName: "slide-from-right-fade-in",
    animationDuration: `${d}ms`,
    animationTimingFunction: options?.timingFunction ?? easeOut,
    animationFillMode: "both" as const,
    ...(options?.delayMs != null && options.delayMs > 0
      ? { animationDelay: `${options.delayMs}ms` }
      : {}),
  };
}

/** Subtle looping pulse for empty states / emphasis (respects global `prefers-reduced-motion`). */
export function softOpacityPulseLoop(options?: {
  durationSec?: number;
  timingFunction?: string;
}) {
  return {
    animationName: "opacity-pulse-soft",
    animationDuration: `${options?.durationSec ?? 2}s`,
    animationTimingFunction: options?.timingFunction ?? "ease-in-out",
    animationIterationCount: "infinite",
    animationDirection: "alternate" as const,
  };
}

/** Tiny oscillating rotation for icons or badges (transform-only; do not stack with other transform animations). */
export function gentleRotateLoop(options?: { durationSec?: number }) {
  return {
    animationName: "gentle-rotate",
    animationDuration: `${options?.durationSec ?? 3}s`,
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    animationDirection: "alternate" as const,
  };
}

export interface StaggerOptions {
  /** Delay before the first element animates. */
  baseDelayMs?: number;
  /** Extra delay per index (ms). */
  staggerMs?: number;
}

function keyframeStagger(
  animationName: string,
  durationMs: number,
  timingFunction: string,
  index: number,
  options?: StaggerOptions,
) {
  const base = options?.baseDelayMs ?? 0;
  const step = options?.staggerMs ?? DURATION_MS.staggerStep;
  const delay = base + index * step;
  return {
    animationName,
    animationDuration: `${durationMs}ms`,
    animationTimingFunction: timingFunction,
    animationFillMode: "both" as const,
    animationDelay: `${delay}ms`,
  };
}

/** Staggered entrance for static page sections (not disclosure). */
export function pageStaggerEnter(delayMs: number) {
  return keyframeStagger("slide-up-fade-in", 500, "ease-in-out", 0, {
    baseDelayMs: delayMs,
    staggerMs: 0,
  });
}

/** Slightly quicker stagger for dense pages (e.g. About). */
export function pageStaggerEnterCompact(delayMs: number) {
  return keyframeStagger("slide-up-fade-in", 380, "ease-in-out", 0, {
    baseDelayMs: delayMs,
    staggerMs: 0,
  });
}

/** Like `pageStaggerEnterCompact` but horizontal slide only (`slide-from-left` — no opacity). */
export function pageStaggerSlideLeftCompact(delayMs: number) {
  return keyframeStagger("slide-from-left", 380, "ease-in-out", 0, {
    baseDelayMs: delayMs,
    staggerMs: 0,
  });
}

/** Staggered table rows / list items. */
export function listRowStaggerEnter(staggerIndex: number) {
  return keyframeStagger(
    "slide-up-fade-in",
    50,
    "ease-in-out",
    staggerIndex,
    { staggerMs: 20 },
  );
}

/**
 * Generic stagger: pick any registered keyframe name and row index.
 * Example: `staggeredListEnter("slide-from-left-fade-in", i, { staggerMs: 40 })`
 */
export function staggeredListEnter(
  animationName: string,
  index: number,
  options?: StaggerOptions & {
    durationMs?: number;
    timingFunction?: string;
  },
) {
  return keyframeStagger(
    animationName,
    options?.durationMs ?? DURATION_MS.fast,
    options?.timingFunction ?? "ease-in-out",
    index,
    options,
  );
}
