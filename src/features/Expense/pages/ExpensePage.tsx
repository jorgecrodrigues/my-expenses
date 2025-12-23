import ExpensesList from "../components/ExpensesList";
import { VStack, Heading, Text } from "@chakra-ui/react";

export default function ExpensePage() {
  return (
    <>
      <VStack mb={4} align="flex-start" gap="md">
        <Heading>Expense List</Heading>
        <Text>Manage and track your expenses efficiently.</Text>
      </VStack>
      <ExpensesList />
    </>
  );
}
