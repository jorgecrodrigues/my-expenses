import type { ReactNode } from "react";
import {
  Badge,
  Box,
  HStack,
  Progress,
  SimpleGrid,
  Skeleton,
  Stat,
  Text,
} from "@chakra-ui/react";
import { formatBRL } from "@/shared/utils/currency";
import {
  percentChange,
  type ExpenseTotals,
} from "@/features/Dashboard/utils/dashboardMetrics";

interface SummaryCardsProps {
  /** Totals of the selected month (undefined while loading). */
  current?: ExpenseTotals;
  /** Totals of the previous month, used for the month-over-month change. */
  previous?: ExpenseTotals;
}

function SummaryCard({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={4}
    >
      <Stat.Root gap={1}>
        <Stat.Label>{label}</Stat.Label>
        {children}
      </Stat.Root>
    </Box>
  );
}

function MonthOverMonth({ current, previous }: Required<SummaryCardsProps>) {
  const change = percentChange(current.total, previous.total);

  if (change === null) {
    return (
      <Text fontSize="xs" color="fg.muted">
        No spending last month
      </Text>
    );
  }

  const increased = change > 0;
  return (
    <HStack gap={1}>
      <Badge
        colorPalette={increased ? "red" : "green"}
        variant="subtle"
        gap={0}
      >
        {increased ? <Stat.UpIndicator /> : <Stat.DownIndicator />}
        {Math.abs(change).toFixed(1)}%
      </Badge>
      <Text fontSize="xs" color="fg.muted">
        vs last month
      </Text>
    </HStack>
  );
}

const CARD_LABELS = ["Total", "Paid", "Left to pay", "Overdue"] as const;

export default function SummaryCards({ current, previous }: SummaryCardsProps) {
  if (!current || !previous) {
    return (
      <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4}>
        {CARD_LABELS.map((label) => (
          <SummaryCard key={label} label={label}>
            <Skeleton height="32px" width="70%" variant="shine" />
            <Skeleton height="14px" width="50%" variant="shine" />
          </SummaryCard>
        ))}
      </SimpleGrid>
    );
  }

  const open = current.pending + current.overdue;
  const openCount = current.pendingCount + current.overdueCount;
  const paidPercent =
    current.total > 0 ? Math.round((current.paid / current.total) * 100) : 0;

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4}>
      <SummaryCard label="Total">
        <Stat.ValueText>{formatBRL(current.total)}</Stat.ValueText>
        <Stat.HelpText>
          {current.count} {current.count === 1 ? "bill" : "bills"}
        </Stat.HelpText>
        <MonthOverMonth current={current} previous={previous} />
      </SummaryCard>

      <SummaryCard label="Paid">
        <Stat.ValueText color="fg.success">
          {formatBRL(current.paid)}
        </Stat.ValueText>
        <Stat.HelpText>
          {current.paidCount} of {current.count} bills paid
        </Stat.HelpText>
        <Progress.Root
          value={paidPercent}
          size="xs"
          colorPalette="green"
          aria-label="Paid percentage"
        >
          <HStack gap={2}>
            <Progress.Track flex={1} borderRadius="full">
              <Progress.Range borderRadius="full" />
            </Progress.Track>
            <Progress.ValueText fontSize="xs">
              {paidPercent}%
            </Progress.ValueText>
          </HStack>
        </Progress.Root>
      </SummaryCard>

      <SummaryCard label="Left to pay">
        <Stat.ValueText color="fg.warning">{formatBRL(open)}</Stat.ValueText>
        <Stat.HelpText>
          {openCount} open {openCount === 1 ? "bill" : "bills"}
        </Stat.HelpText>
      </SummaryCard>

      <SummaryCard label="Overdue">
        <Stat.ValueText color={current.overdue > 0 ? "fg.error" : undefined}>
          {formatBRL(current.overdue)}
        </Stat.ValueText>
        <Stat.HelpText>
          {current.overdueCount > 0
            ? `${current.overdueCount} past due`
            : "Nothing past due"}
        </Stat.HelpText>
      </SummaryCard>
    </SimpleGrid>
  );
}
