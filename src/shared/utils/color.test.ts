import { describe, expect, it } from "vitest";

import { generateColorByString, getContrastingTextColor } from "./color";

const computeHueForString = (input: string): number => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
};

const findInputForHueRange = (
  minInclusive: number,
  maxExclusive: number,
): string => {
  // Deterministically search for a short input that maps to the range.
  // This makes sure we exercise all hue branch paths in `generateColorByString`.
  for (let i = 0; i < 10_000; i++) {
    const candidate = `seed-${i}`;
    const hue = computeHueForString(candidate);
    if (hue >= minInclusive && hue < maxExclusive) return candidate;
  }
  throw new Error(
    `Could not find input for hue range [${minInclusive}, ${maxExclusive})`,
  );
};

describe("generateColorByString", () => {
  it("returns a valid #RRGGBB hex color", () => {
    const color = generateColorByString("hello");
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("is deterministic for the same input", () => {
    expect(generateColorByString("same")).toBe(generateColorByString("same"));
  });

  it("returns different colors for different inputs (sanity check)", () => {
    expect(generateColorByString("a")).not.toBe(generateColorByString("b"));
  });

  it("handles empty string input", () => {
    const color = generateColorByString("");
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(color).toBe(generateColorByString(""));
  });

  it("always returns a 7-char string starting with '#'", () => {
    const color = generateColorByString("length-check");
    expect(color.length).toBe(7);
    expect(color[0]).toBe("#");
  });

  it("covers all hue sector branches (0-60, 60-120, ..., 300-360)", () => {
    const ranges: Array<[number, number]> = [
      [0, 60],
      [60, 120],
      [120, 180],
      [180, 240],
      [240, 300],
      [300, 360],
    ];

    const outputs = new Set<string>();
    for (const [min, max] of ranges) {
      const input = findInputForHueRange(min, max);
      const color = generateColorByString(input);
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      outputs.add(color);
    }

    // Sanity check: different hue sectors should usually lead to different colors.
    expect(outputs.size).toBeGreaterThan(1);
  });
});

describe("getContrastingTextColor", () => {
  it("throws on invalid hex format", () => {
    expect(() => getContrastingTextColor("ffffff")).toThrow(
      "Invalid hex color format. Expected format: #RRGGBB",
    );
    expect(() => getContrastingTextColor("#fff")).toThrow(
      "Invalid hex color format. Expected format: #RRGGBB",
    );
    expect(() => getContrastingTextColor("#GGGGGG")).toThrow(
      "Invalid hex color format. Expected format: #RRGGBB",
    );
  });

  it("returns white text for a black background", () => {
    expect(getContrastingTextColor("#000000")).toBe("#FFFFFF");
  });

  it("returns black text for a white background", () => {
    expect(getContrastingTextColor("#FFFFFF")).toBe("#000000");
  });

  it("always returns either pure black or pure white", () => {
    const candidates = ["#123456", "#abcdef", "#777777", "#00ff00", "#ff00ff"];
    for (const bg of candidates) {
      expect(["#000000", "#FFFFFF"]).toContain(getContrastingTextColor(bg));
    }
  });

  it("accepts lowercase hex input", () => {
    expect(getContrastingTextColor("#abcdef")).toMatch(/^#(?:000000|FFFFFF)$/);
  });
});

