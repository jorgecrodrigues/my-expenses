import React from "react";
import {
  Box,
  Heading,
  HStack,
  parseDate,
  SimpleGrid,
  Stack,
  Text,
  type DatePickerValueChangeDetails,
} from "@chakra-ui/react";
import CustomMonthPicker from "@/shared/components/CustomMonthPicker";
import useDashboardRoute from "@/features/Dashboard/hooks/useDashboardRoute";
import useDashboardExpenses from "@/features/Dashboard/hooks/useDashboardExpenses";
import {
  filterByMonth,
  filterByYear,
  getMonthLabel,
  getPreviousMonth,
  summarizeExpenses,
} from "@/features/Dashboard/utils/dashboardMetrics";
import SummaryCards from "../components/SummaryCards";
import MonthlyTrendChart from "../components/MonthlyTrendChart";
import CategoryBreakdown from "../components/CategoryBreakdown";
import CategoryDetail from "../components/CategoryDetail";
import BillsTable from "@/features/Expense/components/BillsTable";

export default function DashboardPage() {
  const { date, year, monthIndex, category, goToMonth, selectCategory } =
    useDashboardRoute();
  const expenses = useDashboardExpenses(year);
  const [now] = React.useState(() => new Date());

  const monthLabel = `${getMonthLabel(monthIndex)} ${year}`;

  const data = React.useMemo(() => {
    if (!expenses) return undefined;

    const previous = getPreviousMonth(year, monthIndex);
    const yearExpenses = filterByYear(expenses, year);
    const monthExpenses = filterByMonth(expenses, year, monthIndex);

    return {
      yearExpenses,
      monthExpenses,
      currentTotals: summarizeExpenses(monthExpenses, now),
      previousTotals: summarizeExpenses(
        filterByMonth(expenses, previous.year, previous.monthIndex),
        now,
      ),
    };
  }, [expenses, monthIndex, now, year]);

  const categoryYearExpenses = React.useMemo(
    () =>
      category
        ? data?.yearExpenses.filter((expense) => expense.category === category)
        : undefined,
    [category, data],
  );

  const billsExpenses = React.useMemo(
    () =>
      category
        ? data?.monthExpenses.filter((expense) => expense.category === category)
        : data?.monthExpenses,
    [category, data],
  );

  const handleSelectMonth = React.useCallback(
    (nextMonthIndex: number) => goToMonth(year, nextMonthIndex),
    [goToMonth, year],
  );

  const handleDateChange = (details: DatePickerValueChangeDetails) => {
    const picked = details.value?.[0];
    goToMonth(picked?.year ?? year, (picked?.month ?? monthIndex + 1) - 1);
  };

  return (
    <Stack gap={6}>
      <HStack gap="md" justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={1}>
          <Heading>Dashboard</Heading>
          <Text color="fg.muted">Overview of your bills for {monthLabel}</Text>
        </Stack>
        <CustomMonthPicker
          size="xl"
          value={[parseDate(date)]}
          onPreviousMonth={() => goToMonth(year, monthIndex - 1)}
          onNextMonth={() => goToMonth(year, monthIndex + 1)}
          onValueChange={handleDateChange}
        />
      </HStack>

      <SummaryCards
        current={data?.currentTotals}
        previous={data?.previousTotals}
      />

      <SimpleGrid columns={{ base: 1, lg: 5 }} gap={4}>
        <Box gridColumn={{ lg: "span 3" }} minW={0}>
          <MonthlyTrendChart
            expenses={data?.yearExpenses}
            year={year}
            selectedMonthIndex={monthIndex}
            onSelectMonth={handleSelectMonth}
            now={now}
          />
        </Box>
        <Box gridColumn={{ lg: "span 2" }} minW={0}>
          <CategoryBreakdown
            expenses={data?.monthExpenses}
            monthLabel={monthLabel}
            selectedCategory={category}
            onSelectCategory={selectCategory}
            now={now}
          />
        </Box>
      </SimpleGrid>

      {category && (
        <CategoryDetail
          key={`${category}-${year}`}
          category={category}
          year={year}
          expenses={categoryYearExpenses}
          selectedMonthIndex={monthIndex}
          onSelectMonth={handleSelectMonth}
          onClose={() => selectCategory(undefined)}
          now={now}
        />
      )}

      <BillsTable
        key={`${year}-${monthIndex}-${category ?? ""}`}
        expenses={billsExpenses}
        monthLabel={monthLabel}
        category={category}
        onCategoryChange={selectCategory}
        now={now}
      />
    </Stack>
  );
}
