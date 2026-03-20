import { Heading, Text, VStack } from "@chakra-ui/react";
import BankAccountsList from "../components/BankAccountsList";

export default function BankAccountPage() {
  return (
    <>
      <VStack mb={4} align="flex-start" gap="md">
        <Heading>Bank Accounts</Heading>
        <Text>Manage your bank accounts and track balances.</Text>
      </VStack>
      <BankAccountsList />
    </>
  );
}
