"use client";

import {
  DatePicker,
  Portal,
  type DatePickerRootProps,
  type DateValue,
} from "@chakra-ui/react";
import { CalendarDate } from "@internationalized/date";
import { IconCalendarMonth } from "@tabler/icons-react";

export default function CustomMonthPicker(props: DatePickerRootProps) {
  return (
    <DatePicker.Root
      format={format}
      parse={parse}
      defaultView="month"
      minView="month"
      placeholder="mm/yyyy"
      maxWidth={120}
      {...props}
    >
      <DatePicker.Label />
      <DatePicker.Control>
        <DatePicker.Input />
        <DatePicker.IndicatorGroup>
          <DatePicker.Trigger>
            <IconCalendarMonth />
          </DatePicker.Trigger>
        </DatePicker.IndicatorGroup>
      </DatePicker.Control>
      <Portal>
        <DatePicker.Positioner>
          <DatePicker.Content>
            <DatePicker.View view="month">
              <DatePicker.Header />
              <DatePicker.MonthTable />
            </DatePicker.View>
            <DatePicker.View view="year">
              <DatePicker.Header />
              <DatePicker.YearTable />
            </DatePicker.View>
          </DatePicker.Content>
        </DatePicker.Positioner>
      </Portal>
    </DatePicker.Root>
  );
}

const format = (date: DateValue): string => {
  const month = date.month.toString().padStart(2, "0");
  const year = date.year.toString();
  return `${month}/${year}`;
};

const parse = (value: string) => {
  const fullRegex = /^(\d{1,2})\/(\d{4})$/;
  const fullMatch = value.match(fullRegex);
  if (fullMatch) {
    const [, month, year] = fullMatch.map(Number);
    return new CalendarDate(year, month, 1);
  }
};
