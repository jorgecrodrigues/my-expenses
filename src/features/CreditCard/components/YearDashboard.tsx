import React from "react";
import { useQuery } from "convex/react";
import {
  Box,
  Heading,
  HStack,
  NativeSelect,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
} from "@chakra-ui/react";
import MonthlyStackedBarChart from "@/features/Dashboard/components/MonthlyStackedBarChart";
import { api } from "../../../../convex/_generated/api";
import StatementCategoryChart from "./StatementCategoryChart";
import TopMerchantsList from "./TopMerchantsList";
import YearSummaryCards from "./YearSummaryCards";
import {
  getMonthlyIssuerAmounts,
  ISSUER_COLORS,
  issuerLabel,
} from "../utils/creditCard";

export default function YearDashboard() {
  const years = useQuery(api.creditCardStatements.listStatementYears);
  const [pickedYear, setPickedYear] = React.useState<number>();
  const year =
    pickedYear !== undefined && years?.includes(pickedYear)
      ? pickedYear
      : years?.[0];
  const report = useQuery(
    api.creditCardStatements.getYearReport,
    year === undefined ? "skip" : { year },
  );

  const chart = React.useMemo(
    () =>
      report && {
        data: getMonthlyIssuerAmounts(report.months),
        series: report.byIssuer.map(({ issuer }) => ({
          id: issuer,
          label: issuerLabel(issuer),
          color: ISSUER_COLORS[issuer],
        })),
      },
    [report],
  );

  if (years === undefined) {
    return <Skeleton height="120px" variant="shine" aria-label="Loading yearly report" />;
  }

  if (year === undefined) {
    return null;
  }

  return (
    <Stack as="section" aria-label="Yearly spending" gap={4}>
      <HStack justify="space-between" align="flex-end" gap="md" wrap="wrap">
        <Stack gap={1}>
          <Heading size="lg">Spending in {year}</Heading>
          <Text color="fg.muted" fontSize="sm">
            All processed statements, grouped by the month they refer to.
          </Text>
        </Stack>
        <NativeSelect.Root size="sm" width="auto">
          <NativeSelect.Field
            aria-label="Year"
            value={year}
            onChange={(event) => setPickedYear(Number(event.currentTarget.value))}
          >
            {years.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </HStack>

      {report === undefined || chart === undefined ? (
        <Stack gap={4} aria-label="Loading yearly report">
          <Skeleton height="120px" variant="shine" />
          <Skeleton height="300px" variant="shine" />
        </Stack>
      ) : (
        <>
          <YearSummaryCards report={report} />

          <Box
            borderWidth="1px"
            borderColor="border.subtle"
            borderRadius="xl"
            bg="bg.panel"
            p={4}
          >
            <Text fontSize="lg" fontWeight="bold" mb={4}>
              Spending by month
            </Text>
            <MonthlyStackedBarChart
              data={chart.data}
              series={chart.series}
              showLegend={chart.series.length > 1}
            />
          </Box>

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            <StatementCategoryChart
              categories={report.byCategory}
              emptyMessage="No spending this year."
            />
            <TopMerchantsList
              merchants={report.topMerchants}
              emptyMessage="No purchases this year."
            />
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}
