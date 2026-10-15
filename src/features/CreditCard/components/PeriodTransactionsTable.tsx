import React from "react";
import { useQuery } from "convex/react";
import { Box, Button, Skeleton, Stack, Table, Text } from "@chakra-ui/react";
import { api } from "../../../../convex/_generated/api";
import {
  buildCategoryOptions,
  formatCents,
  formatDay,
  issuerLabel,
} from "../utils/creditCard";
import TransactionCategorySelect from "./TransactionCategorySelect";

const PER_PAGE = 50;
const COLUMNS = 5;

interface PeriodTransactionsTableProps {
  year: number;
  monthIndex?: number;
  category?: string;
  /** Describes the selection, e.g. "Mar 2026 · Food". */
  periodLabel: string;
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={4}
    >
      {children}
    </Box>
  );
}

export default function PeriodTransactionsTable({
  year,
  monthIndex,
  category,
  periodLabel,
}: PeriodTransactionsTableProps) {
  const hasSelection = monthIndex !== undefined || category !== undefined;
  const transactions = useQuery(
    api.creditCardStatements.listPeriodTransactions,
    hasSelection
      ? {
          year,
          month: monthIndex === undefined ? undefined : monthIndex + 1,
          category,
        }
      : "skip",
  );
  const customCategories = useQuery(
    api.creditCardStatements.listCustomCategories,
  );
  const categoryOptions = React.useMemo(
    () => buildCategoryOptions(customCategories ?? []),
    [customCategories],
  );
  const [visibleCount, setVisibleCount] = React.useState(PER_PAGE);

  const header = (
    <Stack gap={0.5} mb={4}>
      <Text fontSize="lg" fontWeight="bold">
        Transactions
      </Text>
      <Text fontSize="sm" color="fg.muted">
        {periodLabel}
        {transactions !== undefined &&
          ` · ${transactions.length} ${transactions.length === 1 ? "line" : "lines"}`}
      </Text>
    </Stack>
  );

  if (!hasSelection) {
    return (
      <Panel>
        {header}
        <Box py={8} textAlign="center" color="fg.muted">
          Click a month in the chart or a category to list its transactions.
        </Box>
      </Panel>
    );
  }

  const visible = transactions?.slice(0, visibleCount) ?? [];

  return (
    <Panel>
      {header}
      <Table.Root size="sm" striped>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeader>Date</Table.ColumnHeader>
            <Table.ColumnHeader>Description</Table.ColumnHeader>
            <Table.ColumnHeader>Card</Table.ColumnHeader>
            <Table.ColumnHeader>Category</Table.ColumnHeader>
            <Table.ColumnHeader textAlign="end">Amount</Table.ColumnHeader>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {visible.map((transaction) => (
            <Table.Row key={transaction._id}>
              <Table.Cell fontSize="xs" color="fg.subtle" whiteSpace="nowrap">
                {formatDay(transaction.date)}
              </Table.Cell>
              <Table.Cell fontSize="xs">
                <Text fontWeight="medium">
                  {transaction.merchant ?? transaction.description}
                </Text>
                {transaction.merchant && (
                  <Text color="fg.muted">{transaction.description}</Text>
                )}
                {transaction.installmentCurrent !== undefined && (
                  <Text color="fg.muted">
                    Installment {transaction.installmentCurrent}/
                    {transaction.installmentTotal}
                  </Text>
                )}
              </Table.Cell>
              <Table.Cell fontSize="xs">{issuerLabel(transaction.issuer)}</Table.Cell>
              <Table.Cell fontSize="xs">
                <TransactionCategorySelect
                  transactionId={transaction._id}
                  category={transaction.category}
                  description={transaction.merchant ?? transaction.description}
                  options={categoryOptions}
                />
              </Table.Cell>
              <Table.Cell
                fontSize="xs"
                textAlign="end"
                whiteSpace="nowrap"
                color={transaction.amountCents < 0 ? "fg.success" : undefined}
              >
                {formatCents(transaction.amountCents)}
              </Table.Cell>
            </Table.Row>
          ))}

          {transactions === undefined &&
            Array.from({ length: 3 }).map((_, index) => (
              <Table.Row key={`skeleton-${index}`}>
                {Array.from({ length: COLUMNS }).map((_, cellIndex) => (
                  <Table.Cell key={cellIndex}>
                    <Skeleton variant="shine" height="20px" />
                  </Table.Cell>
                ))}
              </Table.Row>
            ))}

          {transactions?.length === 0 && (
            <Table.Row>
              <Table.Cell colSpan={COLUMNS} textAlign="center" color="fg.muted" py={6}>
                No transactions in this period.
              </Table.Cell>
            </Table.Row>
          )}

          {transactions !== undefined && transactions.length > visibleCount && (
            <Table.Row>
              <Table.Cell colSpan={COLUMNS}>
                <Button
                  variant="surface"
                  onClick={() => setVisibleCount((count) => count + PER_PAGE)}
                >
                  Show more ({transactions.length - visibleCount} left)
                </Button>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>
    </Panel>
  );
}
