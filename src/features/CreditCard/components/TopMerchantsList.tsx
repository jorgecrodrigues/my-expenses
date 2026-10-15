import { Box, HStack, Stack, Text } from "@chakra-ui/react";
import type { MerchantTotal } from "../../../../convex/lib/creditCardReport";
import { formatCents } from "../utils/creditCard";

export default function TopMerchantsList({
  merchants,
  emptyMessage = "No purchases in this statement.",
  subtitle,
}: {
  merchants: MerchantTotal[];
  emptyMessage?: string;
  subtitle?: string;
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={4}
      h="full"
    >
      <Stack gap={0.5} mb={4}>
        <Text fontSize="lg" fontWeight="bold">
          Top merchants
        </Text>
        {subtitle && (
          <Text fontSize="sm" color="fg.muted">
            {subtitle}
          </Text>
        )}
      </Stack>
      {merchants.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          {emptyMessage}
        </Text>
      ) : (
        <Stack as="ol" aria-label="Top merchants" gap={2}>
          {merchants.map((merchant, index) => (
            <HStack
              as="li"
              key={merchant.merchant}
              justify="space-between"
              gap={3}
              listStyleType="none"
            >
              <HStack gap={2} minW={0}>
                <Text fontSize="xs" color="fg.muted" w="1.5rem">
                  {index + 1}.
                </Text>
                <Text fontSize="sm" fontWeight="medium" truncate>
                  {merchant.merchant}
                </Text>
                <Text fontSize="xs" color="fg.muted" flexShrink={0}>
                  {merchant.count}x
                </Text>
              </HStack>
              <Text fontSize="sm" fontWeight="semibold" flexShrink={0}>
                {formatCents(merchant.totalCents)}
              </Text>
            </HStack>
          ))}
        </Stack>
      )}
    </Box>
  );
}
