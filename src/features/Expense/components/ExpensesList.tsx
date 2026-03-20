"use client";

import React from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Skeleton,
  SkeletonCircle,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  expenseTableRowStaggerEnter,
  expensesShellEnter,
} from "@/shared/animation/chakraMotion";
import useIntersectionObserver from "@/shared/hooks/useIntersectionObserver";
import { api } from "../../../../convex/_generated/api";
import CreateOrEditExpenseDialog from "../modals/CreateOrEditExpense";
import RemoveExpenseDialog from "../modals/RemoveExpense";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import DuplicateExpenseDialog from "../modals/DuplicateExpense";
import ManageExpenseFiles from "../modals/ManageExpenseFiles";
import {
  IconArrowDown,
  IconCalendarMinus,
  IconCalendarPlus,
} from "@tabler/icons-react";

const COL_SPAN = 8;
const SKELETON_INITIAL_ROWS = 10;

type ExpenseSortField =
  | "name"
  | "description"
  | "amount"
  | "category"
  | "_creationTime";

function matchesSearch(expense: Doc<"expenses">, q: string) {
  return (
    expense.name.toLowerCase().includes(q) ||
    expense.description?.toLowerCase()?.includes(q) ||
    expense.category?.toLowerCase()?.includes(q)
  );
}

function ExpenseSortHeader(props: {
  label: string;
  field: ExpenseSortField;
  defaultOrder?: "asc" | "desc";
  sortBy: ExpenseSortField | undefined;
  sortOrder: "asc" | "desc";
  onSort: (field: ExpenseSortField, defaultOrder: "asc" | "desc") => void;
}) {
  const {
    label,
    field,
    defaultOrder = "asc",
    sortBy,
    sortOrder,
    onSort,
  } = props;
  const active = sortBy === field;
  return (
    <Table.ColumnHeader
      px={3}
      py={3}
      bg="bg.muted"
      borderBottomWidth="1px"
    >
      <Button
        aria-label={`Sort by ${label}`}
        variant={active ? "subtle" : "ghost"}
        colorPalette={active ? "teal" : "gray"}
        size="2xs"
        fontWeight="semibold"
        letterSpacing="wider"
        textTransform="uppercase"
        fontSize="10px"
        h="auto"
        minH={0}
        py={1}
        px={2}
        onClick={() => onSort(field, defaultOrder)}
      >
        <HStack gap={1}>
          <span>{label}</span>
          <IconArrowDown
            size={14}
            style={{
              transform: sortOrder === "asc" ? "rotate(180deg)" : "none",
              display: active ? "inline" : "none",
            }}
          />
        </HStack>
      </Button>
    </Table.ColumnHeader>
  );
}

function StaticTableHead(props: { children: React.ReactNode; nowrap?: boolean }) {
  return (
    <Table.ColumnHeader
      px={3}
      py={3}
      bg="bg.muted"
      borderBottomWidth="1px"
      fontSize="10px"
      fontWeight="semibold"
      letterSpacing="wider"
      textTransform="uppercase"
      color="fg.muted"
      whiteSpace={props.nowrap ? "nowrap" : undefined}
    >
      {props.children}
    </Table.ColumnHeader>
  );
}

export default function ExpensesList() {
  const [search, setSearch] = React.useState<string>("");
  const [date, setDate] = React.useState<string | undefined>(
    new Date().toISOString().split("T")[0],
  );
  const [perPage] = React.useState<number>(15);
  const [sortBy, setSortBy] = React.useState<ExpenseSortField | undefined>(
    undefined,
  );
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const { ref, entry } = useIntersectionObserver({
    threshold: 1.0,
    rootMargin: "0px",
  });

  const user = useQuery(api.users.viewer);

  const { results, status, loadMore } = usePaginatedQuery(
    api.expenses.getExpenses,
    {
      userId: user?._id as Id<"users">,
      orderBy: "by_date",
      order: "desc",
      date: date,
    },
    { initialNumItems: perPage },
  );

  const handlePreviousMonth = () => {
    const prevMonth = new Date(date || new Date().toISOString().split("T")[0]);
    prevMonth.setDate(1);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setDate(prevMonth.toISOString().split("T")[0]);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(date || new Date().toISOString().split("T")[0]);
    nextMonth.setDate(1);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setDate(nextMonth.toISOString().split("T")[0]);
  };

  const handleSortBy = React.useCallback(
    (a: Doc<"expenses">, b: Doc<"expenses">) => {
      if (!sortBy) return 0;

      const fieldA = a?.[sortBy] ?? a._creationTime;
      const fieldB = b?.[sortBy] ?? b._creationTime;

      if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;

      return 0;
    },
    [sortBy, sortOrder],
  );

  const filteredExpenses = React.useMemo(() => {
    if (!results) return [];
    return results.filter((e) => matchesSearch(e, search)).sort(handleSortBy);
  }, [results, search, handleSortBy]);

  const total = filteredExpenses.reduce(
    (acc, expense) => acc + (expense.amount || 0),
    0,
  );
  const paidTotal = filteredExpenses
    .filter((e) => e.paidAt)
    .reduce((acc, expense) => acc + (expense.amount || 0), 0);
  const unpaidTotal = filteredExpenses
    .filter((e) => !e.paidAt)
    .reduce((acc, expense) => acc + (expense.amount || 0), 0);

  const onSortBy = (
    field: ExpenseSortField,
    order: "asc" | "desc" = "asc",
  ) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder(order);
    }
  };

  React.useEffect(() => {
    if (entry?.isIntersecting && status === "CanLoadMore") {
      loadMore(perPage);
    }
  }, [entry?.isIntersecting, status, loadMore, perPage]);

  const showTotals =
    results &&
    results.length > 0 &&
    status !== "LoadingFirstPage" &&
    filteredExpenses.length > 0;

  return (
    <Box {...expensesShellEnter({ durationMs: 420 })}>
      <VStack gap={5} align="stretch">
        <Flex
          flexWrap="wrap"
          gap={3}
          align={{ base: "stretch", md: "center" }}
          justify="space-between"
          p={{ base: 3, md: 4 }}
          borderWidth="1px"
          borderRadius="xl"
          bg="bg.subtle"
          boxShadow="sm"
        >
          <Input
            flex={{ base: "1 1 100%", md: "1 1 220px" }}
            maxW={{ md: "280px" }}
            variant="outline"
            placeholder="Search expenses…"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value.toLowerCase())
            }
          />
          <HStack flexWrap="wrap" gap={2} justify={{ base: "flex-start", md: "flex-end" }}>
            <IconButton
              aria-label="Previous month"
              title="Previous month"
              variant="outline"
              size="sm"
              onClick={handlePreviousMonth}
            >
              <IconCalendarMinus size={18} />
            </IconButton>
            <Input
              type="date"
              variant="outline"
              size="sm"
              maxW="160px"
              value={date || ""}
              onChange={(e) => setDate(e.target.value)}
            />
            <IconButton
              aria-label="Next month"
              title="Next month"
              variant="outline"
              size="sm"
              onClick={handleNextMonth}
            >
              <IconCalendarPlus size={18} />
            </IconButton>
            <CreateOrEditExpenseDialog />
          </HStack>
        </Flex>

        <Box
          borderWidth="1px"
          borderRadius="xl"
          overflow="hidden"
          bg="bg.subtle"
          boxShadow="sm"
        >
          <Table.ScrollArea>
            <Table.Root size="sm" variant="line" interactive stickyHeader>
              <Table.Header>
                <Table.Row>
                  <ExpenseSortHeader
                    label="Name"
                    field="name"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSortBy}
                  />
                  <ExpenseSortHeader
                    label="Description"
                    field="description"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSortBy}
                  />
                  <ExpenseSortHeader
                    label="Amount"
                    field="amount"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSortBy}
                  />
                  <StaticTableHead nowrap>Due date</StaticTableHead>
                  <ExpenseSortHeader
                    label="Category"
                    field="category"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSortBy}
                  />
                  <StaticTableHead nowrap>Payment</StaticTableHead>
                  <ExpenseSortHeader
                    label="Created"
                    field="_creationTime"
                    defaultOrder="desc"
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={onSortBy}
                  />
                  <Table.ColumnHeader
                    w="1%"
                    px={3}
                    py={3}
                    bg="bg.muted"
                    borderBottomWidth="1px"
                    fontSize="10px"
                    fontWeight="semibold"
                    letterSpacing="wider"
                    textTransform="uppercase"
                    color="fg.muted"
                    textAlign="end"
                  >
                    Actions
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>

              <Table.Body>
                {status === "LoadingFirstPage"
                  ? Array.from({ length: SKELETON_INITIAL_ROWS }).map(
                      (_, index) => (
                        <Table.Row key={`sk-${index}`}>
                          {Array.from({ length: 7 }).map((_, cellIndex) => (
                            <Table.Cell key={cellIndex} py={3}>
                              <Skeleton variant="shine" height="18px" />
                            </Table.Cell>
                          ))}
                          <Table.Cell py={3}>
                            <HStack gap={2} justify="flex-end">
                              <SkeletonCircle size={7} />
                              <SkeletonCircle size={7} />
                              <SkeletonCircle size={7} />
                              <SkeletonCircle size={7} />
                            </HStack>
                          </Table.Cell>
                        </Table.Row>
                      ),
                    )
                  : null}

                {!results || status === "LoadingFirstPage"
                  ? null
                  : filteredExpenses.map((expense, i) => {
                      const overdue =
                        !expense.paidAt &&
                        new Date(expense.date) < new Date();
                      return (
                        <Table.Row
                          key={expense._id}
                          {...expenseTableRowStaggerEnter(i)}
                          transition="background-color 0.16s ease"
                        >
                          <Table.Cell
                            fontSize="sm"
                            fontWeight="medium"
                            borderLeftWidth={overdue ? "3px" : undefined}
                            borderLeftColor={overdue ? "fg.error" : undefined}
                            py={3}
                          >
                            {expense?.name ?? "—"}
                          </Table.Cell>
                          <Table.Cell
                            fontSize="sm"
                            color="fg.muted"
                            maxW="220px"
                            lineClamp={2}
                            py={3}
                          >
                            {expense?.description ?? "—"}
                          </Table.Cell>
                          <Table.Cell
                            fontSize="sm"
                            fontVariantNumeric="tabular-nums"
                            textAlign="right"
                            fontWeight="medium"
                            py={3}
                          >
                            {expense?.amount
                              ? expense.amount.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })
                              : "—"}
                          </Table.Cell>
                          <Table.Cell
                            title={
                              overdue
                                ? "Overdue"
                                : "Not overdue"
                            }
                            fontSize="sm"
                            color={
                              expense.paidAt
                                ? "fg.muted"
                                : overdue
                                  ? "fg.error"
                                  : "fg.muted"
                            }
                            whiteSpace="nowrap"
                            py={3}
                          >
                            {new Date(expense.date).toLocaleString("pt-BR", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </Table.Cell>
                          <Table.Cell fontSize="sm" color="fg.muted" py={3}>
                            {expense?.category ?? "—"}
                          </Table.Cell>
                          <Table.Cell py={3}>
                            <VStack align="start" gap={1}>
                              <Badge
                                size="sm"
                                variant="subtle"
                                colorPalette={
                                  expense.paidAt ? "green" : "gray"
                                }
                              >
                                {expense.paidAt ? "Paid" : "Open"}
                              </Badge>
                              {expense.paidAt ? (
                                <Text fontSize="xs" color="fg.muted">
                                  {new Date(expense.paidAt).toLocaleString(
                                    "pt-BR",
                                    {
                                      dateStyle: "medium",
                                      timeStyle: "short",
                                    },
                                  )}
                                </Text>
                              ) : null}
                            </VStack>
                          </Table.Cell>
                          <Table.Cell
                            fontSize="xs"
                            color="fg.muted"
                            whiteSpace="nowrap"
                            py={3}
                          >
                            {expense?._creationTime
                              ? new Date(
                                  expense._creationTime,
                                ).toLocaleString("pt-BR", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "—"}
                          </Table.Cell>
                          <Table.Cell py={3}>
                            <HStack gap={1} justify="flex-end" flexWrap="wrap">
                              <DuplicateExpenseDialog expense={expense} />
                              <ManageExpenseFiles expense={expense} />
                              <CreateOrEditExpenseDialog expense={expense} />
                              <RemoveExpenseDialog expense={expense} />
                            </HStack>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}

                {results && results.length === 0 && status !== "LoadingFirstPage" ? (
                  <Table.Row>
                    <Table.Cell colSpan={COL_SPAN} py={14} textAlign="center">
                      <Text color="fg.muted">
                        No expenses for this month. Add one to get started.
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                ) : null}

                {results &&
                results.length > 0 &&
                filteredExpenses.length === 0 &&
                status !== "LoadingFirstPage" ? (
                  <Table.Row>
                    <Table.Cell colSpan={COL_SPAN} py={14} textAlign="center">
                      <Text color="fg.muted">
                        No expenses match your search.
                      </Text>
                    </Table.Cell>
                  </Table.Row>
                ) : null}

                {status === "LoadingMore" ? (
                  <Table.Row>
                    {Array.from({ length: 7 }).map((_, cellIndex) => (
                      <Table.Cell key={cellIndex} py={3}>
                        <Skeleton variant="shine" height="18px" />
                      </Table.Cell>
                    ))}
                    <Table.Cell py={3}>
                      <HStack gap={2} justify="flex-end">
                        <SkeletonCircle size={7} />
                        <SkeletonCircle size={7} />
                        <SkeletonCircle size={7} />
                        <SkeletonCircle size={7} />
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ) : null}
              </Table.Body>

              {showTotals ? (
                <Table.Footer>
                  <Table.Row bg="bg.muted">
                    <Table.Cell colSpan={COL_SPAN} py={4} px={4}>
                      <Flex
                        flexWrap="wrap"
                        gap={{ base: 3, md: 8 }}
                        align="baseline"
                      >
                        <Text fontSize="md" fontWeight="bold" color="fg">
                          Total
                          <Text as="span" ml={2} fontWeight="semibold">
                            {total.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </Text>
                        </Text>
                        <Text fontSize="sm" fontWeight="semibold" color="fg.error">
                          Unpaid
                          <Text as="span" ml={2} fontWeight="medium">
                            {unpaidTotal.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </Text>
                        </Text>
                        <Text fontSize="sm" fontWeight="semibold" color="fg.success">
                          Paid
                          <Text as="span" ml={2} fontWeight="medium">
                            {paidTotal.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </Text>
                        </Text>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                </Table.Footer>
              ) : null}
            </Table.Root>
          </Table.ScrollArea>
        </Box>

        <VStack gap={3} align="stretch">
          {status === "CanLoadMore" ? (
            <Button
              variant="outline"
              alignSelf="center"
              size="sm"
              onClick={() => loadMore(perPage)}
            >
              Load more
            </Button>
          ) : null}

          {status === "Exhausted" && results && results.length > 0 ? (
            <Text fontSize="sm" color="fg.muted" textAlign="center">
              All expenses loaded for this view.
            </Text>
          ) : null}
        </VStack>

        <div ref={ref} />
      </VStack>
    </Box>
  );
}
