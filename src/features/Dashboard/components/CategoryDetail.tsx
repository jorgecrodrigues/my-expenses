import React from "react";
import {
  Box,
  Button,
  Checkbox,
  CloseButton,
  HStack,
  Input,
  Progress,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Wrap,
} from "@chakra-ui/react";
import { formatBRL } from "@/shared/utils/currency";
import { generateColorByString } from "@/shared/utils/color";
import {
  getMonthlyAmountsByKey,
  groupBy,
  summarizeExpenses,
  type Expense,
  type GroupTotals,
} from "@/features/Dashboard/utils/dashboardMetrics";
import MonthlyStackedBarChart from "./MonthlyStackedBarChart";

const SEARCH_THRESHOLD = 8;

interface CategoryDetailProps {
  category: string;
  year: number;
  /** Expenses of `category` in `year` (undefined while loading). */
  expenses?: Expense[];
  selectedMonthIndex: number;
  onSelectMonth: (monthIndex: number) => void;
  onClose: () => void;
  now: Date;
}

function BillCard({ bill, hidden }: { bill: GroupTotals; hidden: boolean }) {
  const open = bill.pending + bill.overdue;
  const paidPercent =
    bill.total > 0 ? Math.round((bill.paid / bill.total) * 100) : 0;

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderLeftWidth="3px"
      borderLeftColor={generateColorByString(bill.key)}
      borderRadius="md"
      px={2.5}
      py={2}
      bg="bg.panel"
      opacity={hidden ? 0.5 : 1}
    >
      <HStack justify="space-between" gap={2}>
        <Text fontSize="sm" fontWeight="medium" truncate title={bill.key}>
          {bill.key}
        </Text>
        <Text fontSize="sm" fontWeight="semibold" flexShrink={0}>
          {formatBRL(bill.total)}
        </Text>
      </HStack>

      <HStack justify="space-between" gap={2} fontSize="xs" color="fg.muted">
        <Text>
          {bill.count} {bill.count === 1 ? "bill" : "bills"}
          {bill.overdueCount > 0 && (
            <>
              {" · "}
              <Text as="span" color="fg.error">
                {bill.overdueCount} overdue
              </Text>
            </>
          )}
        </Text>
        <Text flexShrink={0}>{paidPercent}%</Text>
      </HStack>

      <Progress.Root
        value={paidPercent}
        size="xs"
        my={1.5}
        colorPalette="green"
        aria-label={`${paidPercent}% paid`}
      >
        <Progress.Track borderRadius="full">
          <Progress.Range borderRadius="full" />
        </Progress.Track>
      </Progress.Root>

      <HStack justify="space-between" gap={2} fontSize="xs">
        <Text color="fg.success" truncate>
          Paid {formatBRL(bill.paid)}
        </Text>
        <Text color="fg.warning" flexShrink={0}>
          Left {formatBRL(open)}
        </Text>
      </HStack>
    </Box>
  );
}

export default function CategoryDetail({
  category,
  year,
  expenses,
  selectedMonthIndex,
  onSelectMonth,
  onClose,
  now,
}: CategoryDetailProps) {
  const [hiddenNames, setHiddenNames] = React.useState<Set<string>>(new Set());
  const [search, setSearch] = React.useState("");

  const bills = React.useMemo(
    () => (expenses ? groupBy(expenses, (expense) => expense.name, now) : []),
    [expenses, now],
  );

  const totals = React.useMemo(
    () => summarizeExpenses(expenses ?? [], now),
    [expenses, now],
  );

  const chartData = React.useMemo(() => {
    const visible = bills.filter((bill) => !hiddenNames.has(bill.key));
    const keyByName = new Map(
      visible.map((bill, index) => [bill.key, `k${index}`]),
    );
    return {
      series: visible.map((bill, index) => ({
        id: `k${index}`,
        label: bill.key,
        color: generateColorByString(bill.key),
      })),
      data: getMonthlyAmountsByKey(
        (expenses ?? []).filter((expense) => keyByName.has(expense.name)),
        year,
        (expense) => keyByName.get(expense.name) ?? "",
      ),
    };
  }, [bills, expenses, hiddenNames, year]);

  const filteredBills = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? bills.filter((bill) => bill.key.toLowerCase().includes(term))
      : bills;
  }, [bills, search]);

  const toggleName = (name: string, visible: boolean) =>
    setHiddenNames((prev) => {
      const next = new Set(prev);
      if (visible) next.delete(name);
      else next.add(name);
      return next;
    });

  const showAll = () => setHiddenNames(new Set());
  const hideAll = () => setHiddenNames(new Set(bills.map((bill) => bill.key)));

  const open = totals.pending + totals.overdue;
  const paidPercent =
    totals.total > 0 ? Math.round((totals.paid / totals.total) * 100) : 0;

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={4}
      minW={0}
    >
      <HStack justify="space-between" align="flex-start" gap={3} mb={4}>
        <Stack gap={0.5}>
          <Text fontSize="lg" fontWeight="bold">
            {category} · {year}
          </Text>
          <Text fontSize="sm" color="fg.muted">
            Breakdown of the year by bill
          </Text>
        </Stack>
        <CloseButton
          size="sm"
          aria-label="Close category detail"
          onClick={onClose}
        />
      </HStack>

      {expenses === undefined ? (
        <Stack gap={4}>
          <Skeleton height="40px" variant="shine" />
          <Skeleton height="280px" variant="shine" />
        </Stack>
      ) : (
        <Stack gap={5}>
          <Stack gap={2}>
            <HStack gap={6} wrap="wrap">
              <Text fontSize="sm">
                Total <b>{formatBRL(totals.total)}</b>
              </Text>
              <Text fontSize="sm" color="fg.success">
                Paid <b>{formatBRL(totals.paid)}</b>
              </Text>
              <Text fontSize="sm" color="fg.warning">
                Left to pay <b>{formatBRL(open)}</b>
              </Text>
              {totals.overdue > 0 && (
                <Text fontSize="sm" color="fg.error">
                  Overdue <b>{formatBRL(totals.overdue)}</b>
                </Text>
              )}
            </HStack>
            <Progress.Root
              value={paidPercent}
              size="sm"
              colorPalette="green"
              aria-label="Paid percentage"
            >
              <HStack gap={2}>
                <Progress.Track flex={1} borderRadius="full">
                  <Progress.Range borderRadius="full" />
                </Progress.Track>
                <Progress.ValueText fontSize="xs">
                  {paidPercent}% paid
                </Progress.ValueText>
              </HStack>
            </Progress.Root>
          </Stack>

          {bills.length > 0 && (
            <Stack gap={2}>
              <HStack justify="space-between" wrap="wrap" gap={2}>
                <Text fontSize="sm" fontWeight="semibold">
                  Bills shown in the chart ({bills.length - hiddenNames.size}/
                  {bills.length})
                </Text>
                <HStack gap={2}>
                  {bills.length > SEARCH_THRESHOLD && (
                    <Input
                      size="xs"
                      w="12rem"
                      placeholder="Filter bills..."
                      aria-label="Filter bills"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  )}
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={showAll}
                    disabled={hiddenNames.size === 0}
                  >
                    Select all
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={hideAll}
                    disabled={hiddenNames.size === bills.length}
                  >
                    Clear
                  </Button>
                </HStack>
              </HStack>
              <Wrap gap={2}>
                {filteredBills.map((bill) => {
                  const color = generateColorByString(bill.key);
                  const visible = !hiddenNames.has(bill.key);
                  return (
                    <Checkbox.Root
                      key={bill.key}
                      size="sm"
                      checked={visible}
                      onCheckedChange={(details) =>
                        toggleName(bill.key, details.checked === true)
                      }
                      borderWidth="1px"
                      borderColor={visible ? color : "border.subtle"}
                      borderRadius="full"
                      px={2.5}
                      py={1}
                      cursor="pointer"
                      opacity={visible ? 1 : 0.6}
                    >
                      <Checkbox.HiddenInput />
                      <Checkbox.Control
                        borderColor={color}
                        bg={visible ? color : undefined}
                        color={visible ? "white" : undefined}
                      />
                      <Checkbox.Label
                        fontSize="xs"
                        maxW="14rem"
                        truncate
                        title={bill.key}
                      >
                        {bill.key}
                      </Checkbox.Label>
                      <Text fontSize="xs" color="fg.muted">
                        {formatBRL(bill.total, true)}
                      </Text>
                    </Checkbox.Root>
                  );
                })}
              </Wrap>
            </Stack>
          )}

          {bills.length === 0 ? (
            <Box py={12} textAlign="center" color="fg.muted">
              No expenses in {category} for {year}.
            </Box>
          ) : chartData.series.length === 0 ? (
            <Box py={12} textAlign="center" color="fg.muted">
              Select at least one bill to see the chart.
            </Box>
          ) : (
            <MonthlyStackedBarChart
              data={chartData.data}
              series={chartData.series}
              selectedMonthIndex={selectedMonthIndex}
              onSelectMonth={onSelectMonth}
              showLegend={false}
              height={280}
            />
          )}

          {bills.length > 0 && (
            <SimpleGrid minChildWidth="200px" gap={2}>
              {bills.map((bill) => (
                <BillCard
                  key={bill.key}
                  bill={bill}
                  hidden={hiddenNames.has(bill.key)}
                />
              ))}
            </SimpleGrid>
          )}
        </Stack>
      )}
    </Box>
  );
}
