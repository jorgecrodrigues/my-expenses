import type React from "react";
import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import type { Doc } from "../../../../convex/_generated/dataModel";
import {
  formatCents,
  formatDay,
  type CategoryOption,
} from "../utils/creditCard";
import TransactionCategorySelect from "./TransactionCategorySelect";

interface TransactionCardProps {
  transaction: Doc<"creditCardTransactions">;
  categoryOptions: CategoryOption[];
  /** Shown next to the date, e.g. the line type or the card issuer. */
  tag?: React.ReactNode;
}

/** A transaction laid out as a list item, used instead of a table row on phones. */
export default function TransactionCard({
  transaction,
  categoryOptions,
  tag,
}: TransactionCardProps) {
  const title = transaction.merchant ?? transaction.description;
  const details = [
    transaction.merchant && transaction.description,
    transaction.installmentCurrent !== undefined &&
      `Installment ${transaction.installmentCurrent}/${transaction.installmentTotal}`,
    transaction.originalCurrency &&
      transaction.originalAmount !== undefined &&
      `${transaction.originalCurrency} ${transaction.originalAmount.toFixed(2)}`,
  ].filter(Boolean);

  return (
    <Box
      as="li"
      py={3}
      borderBottomWidth="1px"
      borderColor="border.subtle"
      _last={{ borderBottomWidth: 0 }}
    >
      <Stack gap={2}>
        <HStack justify="space-between" align="flex-start" gap={3}>
          <Box minW={0}>
            <Text fontSize="sm" fontWeight="medium" lineClamp={2}>
              {title}
            </Text>
            {details.map((detail) => (
              <Text key={detail as string} fontSize="xs" color="fg.muted">
                {detail}
              </Text>
            ))}
          </Box>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            whiteSpace="nowrap"
            color={transaction.amountCents < 0 ? "fg.success" : undefined}
          >
            {formatCents(transaction.amountCents)}
          </Text>
        </HStack>
        <HStack justify="space-between" gap={2} wrap="wrap">
          <HStack gap={2}>
            <Text fontSize="xs" color="fg.subtle" whiteSpace="nowrap">
              {formatDay(transaction.date)}
            </Text>
            {tag}
          </HStack>
          <Box ms="auto">
            <TransactionCategorySelect
              transactionId={transaction._id}
              category={transaction.category}
              description={title}
              options={categoryOptions}
            />
          </Box>
        </HStack>
      </Stack>
    </Box>
  );
}
