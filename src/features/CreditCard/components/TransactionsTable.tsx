import React from "react";
import { usePaginatedQuery, useQuery } from "convex/react";
import {
  Badge,
  Box,
  Button,
  HStack,
  NativeSelect,
  Skeleton,
  Table,
  Text,
} from "@chakra-ui/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  buildCategoryOptions,
  categoryLabel,
  formatCents,
  formatDay,
} from "../utils/creditCard";
import TransactionCategorySelect from "./TransactionCategorySelect";

const PER_PAGE = 50;
const COLUMNS = 5;

const TYPE_LABELS: Record<Doc<"creditCardTransactions">["type"], string> = {
  purchase: "Purchase",
  refund: "Refund",
  fee: "Fee",
  iof: "IOF",
  interest: "Interest",
  payment: "Payment",
};

const ALL_CATEGORIES = "";

export default function TransactionsTable({
  statementId,
  categories,
}: {
  statementId: Id<"creditCardStatements">;
  /** Categories present in the statement, offered in the filter. */
  categories: string[];
}) {
  const [categoryFilter, setCategoryFilter] = React.useState(ALL_CATEGORIES);
  const { results, status, loadMore } = usePaginatedQuery(
    api.creditCardStatements.listTransactions,
    categoryFilter === ALL_CATEGORIES
      ? { statementId }
      : { statementId, category: categoryFilter },
    { initialNumItems: PER_PAGE },
  );
  const customCategories = useQuery(
    api.creditCardStatements.listCustomCategories,
  );
  const categoryOptions = React.useMemo(
    () => buildCategoryOptions(customCategories ?? []),
    [customCategories],
  );
  // Keeps the active filter selectable after its last line is recategorized.
  const filterOptions = React.useMemo(
    () =>
      [
        ...new Set(
          categoryFilter === ALL_CATEGORIES
            ? categories
            : [...categories, categoryFilter],
        ),
      ].sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b))),
    [categories, categoryFilter],
  );

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={4}
    >
      <HStack justify="space-between" gap={3} mb={4} wrap="wrap">
        <Text fontSize="lg" fontWeight="bold">
          Transactions
        </Text>
        <NativeSelect.Root size="sm" width="auto" minW="48">
          <NativeSelect.Field
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setCategoryFilter(e.target.value)
            }
          >
            <option value={ALL_CATEGORIES}>All categories</option>
            {filterOptions.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
      </HStack>
      <Table.ScrollArea>
        <Table.Root size="sm" striped>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Date</Table.ColumnHeader>
              <Table.ColumnHeader>Description</Table.ColumnHeader>
              <Table.ColumnHeader>Category</Table.ColumnHeader>
              <Table.ColumnHeader>Type</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Amount</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {results.map((transaction) => (
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
                  {transaction.originalCurrency &&
                    transaction.originalAmount !== undefined && (
                      <Text color="fg.muted">
                        {transaction.originalCurrency}{" "}
                        {transaction.originalAmount.toFixed(2)}
                      </Text>
                    )}
                </Table.Cell>
                <Table.Cell fontSize="xs">
                  <TransactionCategorySelect
                    transactionId={transaction._id}
                    category={transaction.category}
                    description={
                      transaction.merchant ?? transaction.description
                    }
                    options={categoryOptions}
                  />
                </Table.Cell>
                <Table.Cell fontSize="xs">
                  <Badge variant="outline" size="sm">
                    {TYPE_LABELS[transaction.type]}
                  </Badge>
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

            {status === "LoadingFirstPage" || status === "LoadingMore"
              ? Array.from({ length: 3 }).map((_, index) => (
                  <Table.Row key={`skeleton-${index}`}>
                    {Array.from({ length: COLUMNS }).map((_, cellIndex) => (
                      <Table.Cell key={cellIndex}>
                        <Skeleton variant="shine" height="20px" />
                      </Table.Cell>
                    ))}
                  </Table.Row>
                ))
              : null}

            {status === "Exhausted" && results.length === 0 ? (
              <Table.Row>
                <Table.Cell
                  colSpan={COLUMNS}
                  textAlign="center"
                  color="fg.muted"
                  py={6}
                >
                  No transactions in this category.
                </Table.Cell>
              </Table.Row>
            ) : null}

            {status === "CanLoadMore" ? (
              <Table.Row>
                <Table.Cell colSpan={COLUMNS}>
                  <Button variant="surface" onClick={() => loadMore(PER_PAGE)}>
                    Load More
                  </Button>
                </Table.Cell>
              </Table.Row>
            ) : null}
          </Table.Body>
        </Table.Root>
      </Table.ScrollArea>
    </Box>
  );
}
