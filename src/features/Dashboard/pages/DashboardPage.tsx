import {
  Box,
  Heading,
  HStack,
  Text,
  VStack,
  type DatePickerValueChangeDetails,
} from "@chakra-ui/react";
import CategoryBarSegment from "../components/CategoryBarSegment";
import CategoryDetail from "../components/CategoryDetail";
import { useLocation, useParams } from "wouter";
import React from "react";
import CustomMonthPicker from "@/shared/components/CustomMonthPicker";

export default function DashboardPage() {
  const params = useParams<{
    month?: string;
    year?: string;
    category?: string;
  }>();

  const date: Date = React.useMemo(() => {
    const month = params.month ? parseInt(params.month, 10) - 1 : undefined;
    const year = params.year ? parseInt(params.year) : undefined;

    if (month === undefined || year === undefined) {
      return new Date();
    }

    return new Date(year, month, 1);
  }, [params.month, params.year]);

  const [, setLocation] = useLocation();

  const handleDateChange = (details: DatePickerValueChangeDetails) => {
    const month = details.value?.[0]?.month ?? date.getMonth() + 1;
    const year = details.value?.[0]?.year ?? date.getFullYear();

    setLocation(
      `/dashboard/month/${month}/year/${year}${params.category ? `/category/${params.category}` : ""}`,
    );
  };

  return (
    <>
      <HStack mb={8} gap="md" justify="space-between" align="flex-end">
        <VStack align="flex-start" gap="md">
          <Heading>Dashboard</Heading>
          <Text>Welcome to the Dashboard!</Text>
        </VStack>
        <CustomMonthPicker onValueChange={handleDateChange} />
      </HStack>

      <VStack spaceY={14} align="stretch">
        <Box>
          <CategoryBarSegment />
        </Box>
        <Box>
          <CategoryDetail />
        </Box>
      </VStack>
    </>
  );
}
