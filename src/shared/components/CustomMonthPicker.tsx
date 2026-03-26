"use client";

import {
  DatePicker,
  IconButton,
  InputGroup,
  Portal,
  type DatePickerRootProps,
} from "@chakra-ui/react";
import { formatMonthPickerValue, parseMonthPickerValue } from "../utils/monthPickerValue";
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
      format={formatMonthPickerValue}
      parse={parseMonthPickerValue}
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
