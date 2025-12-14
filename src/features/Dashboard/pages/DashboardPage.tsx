import { HStack } from "@chakra-ui/react";
import CategoryBarSegment from "../components/CategoryBarSegment";

export default function DashboardPage() {
  return (
    <>
      <HStack mb={4} gap="md" justify="space-between">
        <div>
          <h2>Dashboard Page</h2>
          <p>Welcome to the Dashboard!</p>
        </div>
      </HStack>
      <CategoryBarSegment />
    </>
  );
}
