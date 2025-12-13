"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Badge, Flex, Skeleton, Table } from "@chakra-ui/react";
import CreateOrEditExpenseDialog from "../modals/CreateOrEditExpense";
import RemoveExpenseDialog from "../modals/RemoveExpense";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function ExpensesList() {
  const user = useQuery(api.users.viewer);

  const data = useQuery(api.expenses.getExpenses, {
    userId: user?._id as Id<"users">,
    orderBy: "by_date",
    order: "desc",
  });

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
            <Table.ColumnHeader>Type</Table.ColumnHeader>
            <Table.ColumnHeader>Category</Table.ColumnHeader>
            <Table.ColumnHeader>Date (Due date)</Table.ColumnHeader>
            <Table.ColumnHeader>Repeat</Table.ColumnHeader>
            <Table.ColumnHeader>Created At</Table.ColumnHeader>
            <Table.ColumnHeader>Actions</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data?.map?.((expense) => (
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
              <Table.Cell>{expense?.type ?? "-"}</Table.Cell>
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
                {expense?.repeat !== "none" ? (
                  <Badge variant="surface" size="md">
                    {expense.repeat}
                  </Badge>
                ) : (
                  "-"
                )}
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
          )) ?? (
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
          )}

          {data && data.length === 0 ? (
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
