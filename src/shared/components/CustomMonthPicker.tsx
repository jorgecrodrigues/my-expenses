"use client";

import {
  DatePicker,
  IconButton,
  InputGroup,
  Portal,
  type DatePickerRootProps,
  type DateValue,
} from "@chakra-ui/react";
import { CalendarDate } from "@internationalized/date";
import {
  IconCalendarMinus,
  IconCalendarMonth,
  IconCalendarPlus,
} from "@tabler/icons-react";

interface CustomMonthPickerProps extends DatePickerRootProps {
  onPreviousMonth?: () => void;
  onNextMonth?: () => void;
}

export default function CustomMonthPicker({
  onPreviousMonth,
  onNextMonth,
  ...props
}: CustomMonthPickerProps) {
  return (
    <DatePicker.Root
      format={format}
      parse={parse}
      defaultView="month"
      minView="month"
      placeholder="mm/yyyy"
      maxWidth={300}
      {...props}
    >
      <DatePicker.Label />
      <InputGroup
        as={DatePicker.Control}
        startAddon={
          <>
            <IconButton variant="ghost" size="sm" onClick={onPreviousMonth}>
              <IconCalendarMinus />
            </IconButton>
            <IconButton variant="ghost" size="sm" onClick={onNextMonth}>
              <IconCalendarPlus />
            </IconButton>
          </>
        }
        endElement={
          <DatePicker.IndicatorGroup>
            <DatePicker.Trigger asChild>
              <IconButton
                aria-label="open calendar"
                role="button"
                name="open calendar"
                variant="ghost"
                size="sm"
              >
                <IconCalendarMonth />
              </IconButton>
            </DatePicker.Trigger>
          </DatePicker.IndicatorGroup>
        }
      >
        <DatePicker.Input />
      </InputGroup>
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
