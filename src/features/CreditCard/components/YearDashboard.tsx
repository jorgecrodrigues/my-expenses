import React from "react";
import { useQuery } from "convex/react";
import {
  Box,
  Button,
  Heading,
  HStack,
  parseDate,
  SimpleGrid,
  Skeleton,
  Stack,
  Tag,
  Text,
  type DatePickerValueChangeDetails,
} from "@chakra-ui/react";
import CustomYearPicker from "@/shared/components/CustomYearPicker";
import useLatestDefined from "@/shared/hooks/useLatestDefined";
import { api } from "../../../../convex/_generated/api";
import {
  MAX_REPORT_YEAR,
  MIN_REPORT_YEAR,
} from "../../../../convex/lib/creditCardReport";
import useYearDashboardParams from "../hooks/useYearDashboardParams";
import PeriodTransactionsTable from "./PeriodTransactionsTable";
import StatementCategoryChart from "./StatementCategoryChart";
import TopMerchantsList from "./TopMerchantsList";
import YearMonthlyChart from "./YearMonthlyChart";
import YearSummaryCards from "./YearSummaryCards";
import { categoryLabel, formatReferenceMonth } from "../utils/creditCard";

const clampYear = (year: number) =>
  Math.min(Math.max(year, MIN_REPORT_YEAR), MAX_REPORT_YEAR);

function FilterTag({
  label,
  clearLabel,
  onClear,
}: {
  label: string;
  clearLabel: string;
  onClear: () => void;
}) {
  return (
    <Tag.Root size="lg" variant="surface" borderRadius="full">
      <Tag.Label>{label}</Tag.Label>
      <Tag.EndElement>
        <Tag.CloseTrigger aria-label={clearLabel} onClick={onClear} />
      </Tag.EndElement>
    </Tag.Root>
  );
}

export default function YearDashboard() {
  const {
    year: yearParam,
    monthIndex,
    category,
    goToYear,
    selectMonth,
    selectCategory,
  } = useYearDashboardParams();
  const [currentYear] = React.useState(() => new Date().getFullYear());
  const years = useQuery(api.creditCardStatements.listStatementYears);

  const urlYear =
    yearParam !== undefined && clampYear(yearParam) === yearParam
      ? yearParam
      : undefined;
  const year =
    urlYear ?? (years === undefined ? undefined : (years[0] ?? currentYear));

  const liveReport = useQuery(
    api.creditCardStatements.getYearReport,
    year === undefined ? "skip" : { year, category },
  );
  const report = useLatestDefined(liveReport);
  const isUpdating = liveReport === undefined && report !== undefined;

  if (year === undefined) {
    return <Skeleton height="120px" variant="shine" aria-label="Loading yearly report" />;
  }

  if (urlYear === undefined && years?.length === 0) {
    return null;
  }

  const changeYear = (nextYear: number) => goToYear(clampYear(nextYear));

  const handleYearChange = (details: DatePickerValueChangeDetails) => {
    const picked = details.value?.[0];
    if (picked) changeYear(picked.year);
  };

  const monthLabel =
    monthIndex === undefined
      ? undefined
      : formatReferenceMonth(`${year}-${String(monthIndex + 1).padStart(2, "0")}`);
  const periodLabel = [
    monthLabel ?? `Whole ${year}`,
    category ? categoryLabel(category) : "all categories",
  ].join(" · ");

  return (
    <Stack as="section" aria-label="Yearly spending" gap={4}>
      <HStack justify="space-between" align="flex-end" gap="md" wrap="wrap">
        <Stack gap={1}>
          <Heading size="lg">Spending in {year}</Heading>
          <Text color="fg.muted" fontSize="sm">
            Processed statements, grouped by the month they refer to.
          </Text>
        </Stack>
        <HStack gap={3} wrap="wrap">
          {year !== currentYear && (
            <Button size="sm" variant="outline" onClick={() => changeYear(currentYear)}>
              Go to {currentYear}
            </Button>
          )}
          <CustomYearPicker
            value={[parseDate(`${year}-01-01`)]}
            min={parseDate(`${MIN_REPORT_YEAR}-01-01`)}
            max={parseDate(`${MAX_REPORT_YEAR}-12-31`)}
            onPreviousYear={() => changeYear(year - 1)}
            onNextYear={() => changeYear(year + 1)}
            onValueChange={handleYearChange}
          />
        </HStack>
      </HStack>

      {(monthLabel || category) && (
        <HStack gap={2} wrap="wrap" aria-label="Active filters">
          <Text fontSize="sm" color="fg.muted">
            Showing
          </Text>
          {monthLabel && (
            <FilterTag
              label={monthLabel}
              clearLabel="Show the whole year"
              onClear={() => selectMonth(undefined)}
            />
          )}
          {category && (
            <FilterTag
              label={categoryLabel(category)}
              clearLabel="Show all categories"
              onClear={() => selectCategory(undefined)}
            />
          )}
        </HStack>
      )}

      {report === undefined ? (
        <Stack gap={4} aria-label="Loading yearly report">
          <Skeleton height="120px" variant="shine" />
          <Skeleton height="300px" variant="shine" />
        </Stack>
      ) : (
        <Stack
          gap={4}
          opacity={isUpdating ? 0.6 : 1}
          transition="opacity 0.2s"
          aria-busy={isUpdating}
        >
          <YearSummaryCards report={report} monthIndex={monthIndex} />

          <SimpleGrid columns={{ base: 1, lg: 5 }} gap={4}>
            <Box gridColumn={{ lg: "span 3" }} minW={0}>
              <YearMonthlyChart
                report={report}
                selectedMonthIndex={monthIndex}
                onSelectMonth={selectMonth}
                selectedCategory={category}
              />
            </Box>
            <Box gridColumn={{ lg: "span 2" }} minW={0}>
              <StatementCategoryChart
                categories={
                  monthIndex === undefined
                    ? report.byCategory
                    : (report.months[monthIndex]?.byCategory ?? [])
                }
                subtitle={monthLabel ?? `Whole ${year}`}
                emptyMessage="No spending in this period."
                selectedCategory={category}
                onSelectCategory={selectCategory}
              />
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, lg: 5 }} gap={4}>
            <Box gridColumn={{ lg: "span 2" }} minW={0}>
              <TopMerchantsList
                merchants={
                  monthIndex === undefined
                    ? report.topMerchants
                    : (report.months[monthIndex]?.topMerchants ?? [])
                }
                subtitle={periodLabel}
                emptyMessage="No purchases in this period."
              />
            </Box>
            <Box gridColumn={{ lg: "span 3" }} minW={0}>
              <PeriodTransactionsTable
                key={`${year}-${monthIndex ?? ""}-${category ?? ""}`}
                year={year}
                monthIndex={monthIndex}
                category={category}
                periodLabel={periodLabel}
              />
            </Box>
          </SimpleGrid>
        </Stack>
      )}
    </Stack>
  );
}
