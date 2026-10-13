import React from "react";
import {
  Button,
  Heading,
  HStack,
  parseDate,
  Stack,
  Text,
  type DatePickerValueChangeDetails,
} from "@chakra-ui/react";
import CustomMonthPicker from "@/shared/components/CustomMonthPicker";
import SummaryCards from "@/features/Dashboard/components/SummaryCards";
import {
  filterByMonth,
  getMonthLabel,
  getPreviousMonth,
  summarizeExpenses,
  type Expense,
} from "@/features/Dashboard/utils/dashboardMetrics";
import BillsTable from "../components/BillsTable";
import useExpenseMonth, { formatMonthParam } from "../hooks/useExpenseMonth";
import useMonthExpenses from "../hooks/useMonthExpenses";
import CreateOrEditExpenseDialog from "../modals/CreateOrEditExpense";
import DuplicateExpenseDialog from "../modals/DuplicateExpense";
import ManageExpenseFiles from "../modals/ManageExpenseFiles";
import RemoveExpenseDialog from "../modals/RemoveExpense";

const renderExpenseActions = (expense: Expense) => (
  <>
    <DuplicateExpenseDialog expense={expense} />
    <ManageExpenseFiles expense={expense} />
    <CreateOrEditExpenseDialog expense={expense} />
    <RemoveExpenseDialog expense={expense} />
  </>
);

export default function ExpensePage() {
  const { year, monthIndex, category, goToMonth, setCategory } =
    useExpenseMonth();
  const expenses = useMonthExpenses(year, monthIndex);
  const [now] = React.useState(() => new Date());

  const monthLabel = `${getMonthLabel(monthIndex)} ${year}`;
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() === monthIndex;

  const data = React.useMemo(() => {
    if (!expenses) return undefined;

    const previous = getPreviousMonth(year, monthIndex);
    const monthExpenses = filterByMonth(expenses, year, monthIndex);

    return {
      monthExpenses,
      currentTotals: summarizeExpenses(monthExpenses, now),
      previousTotals: summarizeExpenses(
        filterByMonth(expenses, previous.year, previous.monthIndex),
        now,
      ),
    };
  }, [expenses, monthIndex, now, year]);

  const billsExpenses = React.useMemo(
    () =>
      category
        ? data?.monthExpenses.filter((expense) => expense.category === category)
        : data?.monthExpenses,
    [category, data],
  );

  const handleDateChange = (details: DatePickerValueChangeDetails) => {
    const picked = details.value?.[0];
    goToMonth(picked?.year ?? year, (picked?.month ?? monthIndex + 1) - 1);
  };

  return (
    <Stack gap={6}>
      <HStack gap="md" justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={1}>
          <Heading>Expenses</Heading>
          <Text color="fg.muted">
            Manage and track your bills for {monthLabel}
          </Text>
        </Stack>
        <HStack gap={3} wrap="wrap">
          {!isCurrentMonth && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => goToMonth(now.getFullYear(), now.getMonth())}
            >
              This month
            </Button>
          )}
          <CustomMonthPicker
            value={[parseDate(`${formatMonthParam(year, monthIndex)}-01`)]}
            onPreviousMonth={() => goToMonth(year, monthIndex - 1)}
            onNextMonth={() => goToMonth(year, monthIndex + 1)}
            onValueChange={handleDateChange}
          />
          <CreateOrEditExpenseDialog />
        </HStack>
      </HStack>

      <SummaryCards
        current={data?.currentTotals}
        previous={data?.previousTotals}
      />

      <BillsTable
        key={`${year}-${monthIndex}-${category ?? ""}`}
        expenses={billsExpenses}
        monthLabel={monthLabel}
        category={category}
        onCategoryChange={setCategory}
        renderActions={renderExpenseActions}
        now={now}
      />
    </Stack>
  );
}
