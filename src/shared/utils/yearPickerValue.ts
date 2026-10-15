import type { DateValue } from "@chakra-ui/react";
import { CalendarDate } from "@internationalized/date";

export function formatYearPickerValue(date: DateValue): string {
  return date.year.toString();
}

export function parseYearPickerValue(value: string): CalendarDate | undefined {
  const match = value.trim().match(/^(\d{4})$/);
  if (match) {
    return new CalendarDate(Number(match[1]), 1, 1);
  }
}
