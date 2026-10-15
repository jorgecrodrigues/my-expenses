import { Heading, Text, VStack } from "@chakra-ui/react";
import StatementUploader from "../components/StatementUploader";
import StatementsList from "../components/StatementsList";
import YearDashboard from "../components/YearDashboard";

export default function CreditCardPage() {
  return (
    <VStack align="stretch" gap={6}>
      <VStack align="flex-start" gap="md">
        <Heading>Credit Card</Heading>
        <Text>
          Upload your Nubank or Inter statement PDF and get a detailed spending
          report generated with Gemini.
        </Text>
      </VStack>
      <YearDashboard />
      <StatementUploader />
      <StatementsList />
    </VStack>
  );
}
