import { Box, HStack, Stack, Table, Text } from "@chakra-ui/react";
import type { InstallmentItem } from "../../../../convex/lib/creditCardReport";
import useIsMobile from "@/shared/hooks/useIsMobile";
import { formatCents } from "../utils/creditCard";

export default function InstallmentsTable({
  installments,
}: {
  installments: InstallmentItem[];
}) {
  const isMobile = useIsMobile();

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={4}
      h="full"
    >
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Installments
      </Text>
      {installments.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          No installment purchases in this statement.
        </Text>
      ) : isMobile ? (
        <Stack as="ul" aria-label="Installments" gap={0} listStyleType="none">
          {installments.map((item, index) => (
            <Box
              as="li"
              key={`${item.description}-${index}`}
              py={2.5}
              borderBottomWidth="1px"
              borderColor="border.subtle"
              _last={{ borderBottomWidth: 0, pb: 0 }}
              _first={{ pt: 0 }}
            >
              <HStack justify="space-between" align="flex-start" gap={3}>
                <Stack gap={0.5} minW={0}>
                  <Text fontSize="sm" lineClamp={2}>
                    {item.description}
                  </Text>
                  <Text fontSize="xs" color="fg.subtle">
                    {`Installment ${item.installmentCurrent}/${item.installmentTotal}`}
                  </Text>
                </Stack>
                <Stack gap={0.5} align="flex-end" flexShrink={0}>
                  <Text fontSize="sm" fontWeight="medium">
                    {formatCents(item.amountCents)}
                  </Text>
                  <Text fontSize="xs" color="fg.warning">
                    {formatCents(item.remainingCents)} left
                  </Text>
                </Stack>
              </HStack>
            </Box>
          ))}
        </Stack>
      ) : (
        <Table.ScrollArea>
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>Purchase</Table.ColumnHeader>
                <Table.ColumnHeader>Installment</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">
                  This month
                </Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">
                  Remaining
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {installments.map((item, index) => (
                <Table.Row key={`${item.description}-${index}`}>
                  <Table.Cell fontSize="xs">{item.description}</Table.Cell>
                  <Table.Cell fontSize="xs" color="fg.subtle">
                    {item.installmentCurrent}/{item.installmentTotal}
                  </Table.Cell>
                  <Table.Cell fontSize="xs" textAlign="end">
                    {formatCents(item.amountCents)}
                  </Table.Cell>
                  <Table.Cell fontSize="xs" textAlign="end" color="fg.warning">
                    {formatCents(item.remainingCents)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      )}
    </Box>
  );
}
