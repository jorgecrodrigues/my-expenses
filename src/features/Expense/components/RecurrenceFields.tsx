import {
  Badge,
  Box,
  Button,
  Field,
  HStack,
  Input,
  NativeSelect,
  SimpleGrid,
  Stack,
  Text,
  Wrap,
} from "@chakra-ui/react";
import OptionToggle from "@/shared/components/OptionToggle";
import { formatBRL } from "@/shared/utils/currency";
import {
  MAX_INTERVAL,
  MAX_OCCURRENCES,
  type RecurrenceEndMode,
  type RecurrenceValue,
  type RepeatFrequency,
  type Schedule,
} from "../utils/recurrence";

const MAX_PREVIEW_DATES = 6;

const UNITS: Record<RepeatFrequency, { one: string; many: string }> = {
  daily: { one: "day", many: "days" },
  weekly: { one: "week", many: "weeks" },
  monthly: { one: "month", many: "months" },
  yearly: { one: "year", many: "years" },
};

const PRESET_COUNTS: Record<RepeatFrequency, number[]> = {
  daily: [7, 15, 30],
  weekly: [4, 8, 12],
  monthly: [3, 6, 12, 24],
  yearly: [2, 3, 5],
};

const END_MODE_OPTIONS = [
  { value: "count", label: "After a number of bills" },
  { value: "until", label: "On a date" },
] satisfies { value: RecurrenceEndMode; label: string }[];

const formatDate = (date: Date) =>
  date.toLocaleDateString("pt-BR", { dateStyle: "medium" });

const pluralize = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

function SchedulePreview({
  schedule,
  amount,
}: {
  schedule: Schedule;
  amount: number;
}) {
  const { dates, truncated } = schedule;
  const count = dates.length;

  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label="Schedule preview"
      bg="bg.muted"
      borderRadius="md"
      px={3}
      py={2.5}
    >
      {count === 0 ? (
        <Text fontSize="sm" color="fg.error">
          No bills match this schedule. Check the dates and the repetition.
        </Text>
      ) : (
        <Stack gap={2}>
          <Stack gap={0}>
            <Text fontSize="sm" fontWeight="semibold">
              {pluralize(count, "bill", "bills")} will be created
              {Number.isFinite(amount) &&
                ` · ${formatBRL(amount * count)} in total`}
            </Text>
            {count > 1 && (
              <Text fontSize="xs" color="fg.muted">
                From {formatDate(dates[0])} to {formatDate(dates[count - 1])}
              </Text>
            )}
          </Stack>
          <Wrap gap={1.5}>
            {dates.slice(0, MAX_PREVIEW_DATES).map((date) => (
              <Badge key={date.getTime()} variant="surface">
                {formatDate(date)}
              </Badge>
            ))}
            {count > MAX_PREVIEW_DATES && (
              <Badge variant="outline">+{count - MAX_PREVIEW_DATES} more</Badge>
            )}
          </Wrap>
          {truncated && (
            <Text fontSize="xs" color="fg.warning">
              Limited to {MAX_OCCURRENCES} bills at a time.
            </Text>
          )}
        </Stack>
      )}
    </Box>
  );
}

interface RecurrenceFieldsProps {
  value: RecurrenceValue;
  onChange: (value: RecurrenceValue) => void;
  schedule: Schedule;
  /** Amount of each bill, used for the preview total (NaN when empty). */
  amount: number;
  /** Due date of the bill being duplicated. */
  originalDate: Date;
}

export default function RecurrenceFields({
  value,
  onChange,
  schedule,
  amount,
  originalDate,
}: RecurrenceFieldsProps) {
  const update = (changes: Partial<RecurrenceValue>) =>
    onChange({ ...value, ...changes });

  const unit = UNITS[value.frequency];
  const singleInterval = value.interval === "1";
  const startYear = value.start.slice(0, 4);
  const endOfYear = `${startYear}-12-31`;

  const isCountPreset = (count: number) =>
    value.endMode === "count" && value.count === String(count);

  return (
    <Stack gap={4}>
      <SimpleGrid columns={{ base: 1, sm: 2 }} gap={3}>
        <Field.Root required>
          <Field.Label>
            First due date
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            type="datetime-local"
            value={value.start}
            onChange={(event) => update({ start: event.target.value })}
          />
          <Field.HelperText>
            Original bill due on {formatDate(originalDate)}
          </Field.HelperText>
        </Field.Root>

        <Stack gap={1.5}>
          <Text fontSize="sm" fontWeight="medium">
            Repeat every
          </Text>
          <HStack gap={2}>
            <Input
              type="number"
              aria-label="Repeat interval"
              min={1}
              max={MAX_INTERVAL}
              w="5rem"
              value={value.interval}
              onChange={(event) => update({ interval: event.target.value })}
            />
            <NativeSelect.Root flex={1}>
              <NativeSelect.Field
                aria-label="Repeat frequency"
                value={value.frequency}
                onChange={(event) =>
                  update({ frequency: event.target.value as RepeatFrequency })
                }
              >
                {(Object.keys(UNITS) as RepeatFrequency[]).map((frequency) => (
                  <option key={frequency} value={frequency}>
                    {singleInterval
                      ? UNITS[frequency].one
                      : UNITS[frequency].many}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </HStack>
        </Stack>
      </SimpleGrid>

      <Stack gap={1.5}>
        <Text fontSize="sm" fontWeight="medium">
          Ends
        </Text>
        <HStack gap={3} wrap="wrap">
          <OptionToggle
            label="Schedule end"
            value={value.endMode}
            options={END_MODE_OPTIONS}
            onChange={(endMode) => update({ endMode })}
          />
          {value.endMode === "count" ? (
            <HStack gap={2}>
              <Input
                type="number"
                aria-label="Number of bills"
                size="sm"
                min={1}
                max={MAX_OCCURRENCES}
                w="5rem"
                value={value.count}
                onChange={(event) => update({ count: event.target.value })}
              />
              <Text fontSize="sm" color="fg.muted">
                bills
              </Text>
            </HStack>
          ) : (
            <Input
              type="date"
              aria-label="Last due date"
              size="sm"
              w="11rem"
              min={value.start.slice(0, 10)}
              value={value.until}
              onChange={(event) => update({ until: event.target.value })}
            />
          )}
        </HStack>
      </Stack>

      <Wrap gap={2} align="center">
        <Text fontSize="xs" color="fg.muted">
          Quick picks:
        </Text>
        <Button
          size="xs"
          variant={isCountPreset(1) ? "solid" : "outline"}
          onClick={() => update({ endMode: "count", count: "1" })}
        >
          Just once
        </Button>
        {PRESET_COUNTS[value.frequency].map((count) => (
          <Button
            key={count}
            size="xs"
            variant={isCountPreset(count) ? "solid" : "outline"}
            onClick={() => update({ endMode: "count", count: String(count) })}
          >
            {singleInterval ? `${count} ${unit.many}` : `${count} bills`}
          </Button>
        ))}
        {value.frequency !== "yearly" && (
          <Button
            size="xs"
            variant={
              value.endMode === "until" && value.until === endOfYear
                ? "solid"
                : "outline"
            }
            onClick={() => update({ endMode: "until", until: endOfYear })}
          >
            Until end of {startYear}
          </Button>
        )}
      </Wrap>

      <SchedulePreview schedule={schedule} amount={amount} />
    </Stack>
  );
}
