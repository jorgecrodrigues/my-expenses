"use client";

import React from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Badge, Button, Flex, Skeleton, Table } from "@chakra-ui/react";
import CreateOrEditExpenseDialog from "../modals/CreateOrEditExpense";
import RemoveExpenseDialog from "../modals/RemoveExpense";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function ExpensesList() {
  const [perPage] = React.useState<number>(15);

  const user = useQuery(api.users.viewer);

  const { results, status, loadMore } = usePaginatedQuery(
    api.expenses.getExpenses,
    { userId: user?._id as Id<"users">, orderBy: "by_date", order: "desc" },
    { initialNumItems: perPage }
  );

  return (
    <React.Fragment>
      <Flex justifyContent="space-between" alignItems="center" mb={4}>
        <h2>Expenses List</h2>
        <CreateOrEditExpenseDialog />
      </Flex>
      <Table.Root size="sm" striped>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Name</Table.ColumnHeader>
            <Table.ColumnHeader>Description</Table.ColumnHeader>
            <Table.ColumnHeader>Amount</Table.ColumnHeader>
            <Table.ColumnHeader>Category</Table.ColumnHeader>
            <Table.ColumnHeader>Date (Due date)</Table.ColumnHeader>
            <Table.ColumnHeader>Created At</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {results?.map?.((expense) => (
            <Table.Row key={expense._id}>
              <Table.Cell>{expense?.name ?? "-"}</Table.Cell>
              <Table.Cell>{expense?.description ?? "-"}</Table.Cell>
              <Table.Cell>
                {expense?.amount
                  ? expense.amount.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  : "-"}
              </Table.Cell>
              <Table.Cell>{expense?.category ?? "-"}</Table.Cell>
              <Table.Cell>
                {expense?.date
                  ? new Date(expense.date).toLocaleString("pt-BR", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })
                  : "-"}
              </Table.Cell>
              <Table.Cell>
                {expense?._creationTime
                  ? new Date(expense._creationTime).toLocaleString("pt-BR", {
                      dateStyle: "long",
                      timeStyle: "long",
                    })
                  : "-"}
              </Table.Cell>
              <Table.Cell>
                <Flex gap={2}>
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
                  {Array.from({ length: 9 }).map((_, cellIndex) => (
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
              <Table.Cell colSpan={9}>
                <Button variant="surface" onClick={() => loadMore(perPage)}>
                  Load More
                </Button>
              </Table.Cell>
            </Table.Row>
          ) : null}

          {status === "LoadingMore" ? (
            <Table.Row>
              {Array.from({ length: 10 }).map((_, cellIndex) => (
                <Table.Cell key={cellIndex}>
                  <Skeleton variant="shine" height="20px" />
                </Table.Cell>
              ))}
            </Table.Row>
          ) : null}

          {status === "Exhausted" ? (
            <Table.Row>
              <Table.Cell colSpan={9}>
                <Badge variant="outline" size="md">
                  No more expenses to load.
                </Badge>
              </Table.Cell>
            </Table.Row>
          ) : null}

          {results && results.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={9}>
                No expenses found. Please add a new expense.
              </Table.Cell>
            </Table.Row>
          ) : null}
        </Table.Body>
      </Table.Root>
    </React.Fragment>
  );
}
