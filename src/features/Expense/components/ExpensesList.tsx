"use client";

import React from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Badge,
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  Skeleton,
  SkeletonCircle,
  Table,
  Text,
} from "@chakra-ui/react";
import CreateOrEditExpenseDialog from "../modals/CreateOrEditExpense";
import RemoveExpenseDialog from "../modals/RemoveExpense";
import type { Id } from "../../../../convex/_generated/dataModel";
import DuplicateExpenseDialog from "../modals/DuplicateExpense";
import useIntersectionObserver from "@/shared/hooks/useIntersectionObserver";
import ManageExpenseFiles from "../modals/ManageExpenseFiles";
import { IconCalendarMinus, IconCalendarPlus } from "@tabler/icons-react";

export default function ExpensesList() {
  const [search, setSearch] = React.useState<string>("");
  const [date, setDate] = React.useState<string | undefined>(
    new Date().toISOString().split("T")[0],
  );
  const [perPage] = React.useState<number>(15);

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

  // Calculate totals based on filtered results
  const total: number = results
    ?.filter(
      (expense) =>
        expense.name.toLowerCase().includes(search) ||
        expense.description?.toLowerCase()?.includes(search) ||
        expense.category?.toLowerCase()?.includes(search),
    )
    ?.reduce((acc, expense) => acc + (expense.amount || 0), 0);
  // Calculate paid and unpaid totals based on filtered results
  const paidTotal: number = results
    ?.filter(
      (expense) =>
        expense.paidAt &&
        (expense.name.toLowerCase().includes(search) ||
          expense.description?.toLowerCase()?.includes(search) ||
          expense.category?.toLowerCase()?.includes(search)),
    )
    ?.reduce((acc, expense) => acc + (expense.amount || 0), 0);
  // Calculate paid and unpaid totals based on filtered results
  const unpaidTotal: number = results
    ?.filter(
      (expense) =>
        !expense.paidAt &&
        (expense.name.toLowerCase().includes(search) ||
          expense.description?.toLowerCase()?.includes(search) ||
          expense.category?.toLowerCase()?.includes(search)),
    )
    ?.reduce((acc, expense) => acc + (expense.amount || 0), 0);

  React.useEffect(() => {
    if (entry?.isIntersecting && status === "CanLoadMore") {
      loadMore(perPage);
    }
  }, [entry?.isIntersecting, status, loadMore, perPage]);

  return (
    <>
      <HStack mb={4} justifyContent="flex-end" alignItems="center">
        <HStack>
          <Input
            variant="outline"
            placeholder="Search expenses..."
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value.toLowerCase())
            }
          />
          <Box mx={4} w="1px" h={5} bg="gray.500" />
          <IconButton
            aria-label="Previous Month"
            title="Previous Month"
            variant="outline"
            onClick={handlePreviousMonth}
          >
            <IconCalendarMinus />
          </IconButton>
          <IconButton
            aria-label="Next Month"
            title="Next Month"
            variant="outline"
            onClick={handleNextMonth}
          >
            <IconCalendarPlus />
          </IconButton>
          <Input
            type="date"
            variant="outline"
            value={date || ""}
            onChange={(e) => setDate(e.target.value)}
          />
        </HStack>
        <Box mx={4} w="1px" h={5} bg="gray.500" />
        <CreateOrEditExpenseDialog />
      </HStack>
      <Table.Root size="sm" striped>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Description</Table.ColumnHeader>
            <Table.ColumnHeader>Amount</Table.ColumnHeader>
            <Table.ColumnHeader whiteSpace="nowrap">
              Date (Due date)
            </Table.ColumnHeader>
            <Table.ColumnHeader>Category</Table.ColumnHeader>
            <Table.ColumnHeader whiteSpace="nowrap">Paid At</Table.ColumnHeader>
            <Table.ColumnHeader whiteSpace="nowrap">
              Created At
            </Table.ColumnHeader>
            <Table.ColumnHeader w="1%">Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {results
            ?.filter(
              (expense) =>
                expense.name.toLowerCase().includes(search) ||
                expense.description?.toLowerCase()?.includes(search) ||
                expense.category?.toLowerCase()?.includes(search),
            )
            ?.map?.((expense) => (
              <Table.Row key={expense._id}>
                <Table.Cell fontSize="xs">{expense?.name ?? "-"}</Table.Cell>
                <Table.Cell fontSize="xs" color="fg.subtle">
                  {expense?.description ?? "-"}
                </Table.Cell>
                <Table.Cell fontSize="xs" color="fg.subtle">
                  {expense?.amount
                    ? expense.amount.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    : "-"}
                </Table.Cell>
                <Table.Cell
                  title={
                    new Date(expense.date) < new Date()
                      ? "This expense is overdue"
                      : "This expense is not overdue"
                  }
                  fontSize="xs"
                  color={
                    expense.paidAt
                      ? "fg.subtle"
                      : new Date(expense.date) < new Date()
                        ? "fg.error"
                        : "fg.subtle"
                  }
                  whiteSpace="nowrap"
                >
                  {new Date(expense.date).toLocaleString("pt-BR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </Table.Cell>
                <Table.Cell fontSize="xs" color="fg.subtle">
                  {expense?.category ?? "-"}
                </Table.Cell>
                <Table.Cell
                  fontSize="xs"
                  color={expense?.paidAt ? "fg.success" : "fg.subtle"}
                >
                  {expense?.paidAt
                    ? new Date(expense.paidAt).toLocaleString("pt-BR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "-"}
                </Table.Cell>
                <Table.Cell fontSize="xs" color="fg.subtle">
                  {expense?._creationTime
                    ? new Date(expense._creationTime).toLocaleString("pt-BR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "-"}
                </Table.Cell>
                <Table.Cell>
                  <HStack>
                    <DuplicateExpenseDialog expense={expense} />
                    <ManageExpenseFiles expense={expense} />
                    <CreateOrEditExpenseDialog expense={expense} />
                    <RemoveExpenseDialog expense={expense} />
                  </HStack>
                </Table.Cell>
              </Table.Row>
            ))}

          <Table.Row>
            <Table.Cell
              colSpan={8}
              fontSize="lg"
              fontWeight="bold"
              textAlign="left"
            >
              <HStack spaceX={8} align="baseline">
                <Text color="fg.accent" fontSize="md" fontWeight="bold">
                  Total:
                  <Text as="span" ml={2} color="fg.accent">
                    {total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Text>
                </Text>
                <Text color="fg.error" fontSize="xs" fontWeight="semibold">
                  Unpaid:
                  <Text as="span" ml={2} color="fg.error">
                    {unpaidTotal.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Text>
                </Text>
                <Text color="fg.success" fontSize="xs" fontWeight="semibold">
                  Paid:
                  <Text as="span" ml={2} color="fg.success">
                    {paidTotal.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </Text>
                </Text>
              </HStack>
            </Table.Cell>
          </Table.Row>

          {status === "LoadingFirstPage" ? (
            <>
              {Array.from({ length: 50 }).map((_, index) => (
                <Table.Row key={index}>
                  {Array.from({ length: 7 }).map((_, cellIndex) => (
                    <Table.Cell key={cellIndex}>
                      <Skeleton variant="shine" height="20px" />
                    </Table.Cell>
                  ))}
                  <Table.Cell>
                    <HStack gap={7}>
                      <SkeletonCircle size={6} />
                      <SkeletonCircle size={6} />
                      <SkeletonCircle size={6} />
                      <SkeletonCircle size={6} />
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </>
          ) : null}

          {status === "CanLoadMore" ? (
            <Table.Row>
              <Table.Cell colSpan={8}>
                <Button variant="surface" onClick={() => loadMore(perPage)}>
                  Load More
                </Button>
              </Table.Cell>
            </Table.Row>
          ) : null}

          {status === "LoadingMore" ? (
            <Table.Row>
              {Array.from({ length: 7 }).map((_, cellIndex) => (
                <Table.Cell key={cellIndex}>
                  <Skeleton variant="shine" height="20px" />
                </Table.Cell>
              ))}
              <Table.Cell>
                <HStack gap={7}>
                  <SkeletonCircle size={6} />
                  <SkeletonCircle size={6} />
                  <SkeletonCircle size={6} />
                  <SkeletonCircle size={6} />
                </HStack>
              </Table.Cell>
            </Table.Row>
          ) : null}

          {status === "Exhausted" ? (
            <Table.Row>
              <Table.Cell colSpan={8}>
                <Badge variant="outline" size="md">
                  No more expenses to load.
                </Badge>
              </Table.Cell>
            </Table.Row>
          ) : null}

          {results && results.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={8}>
                No expenses found. Please add a new expense.
              </Table.Cell>
            </Table.Row>
          ) : null}
        </Table.Body>
      </Table.Root>

      <div ref={ref} />
    </>
  );
}
