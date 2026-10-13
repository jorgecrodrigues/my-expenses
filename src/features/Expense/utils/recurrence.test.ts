import { describe, expect, it } from "vitest";
import {
  addInterval,
  getSchedule,
  MAX_OCCURRENCES,
  toDateInputValue,
  toDateTimeLocalValue,
  type RecurrenceValue,
} from "./recurrence";

const base: RecurrenceValue = {
  start: "2025-01-31T10:30",
  frequency: "monthly",
  interval: "1",
  endMode: "count",
  count: "3",
  until: "2025-12-31",
};

const days = (dates: Date[]) => dates.map(toDateInputValue);

describe("input value formatters", () => {
  it("formats dates in local time", () => {
    const date = new Date(2025, 0, 5, 7, 4);
    expect(toDateInputValue(date)).toBe("2025-01-05");
    expect(toDateTimeLocalValue(date)).toBe("2025-01-05T07:04");
  });
});

describe("addInterval", () => {
  const start = new Date(2025, 0, 31, 10, 30);

  it("adds days and weeks", () => {
    expect(toDateInputValue(addInterval(start, "daily", 1))).toBe("2025-02-01");
    expect(toDateInputValue(addInterval(start, "weekly", 2))).toBe(
      "2025-02-14",
    );
  });

  it("clamps the day when the target month is shorter", () => {
    expect(toDateInputValue(addInterval(start, "monthly", 1))).toBe(
      "2025-02-28",
    );
    expect(toDateInputValue(addInterval(start, "monthly", 2))).toBe(
      "2025-03-31",
    );
    expect(toDateInputValue(addInterval(start, "monthly", 13))).toBe(
      "2026-02-28",
    );
  });

  it("handles leap years for yearly repetitions", () => {
    const leapDay = new Date(2024, 1, 29);
    expect(toDateInputValue(addInterval(leapDay, "yearly", 1))).toBe(
      "2025-02-28",
    );
    expect(toDateInputValue(addInterval(leapDay, "yearly", 4))).toBe(
      "2028-02-29",
    );
  });

  it("keeps the time of day", () => {
    const result = addInterval(start, "monthly", 1);
    expect(result.getHours()).toBe(10);
    expect(result.getMinutes()).toBe(30);
  });
});

describe("getSchedule", () => {
  it("creates a fixed number of bills without drifting the day", () => {
    const { dates, truncated } = getSchedule(base);
    expect(days(dates)).toEqual(["2025-01-31", "2025-02-28", "2025-03-31"]);
    expect(truncated).toBe(false);
  });

  it("supports intervals greater than one", () => {
    const { dates } = getSchedule({
      ...base,
      start: "2025-01-01T10:00",
      frequency: "weekly",
      interval: "2",
    });
    expect(days(dates)).toEqual(["2025-01-01", "2025-01-15", "2025-01-29"]);
  });

  it("creates bills until an inclusive end date", () => {
    const { dates } = getSchedule({
      ...base,
      start: "2025-10-10T10:00",
      endMode: "until",
      until: "2025-12-10",
    });
    expect(days(dates)).toEqual(["2025-10-10", "2025-11-10", "2025-12-10"]);
  });

  it("returns no bills when the end date is before the start", () => {
    expect(
      getSchedule({ ...base, endMode: "until", until: "2024-12-31" }).dates,
    ).toEqual([]);
  });

  it("caps the number of bills", () => {
    const byCount = getSchedule({ ...base, count: "500" });
    expect(byCount.dates).toHaveLength(MAX_OCCURRENCES);
    expect(byCount.truncated).toBe(true);

    const byDate = getSchedule({
      ...base,
      frequency: "daily",
      endMode: "until",
      until: "2030-01-01",
    });
    expect(byDate.dates).toHaveLength(MAX_OCCURRENCES);
    expect(byDate.truncated).toBe(true);
  });

  it("is not truncated when the end date allows exactly the maximum", () => {
    const { dates, truncated } = getSchedule({
      ...base,
      start: "2025-01-01T10:00",
      frequency: "daily",
      endMode: "until",
      until: toDateInputValue(new Date(2025, 0, MAX_OCCURRENCES)),
    });
    expect(dates).toHaveLength(MAX_OCCURRENCES);
    expect(truncated).toBe(false);
  });

  it.each([
    ["an invalid start date", { start: "" }],
    ["an empty count", { count: "" }],
    ["a zero count", { count: "0" }],
    ["a fractional count", { count: "1.5" }],
    ["a zero interval", { interval: "0" }],
    ["an interval above the maximum", { interval: "100" }],
    ["an invalid end date", { endMode: "until" as const, until: "" }],
  ])("returns no bills for %s", (_, changes) => {
    expect(getSchedule({ ...base, ...changes })).toEqual({
      dates: [],
      truncated: false,
    });
  });
});
