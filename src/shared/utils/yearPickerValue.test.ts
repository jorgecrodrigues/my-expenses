import { describe, expect, it } from "vitest";
import { CalendarDate } from "@internationalized/date";
import { formatYearPickerValue, parseYearPickerValue } from "./yearPickerValue";

describe("formatYearPickerValue", () => {
  it("shows only the year", () => {
    expect(formatYearPickerValue(new CalendarDate(2026, 10, 15))).toBe("2026");
  });
});

describe("parseYearPickerValue", () => {
  it("parses a four-digit year as January 1st", () => {
    expect(parseYearPickerValue(" 2025 ")).toEqual(new CalendarDate(2025, 1, 1));
  });

  it("returns undefined for anything else", () => {
    expect(parseYearPickerValue("")).toBeUndefined();
    expect(parseYearPickerValue("25")).toBeUndefined();
    expect(parseYearPickerValue("03/2025")).toBeUndefined();
  });
});
