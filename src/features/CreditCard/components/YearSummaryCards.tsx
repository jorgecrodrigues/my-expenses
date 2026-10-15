import { Badge, HStack, Progress, SimpleGrid, Stat, Text } from "@chakra-ui/react";
import { percentChange } from "@/features/Dashboard/utils/dashboardMetrics";
import type { YearReport } from "../../../../convex/lib/creditCardReport";
import { ReportCard } from "./ReportSummaryCards";
import {
  formatCents,
  formatReferenceMonth,
  getMonthlyStats,
} from "../utils/creditCard";

function MonthOverMonth({
  currentCents,
  previousCents,
}: {
  currentCents: number;
  previousCents: number;
}) {
  const change = percentChange(currentCents, previousCents);

  if (change === null) {
    return (
      <Text fontSize="xs" color="fg.muted">
        No spending the month before
      </Text>
    );
  }

  const increased = change > 0;
  return (
    <HStack gap={1}>
      <Badge colorPalette={increased ? "red" : "green"} variant="subtle" gap={0}>
        {increased ? <Stat.UpIndicator /> : <Stat.DownIndicator />}
        {Math.abs(change).toFixed(1)}%
      </Badge>
      <Text fontSize="xs" color="fg.muted">
        vs previous month
      </Text>
    </HStack>
  );
}

interface YearSummaryCardsProps {
  report: YearReport;
  /** When set, the cards describe this month instead of the whole year. */
  monthIndex?: number;
}

export default function YearSummaryCards({
  report,
  monthIndex,
}: YearSummaryCardsProps) {
  const month = monthIndex === undefined ? undefined : report.months[monthIndex];
  const period = month ?? report;
  const charges = period.feesCents + period.iofCents + period.interestCents;
  const stats = getMonthlyStats(report.months);
  const yearShare =
    month && report.totalSpentCents > 0
      ? Math.round((month.totalSpentCents / report.totalSpentCents) * 100)
      : 0;

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4}>
      <ReportCard label="Total spent">
        <Stat.ValueText>{formatCents(period.totalSpentCents)}</Stat.ValueText>
        <Stat.HelpText>
          {period.statementCount}{" "}
          {period.statementCount === 1 ? "statement" : "statements"} ·{" "}
          {period.transactionCount}{" "}
          {period.transactionCount === 1 ? "line" : "lines"}
          {period.refundsCents > 0 &&
            ` · ${formatCents(period.refundsCents)} refunded`}
        </Stat.HelpText>
        {monthIndex !== undefined && month && (
          <MonthOverMonth
            currentCents={month.totalSpentCents}
            previousCents={report.months[monthIndex - 1]?.totalSpentCents ?? 0}
          />
        )}
      </ReportCard>

      {month ? (
        <ReportCard label="Share of the year">
          <Stat.ValueText>{yearShare}%</Stat.ValueText>
          <Stat.HelpText>
            of {formatCents(report.totalSpentCents)} in {report.year}
          </Stat.HelpText>
          <Progress.Root value={yearShare} size="xs" aria-label="Share of the year">
            <Progress.Track borderRadius="full">
              <Progress.Range borderRadius="full" />
            </Progress.Track>
          </Progress.Root>
        </ReportCard>
      ) : (
        <ReportCard label="Monthly average">
          <Stat.ValueText>{formatCents(stats?.averageCents ?? 0)}</Stat.ValueText>
          <Stat.HelpText>
            {stats
              ? `Peak ${formatReferenceMonth(stats.peak.month)}: ${formatCents(stats.peak.totalSpentCents)}`
              : "No spending this year"}
          </Stat.HelpText>
        </ReportCard>
      )}

      <ReportCard label="International">
        <Stat.ValueText>{formatCents(period.internationalCents)}</Stat.ValueText>
        <Stat.HelpText>{formatCents(period.iofCents)} in IOF</Stat.HelpText>
      </ReportCard>

      <ReportCard label="Fees and interest">
        <Stat.ValueText color={charges > 0 ? "fg.error" : undefined}>
          {formatCents(charges)}
        </Stat.ValueText>
        <Stat.HelpText>
          Fees {formatCents(period.feesCents)} · Interest{" "}
          {formatCents(period.interestCents)}
        </Stat.HelpText>
      </ReportCard>
    </SimpleGrid>
  );
}
