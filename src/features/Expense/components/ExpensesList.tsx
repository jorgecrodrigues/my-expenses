"use client";

import React from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Badge,
  Button,
  Flex,
  HStack,
  IconButton,
  Input,
  Skeleton,
  Table,
} from "@chakra-ui/react";
import CreateOrEditExpenseDialog from "../modals/CreateOrEditExpense";
import RemoveExpenseDialog from "../modals/RemoveExpense";
import type { Id } from "../../../../convex/_generated/dataModel";
import DuplicateExpenseDialog from "../modals/DuplicateExpense";
import useIntersectionObserver from "@/shared/hooks/useIntersectionObserver";
import { IconCalendarMinus, IconCalendarPlus } from "@tabler/icons-react";

export default function ExpensesList() {
  const [search, setSearch] = React.useState<string>("");
  const [date, setDate] = React.useState<Date | undefined>();
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
      search,
      date: date ? date.toISOString() : undefined,
    },
    { initialNumItems: perPage }
  );

  const handlePreviousMonth = () => {
    const d = date ? new Date(date) : new Date();
    setDate(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const d = date ? new Date(date) : new Date();
    setDate(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  React.useEffect(() => {
    if (entry?.isIntersecting && status === "CanLoadMore") {
      loadMore(perPage);
    }
  }, [entry, status, loadMore, perPage]);

  return (
    <React.Fragment>
      <h2>Expenses List</h2>
      <HStack mb={4} justifyContent="flex-end" alignItems="center" gap={8}>
        <HStack as="form">
          <Input
            size="sm"
            rounded="lg"
            placeholder="Search expenses..."
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input
            type="date"
            size="sm"
            rounded="lg"
            value={
              date
                ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
                    2,
                    "0"
                  )}-${String(date.getDate()).padStart(2, "0")}`
                : ""
            }
            onChange={(e) => {
              const value = e.target.value;
              if (!value) {
                setDate(undefined);
                return;
              }
              const [yearStr, monthStr, dayStr] = value.split("-");
              const year = Number(yearStr);
              const month = Number(monthStr);
              const day = Number(dayStr);
              setDate(new Date(year, month - 1, day));
            }}
          />
          <IconButton
            aria-label="Go to Previous Month"
            title="Go to previous Month"
            variant="ghost"
            size="sm"
            onClick={handlePreviousMonth}
          >
            <IconCalendarMinus />
          </IconButton>
          <IconButton
            aria-label="Go to Next Month"
            title="Go to next Month"
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
          >
            <IconCalendarPlus />
          </IconButton>
        </HStack>
        <CreateOrEditExpenseDialog />
      </HStack>
      <Table.Root size="sm" striped>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Description</Table.ColumnHeader>
            <Table.ColumnHeader>Amount</Table.ColumnHeader>
            <Table.ColumnHeader>Date (Due date)</Table.ColumnHeader>
            <Table.ColumnHeader>Category</Table.ColumnHeader>
            <Table.ColumnHeader>Created At</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {results?.map?.((expense) => (
            <Table.Row key={expense._id}>
              <Table.Cell fontSize="xs">{expense?.name ?? "-"}</Table.Cell>
              <Table.Cell fontSize="xs" color="gray.500">
                {expense?.description ?? "-"}
              </Table.Cell>
              <Table.Cell fontSize="xs" color="gray.100">
                {expense?.amount
                  ? expense.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  : "-"}
              </Table.Cell>
              <Table.Cell fontSize="xs" color="gray.100">
                {expense?.date
                  ? new Date(expense.date).toLocaleString("pt-BR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "-"}
              </Table.Cell>
              <Table.Cell fontSize="xs" color="gray.500">
                {expense?.category ?? "-"}
              </Table.Cell>
              <Table.Cell fontSize="xs" color="gray.500">
                {expense?._creationTime
                  ? new Date(expense._creationTime).toLocaleString("pt-BR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "-"}
              </Table.Cell>
              <Table.Cell>
                <Flex gap={2}>
                  <DuplicateExpenseDialog expense={expense} />
                  <CreateOrEditExpenseDialog expense={expense} />
                  <RemoveExpenseDialog expense={expense} />
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}

          {status === "LoadingFirstPage" ? (
            <>
              {Array.from({ length: 50 }).map((_, index) => (
                <Table.Row key={index}>
                  {Array.from({ length: 7 }).map((_, cellIndex) => (
                    <Table.Cell key={cellIndex}>
                      <Skeleton variant="shine" height="20px" />
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
            </>
          ) : null}

          {status === "CanLoadMore" ? (
            <Table.Row>
              <Table.Cell colSpan={7}>
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
            </Table.Row>
          ) : null}

          {status === "Exhausted" ? (
            <Table.Row>
              <Table.Cell colSpan={7}>
                <Badge variant="outline" size="md">
                  No more expenses to load.
                </Badge>
              </Table.Cell>
            </Table.Row>
          ) : null}

          {results && results.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={7}>
                No expenses found. Please add a new expense.
              </Table.Cell>
            </Table.Row>
          ) : null}
        </Table.Body>
      </Table.Root>

      <div ref={ref} />
    </React.Fragment>
  );
}
