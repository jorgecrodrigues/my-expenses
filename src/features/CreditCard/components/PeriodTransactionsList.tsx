import type React from "react";
import type { FunctionReturnType } from "convex/server";
import { Skeleton, Stack, Table, Text } from "@chakra-ui/react";
import { api } from "../../../../convex/_generated/api";
import {
  formatCents,
  formatDay,
  issuerLabel,
  type CategoryOption,
} from "../utils/creditCard";
import useIsMobile from "@/shared/hooks/useIsMobile";
import TransactionCard from "./TransactionCard";
import TransactionCategorySelect from "./TransactionCategorySelect";

export type PeriodTransaction = FunctionReturnType<
  typeof api.creditCardStatements.listPeriodTransactions
>[number];

const COLUMNS = 5;

interface PeriodTransactionsListProps {
  /** `undefined` while loading. */
  transactions: PeriodTransaction[] | undefined;
  categoryOptions: CategoryOption[];
  /** Rendered after the lines, e.g. a "show more" button. */
  footer?: React.ReactNode;
}

/** The lines of a period, as a table or as cards on phones. */
export default function PeriodTransactionsList({
  transactions,
  categoryOptions,
  footer,
}: PeriodTransactionsListProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Stack gap={3}>
        {transactions !== undefined && transactions.length > 0 && (
          <Stack as="ul" aria-label="Transactions" gap={0} listStyleType="none">
            {transactions.map((transaction) => (
              <TransactionCard
                key={transaction._id}
                transaction={transaction}
                categoryOptions={categoryOptions}
                tag={
                  <Text fontSize="xs" color="fg.muted">
                    {issuerLabel(transaction.issuer)}
                  </Text>
                }
              />
            ))}
          </Stack>
        )}
        {transactions === undefined &&
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="shine" height="56px" />
          ))}
        {transactions?.length === 0 && (
          <Text textAlign="center" color="fg.muted" py={6}>
            No transactions in this period.
          </Text>
        )}
        {footer}
      </Stack>
    );
  }

  return (
    <Table.ScrollArea>
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
          {transactions?.map((transaction) => (
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
              <Table.Cell fontSize="xs">
                {issuerLabel(transaction.issuer)}
              </Table.Cell>
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
              <Table.Cell
                colSpan={COLUMNS}
                textAlign="center"
                color="fg.muted"
                py={6}
              >
                No transactions in this period.
              </Table.Cell>
            </Table.Row>
          )}

          {footer && (
            <Table.Row>
              <Table.Cell colSpan={COLUMNS}>{footer}</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table.Root>
    </Table.ScrollArea>
  );
}
