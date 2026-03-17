import { describe, expect, it } from "vitest";

import { isValidDate } from "./date";

describe("isValidDate", () => {
  it("returns true for a valid Date", () => {
    expect(isValidDate(new Date("2024-01-01T00:00:00.000Z"))).toBe(true);
  });

  it("returns false for an invalid Date", () => {
    expect(isValidDate(new Date("not-a-date"))).toBe(false);
  });

  it("returns false for non-Date values at runtime", () => {
    expect(isValidDate("2024-01-01" as unknown as Date)).toBe(false);
    expect(isValidDate(null as unknown as Date)).toBe(false);
    expect(isValidDate(undefined as unknown as Date)).toBe(false);
    expect(isValidDate({} as unknown as Date)).toBe(false);
  });
});

