import React from "react";
import { useQuery } from "convex/react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import { api } from "../../../../convex/_generated/api";
import { buildCategoryOptions } from "../utils/creditCard";
import useIsOverflowing from "@/shared/hooks/useIsOverflowing";
import PeriodTransactionsDialog from "../modals/PeriodTransactionsDialog";
import PeriodTransactionsList from "./PeriodTransactionsList";

const PREVIEW_COUNT = 10;

interface PeriodTransactionsTableProps {
  year: number;
  monthIndex?: number;
  category?: string;
  /** Describes the selection, e.g. "Mar 2026 · Food". */
  periodLabel: string;
}

/**
 * On large screens the panel is taken out of the flow so the grid row gets its
 * height from the sibling card, and the lines that don't fit are clipped.
 */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <Box position="relative" h="full" minH={{ lg: "xs" }}>
      <Box
        position={{ lg: "absolute" }}
        inset={{ lg: 0 }}
        display="flex"
        flexDirection="column"
        borderWidth="1px"
        borderColor="border.subtle"
        borderRadius="xl"
        bg="bg.panel"
        p={4}
      >
        {children}
      </Box>
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
  const [bodyRef, isOverflowing] = useIsOverflowing<HTMLDivElement>();

  const header = (
    <Stack gap={0.5} mb={4} flexShrink={0}>
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

  return (
    <Panel>
      {header}
      <Box
        ref={bodyRef}
        flex="1"
        minH={0}
        overflow="hidden"
        maskImage={
          isOverflowing
            ? "linear-gradient(to bottom, black calc(100% - 3rem), transparent)"
            : undefined
        }
      >
        <PeriodTransactionsList
          transactions={transactions?.slice(0, PREVIEW_COUNT)}
          categoryOptions={categoryOptions}
        />
      </Box>
      {transactions !== undefined &&
        (transactions.length > PREVIEW_COUNT || isOverflowing) && (
          <HStack justify="center" pt={3} flexShrink={0}>
            <PeriodTransactionsDialog
              transactions={transactions}
              categoryOptions={categoryOptions}
              periodLabel={periodLabel}
            />
          </HStack>
        )}
    </Panel>
  );
}
