"use client";

import {
  DatePicker,
  IconButton,
  InputGroup,
  Portal,
  type DatePickerRootProps,
} from "@chakra-ui/react";
import { formatYearPickerValue, parseYearPickerValue } from "../utils/yearPickerValue";
import {
  IconCalendarMinus,
  IconCalendarMonth,
  IconCalendarPlus,
} from "@tabler/icons-react";

interface CustomYearPickerProps extends DatePickerRootProps {
  onPreviousYear?: () => void;
  onNextYear?: () => void;
}

export default function CustomYearPicker({
  onPreviousYear,
  onNextYear,
  ...props
}: CustomYearPickerProps) {
  return (
    <DatePicker.Root
      format={formatYearPickerValue}
      parse={parseYearPickerValue}
      defaultView="year"
      minView="year"
      placeholder="yyyy"
      maxWidth={240}
      openOnClick
      {...props}
    >
      <DatePicker.Label />
      <InputGroup
        as={DatePicker.Control}
        startAddon={
          <>
            <IconButton
              aria-label="Previous year"
              variant="ghost"
              size="sm"
              onClick={onPreviousYear}
            >
              <IconCalendarMinus />
            </IconButton>
            <IconButton
              aria-label="Next year"
              variant="ghost"
              size="sm"
              onClick={onNextYear}
            >
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
