import React from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import MonthlyStackedBarChart from "@/features/Dashboard/components/MonthlyStackedBarChart";
import OptionToggle from "@/shared/components/OptionToggle";
import type { YearReport } from "../../../../convex/lib/creditCardReport";
import {
  categoryLabel,
  formatCents,
  getMonthlyCategoryChart,
  getMonthlyIssuerAmounts,
  getMonthlyStats,
  ISSUER_COLORS,
  issuerLabel,
} from "../utils/creditCard";

type ChartView = "card" | "category";

const VIEW_OPTIONS = [
  { value: "card", label: "By card" },
  { value: "category", label: "By category" },
] satisfies { value: ChartView; label: string }[];

interface YearMonthlyChartProps {
  report: YearReport;
  selectedMonthIndex?: number;
  /** Called with undefined when the selected month is clicked again. */
  onSelectMonth: (monthIndex?: number) => void;
  selectedCategory?: string;
}

export default function YearMonthlyChart({
  report,
  selectedMonthIndex,
  onSelectMonth,
  selectedCategory,
}: YearMonthlyChartProps) {
  const [view, setView] = React.useState<ChartView>("card");

  const chart = React.useMemo(() => {
    if (view === "card") {
      return {
        series: report.byIssuer.map(({ issuer }) => ({
          id: issuer,
          label: issuerLabel(issuer),
          color: ISSUER_COLORS[issuer],
        })),
        data: getMonthlyIssuerAmounts(report.months),
      };
    }
    const categories = selectedCategory
      ? [selectedCategory]
      : report.byCategory
          .filter((category) => category.totalCents > 0)
          .map((category) => category.category);
    return getMonthlyCategoryChart(report.months, categories);
  }, [report, selectedCategory, view]);

  const stats = getMonthlyStats(report.months);

  const handleSelectMonth = (monthIndex: number) =>
    onSelectMonth(monthIndex === selectedMonthIndex ? undefined : monthIndex);

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={4}
      h="full"
    >
      <HStack justify="space-between" align="flex-start" wrap="wrap" gap={3} mb={4}>
        <Stack gap={0.5}>
          <Text fontSize="lg" fontWeight="bold">
            Monthly overview · {report.year}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            {selectedCategory && `${categoryLabel(selectedCategory)} · `}
            Year total {formatCents(report.totalSpentCents)} · Monthly average{" "}
            {formatCents(stats?.averageCents ?? 0)}
          </Text>
        </Stack>
        <OptionToggle
          label="Chart view"
          value={view}
          options={VIEW_OPTIONS}
          onChange={setView}
        />
      </HStack>

      {report.totalSpentCents === 0 ? (
        <Box py={16} textAlign="center" color="fg.muted">
          {selectedCategory
            ? `No spending in ${categoryLabel(selectedCategory)} in ${report.year}.`
            : `No processed statements in ${report.year}.`}
        </Box>
      ) : (
        <>
          <MonthlyStackedBarChart
            data={chart.data}
            series={chart.series}
            selectedMonthIndex={selectedMonthIndex}
            onSelectMonth={handleSelectMonth}
            showLegend={chart.series.length > 1}
          />
          <Text fontSize="xs" color="fg.subtle" textAlign="center" mt={1}>
            Click a bar to focus on that month; click it again to see the whole
            year.
          </Text>
        </>
      )}
    </Box>
  );
}
