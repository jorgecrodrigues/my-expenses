import React from "react";
import { Box, HStack, Skeleton, Stack, Text } from "@chakra-ui/react";
import { formatBRL } from "@/shared/utils/currency";
import { generateColorByString } from "@/shared/utils/color";
import {
  getMonthlyAmountsByKey,
  groupBy,
  groupByMonth,
  type Expense,
} from "@/features/Dashboard/utils/dashboardMetrics";
import MonthlyStackedBarChart, {
  type StackedSeries,
} from "./MonthlyStackedBarChart";
import OptionToggle from "@/shared/components/OptionToggle";

type TrendView = "status" | "category";

const VIEW_OPTIONS = [
  { value: "status", label: "By status" },
  { value: "category", label: "By category" },
] satisfies { value: TrendView; label: string }[];

const STATUS_SERIES: StackedSeries[] = [
  { id: "paid", label: "Paid", color: "green.solid" },
  { id: "pending", label: "Pending", color: "blue.solid" },
  { id: "overdue", label: "Overdue", color: "red.solid" },
];

interface MonthlyTrendChartProps {
  /** Expenses of `year` (undefined while loading). */
  expenses?: Expense[];
  year: number;
  selectedMonthIndex: number;
  onSelectMonth: (monthIndex: number) => void;
  now: Date;
}

export default function MonthlyTrendChart({
  expenses,
  year,
  selectedMonthIndex,
  onSelectMonth,
  now,
}: MonthlyTrendChartProps) {
  const [view, setView] = React.useState<TrendView>("status");

  const months = React.useMemo(
    () => (expenses ? groupByMonth(expenses, year, now) : []),
    [expenses, year, now],
  );

  const chartData = React.useMemo(() => {
    if (!expenses) return undefined;

    if (view === "status") {
      return {
        series: STATUS_SERIES,
        data: months.map(({ paid, pending, overdue }) => ({
          paid,
          pending,
          overdue,
        })),
      };
    }

    const categories = groupBy(expenses, (expense) => expense.category, now);
    const keyByCategory = new Map(
      categories.map((category, index) => [category.key, `k${index}`]),
    );
    return {
      series: categories.map((category, index) => ({
        id: `k${index}`,
        label: category.key,
        color: generateColorByString(category.key),
      })),
      data: getMonthlyAmountsByKey(
        expenses,
        year,
        (expense) => keyByCategory.get(expense.category) ?? "",
      ),
    };
  }, [expenses, months, now, view, year]);

  const yearTotal = months.reduce((sum, month) => sum + month.total, 0);
  const activeMonths = months.filter((month) => month.total > 0).length;

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={4}
      h="full"
    >
      <HStack
        justify="space-between"
        align="flex-start"
        wrap="wrap"
        gap={3}
        mb={4}
      >
        <Stack gap={0.5}>
          <Text fontSize="lg" fontWeight="bold">
            Monthly overview · {year}
          </Text>
          {expenses === undefined ? (
            <Skeleton height="16px" width="14rem" variant="shine" />
          ) : (
            <Text fontSize="sm" color="fg.muted">
              Year total {formatBRL(yearTotal)} · Monthly average{" "}
              {formatBRL(activeMonths ? yearTotal / activeMonths : 0)}
            </Text>
          )}
        </Stack>
        <OptionToggle
          label="Chart view"
          value={view}
          options={VIEW_OPTIONS}
          onChange={setView}
        />
      </HStack>

      {chartData === undefined ? (
        <Skeleton height="300px" variant="shine" borderRadius="md" />
      ) : yearTotal === 0 ? (
        <Box py={16} textAlign="center" color="fg.muted">
          No expenses recorded in {year}.
        </Box>
      ) : (
        <>
          <MonthlyStackedBarChart
            data={chartData.data}
            series={chartData.series}
            selectedMonthIndex={selectedMonthIndex}
            onSelectMonth={onSelectMonth}
          />
          <Text fontSize="xs" color="fg.subtle" textAlign="center" mt={1}>
            Click a bar to open that month.
          </Text>
        </>
      )}
    </Box>
  );
}
