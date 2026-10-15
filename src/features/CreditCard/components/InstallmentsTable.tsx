import { Box, Table, Text } from "@chakra-ui/react";
import type { InstallmentItem } from "../../../../convex/lib/creditCardReport";
import { formatCents } from "../utils/creditCard";

export default function InstallmentsTable({
  installments,
}: {
  installments: InstallmentItem[];
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
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Installments
      </Text>
      {installments.length === 0 ? (
        <Text fontSize="sm" color="fg.muted">
          No installment purchases in this statement.
        </Text>
      ) : (
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Purchase</Table.ColumnHeader>
              <Table.ColumnHeader>Installment</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">This month</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="end">Remaining</Table.ColumnHeader>
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
      )}
    </Box>
  );
}
