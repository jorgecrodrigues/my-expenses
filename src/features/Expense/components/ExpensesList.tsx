"use client";

import React from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Badge,
  Button,
  HStack,
  Input,
  Skeleton,
  SkeletonCircle,
  Table,
} from "@chakra-ui/react";
import CreateOrEditExpenseDialog from "../modals/CreateOrEditExpense";
import RemoveExpenseDialog from "../modals/RemoveExpense";
import type { Id } from "../../../../convex/_generated/dataModel";
import DuplicateExpenseDialog from "../modals/DuplicateExpense";
import useIntersectionObserver from "@/shared/hooks/useIntersectionObserver";
import ManageExpenseFiles from "../modals/ManageExpenseFiles";

export default function ExpensesList() {
  const [search, setSearch] = React.useState<string>("");
  const [date, setDate] = React.useState<string | undefined>();
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
      date: date,
    },
    { initialNumItems: perPage }
  );

  React.useEffect(() => {
    if (entry?.isIntersecting && status === "CanLoadMore") {
      loadMore(perPage);
    }
  }, [entry?.isIntersecting, status, loadMore, perPage]);

  return (
    <>
      <HStack mb={4} justifyContent="flex-end" alignItems="center" gap={8}>
        <HStack>
          <Input
            variant="outline"
            placeholder="Search expenses..."
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input
            type="date"
            variant="outline"
            value={date || ""}
            onChange={(e) => setDate(e.target.value)}
          />
        </HStack>
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
              <Table.Cell fontSize="xs" color="gray.100" whiteSpace="nowrap">
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
              <Table.Cell
                fontSize="xs"
                color={expense?.paidAt ? "green.400" : "gray.400"}
              >
                {expense?.paidAt
                  ? new Date(expense.paidAt).toLocaleString("pt-BR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "-"}
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
                <HStack>
                  <DuplicateExpenseDialog expense={expense} />
                  <ManageExpenseFiles expense={expense} />
                  <CreateOrEditExpenseDialog expense={expense} />
                  <RemoveExpenseDialog expense={expense} />
                </HStack>
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
                  <Table.Cell>
                    <HStack gap={4}>
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
    </>
  );
}
