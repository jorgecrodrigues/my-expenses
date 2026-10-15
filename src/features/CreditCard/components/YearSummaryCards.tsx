import { SimpleGrid, Stat } from "@chakra-ui/react";
import type { YearReport } from "../../../../convex/lib/creditCardReport";
import { ReportCard } from "./ReportSummaryCards";
import {
  formatCents,
  formatReferenceMonth,
  getMonthlyStats,
} from "../utils/creditCard";

export default function YearSummaryCards({ report }: { report: YearReport }) {
  const charges = report.feesCents + report.iofCents + report.interestCents;
  const stats = getMonthlyStats(report.months);

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4}>
      <ReportCard label="Total spent">
        <Stat.ValueText>{formatCents(report.totalSpentCents)}</Stat.ValueText>
        <Stat.HelpText>
          {report.statementCount}{" "}
          {report.statementCount === 1 ? "statement" : "statements"} ·{" "}
          {report.transactionCount}{" "}
          {report.transactionCount === 1 ? "line" : "lines"}
          {report.refundsCents > 0 &&
            ` · ${formatCents(report.refundsCents)} refunded`}
        </Stat.HelpText>
      </ReportCard>

      <ReportCard label="Monthly average">
        <Stat.ValueText>{formatCents(stats?.averageCents ?? 0)}</Stat.ValueText>
        <Stat.HelpText>
          {stats
            ? `Peak ${formatReferenceMonth(stats.peak.month)}: ${formatCents(stats.peak.totalSpentCents)}`
            : "No spending this year"}
        </Stat.HelpText>
      </ReportCard>

      <ReportCard label="International">
        <Stat.ValueText>{formatCents(report.internationalCents)}</Stat.ValueText>
        <Stat.HelpText>{formatCents(report.iofCents)} in IOF</Stat.HelpText>
      </ReportCard>

      <ReportCard label="Fees and interest">
        <Stat.ValueText color={charges > 0 ? "fg.error" : undefined}>
          {formatCents(charges)}
        </Stat.ValueText>
        <Stat.HelpText>
          Fees {formatCents(report.feesCents)} · Interest{" "}
          {formatCents(report.interestCents)}
        </Stat.HelpText>
      </ReportCard>
    </SimpleGrid>
  );
}
