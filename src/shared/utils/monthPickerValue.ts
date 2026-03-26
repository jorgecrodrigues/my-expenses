import type { DateValue } from "@chakra-ui/react";
import { CalendarDate } from "@internationalized/date";

export function formatMonthPickerValue(date: DateValue): string {
  const month = date.month.toString().padStart(2, "0");
  const year = date.year.toString();
  return `${month}/${year}`;
}

export function parseMonthPickerValue(value: string): CalendarDate | undefined {
  const fullRegex = /^(\d{1,2})\/(\d{4})$/;
  const fullMatch = value.match(fullRegex);
  if (fullMatch) {
    const [, month, year] = fullMatch.map(Number);
    return new CalendarDate(year, month, 1);
  }
}
