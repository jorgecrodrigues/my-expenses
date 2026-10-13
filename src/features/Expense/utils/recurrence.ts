export type RepeatFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type RecurrenceEndMode = "count" | "until";

/** Form state of a repeat schedule; numeric fields are kept as typed text. */
export interface RecurrenceValue {
  /** First due date as a `datetime-local` value (local time). */
  start: string;
  frequency: RepeatFrequency;
  interval: string;
  endMode: RecurrenceEndMode;
  count: string;
  /** Last allowed due date as a `date` value (inclusive). */
  until: string;
}

export interface Schedule {
  dates: Date[];
  /** True when the schedule was cut at `MAX_OCCURRENCES`. */
  truncated: boolean;
}

/** Must match the limit enforced by `addRecurringExpenses` in Convex. */
export const MAX_OCCURRENCES = 120;
export const MAX_INTERVAL = 99;

const pad = (value: number) => String(value).padStart(2, "0");

/** Formats a date as a `date` input value in local time (YYYY-MM-DD). */
export function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Formats a date as a `datetime-local` input value in local time. */
export function toDateTimeLocalValue(date: Date): string {
  return `${toDateInputValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Adds months keeping the day of month, clamped to the target month's length. */
function addMonthsClamped(date: Date, months: number): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(
    result.getFullYear(),
    result.getMonth() + 1,
    0,
  ).getDate();
  result.setDate(Math.min(date.getDate(), lastDay));
  return result;
}

/** Returns the date `steps` frequency units after `start`. */
export function addInterval(
  start: Date,
  frequency: RepeatFrequency,
  steps: number,
): Date {
  switch (frequency) {
    case "daily": {
      const result = new Date(start);
      result.setDate(result.getDate() + steps);
      return result;
    }
    case "weekly": {
      const result = new Date(start);
      result.setDate(result.getDate() + steps * 7);
      return result;
    }
    case "monthly":
      return addMonthsClamped(start, steps);
    case "yearly":
      return addMonthsClamped(start, steps * 12);
  }
}

function parsePositiveInt(value: string): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null;
}

/** Computes every due date described by the schedule form. */
export function getSchedule(value: RecurrenceValue): Schedule {
  const empty: Schedule = { dates: [], truncated: false };

  const start = new Date(value.start);
  const interval = parsePositiveInt(value.interval);
  if (Number.isNaN(start.getTime()) || !interval || interval > MAX_INTERVAL) {
    return empty;
  }

  const nth = (index: number) =>
    addInterval(start, value.frequency, index * interval);

  if (value.endMode === "count") {
    const count = parsePositiveInt(value.count);
    if (!count) return empty;
    const total = Math.min(count, MAX_OCCURRENCES);
    return {
      dates: Array.from({ length: total }, (_, index) => nth(index)),
      truncated: count > MAX_OCCURRENCES,
    };
  }

  const end = new Date(`${value.until}T23:59:59.999`);
  if (Number.isNaN(end.getTime())) return empty;

  const dates: Date[] = [];
  for (let index = 0; index <= MAX_OCCURRENCES; index++) {
    const date = nth(index);
    if (date > end) break;
    if (index === MAX_OCCURRENCES) return { dates, truncated: true };
    dates.push(date);
  }
  return { dates, truncated: false };
}
