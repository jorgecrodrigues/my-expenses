import type { ReactNode } from "react";
import { Box, SimpleGrid, Stat } from "@chakra-ui/react";
import type { StatementReport } from "../../../../convex/lib/creditCardReport";
import { formatCents } from "../utils/creditCard";

export function ReportCard({
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

export default function ReportSummaryCards({ report }: { report: StatementReport }) {
  const charges = report.feesCents + report.iofCents + report.interestCents;

  return (
    <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} gap={4}>
      <ReportCard label="Total spent">
        <Stat.ValueText>{formatCents(report.totalSpentCents)}</Stat.ValueText>
        <Stat.HelpText>
          {report.transactionCount} {report.transactionCount === 1 ? "line" : "lines"}
          {report.refundsCents > 0 &&
            ` · ${formatCents(report.refundsCents)} refunded`}
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

      <ReportCard label="Future installments">
        <Stat.ValueText color="fg.warning">
          {formatCents(report.futureInstallmentsCents)}
        </Stat.ValueText>
        <Stat.HelpText>
          {formatCents(report.installmentsCents)} in installments this month
        </Stat.HelpText>
      </ReportCard>
    </SimpleGrid>
  );
}
