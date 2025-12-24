import {
  Heading,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react";
import CategoryBarSegment from "../components/CategoryBarSegment";
import CategoryDetail from "../components/CategoryDetail";
import {
  IconCalendarMinus,
  IconCalendarMonth,
  IconCalendarPlus,
} from "@tabler/icons-react";
import { useLocation, useParams } from "wouter";
import React from "react";

export default function DashboardPage() {
  const params = useParams<{ month?: string; year?: string }>();

  const date: Date = React.useMemo(() => {
    const month = params.month ? parseInt(params.month, 10) - 1 : undefined;
    const year = params.year ? parseInt(params.year) : undefined;

    if (month === undefined || year === undefined) {
      return new Date();
    }

    return new Date(year, month, 1);
  }, [params.month, params.year]);

  const [, setLocation] = useLocation();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    if (isNaN(selectedDate.getTime())) {
      setLocation(`/dashboard`);
      return;
    }
    setLocation(
      `/dashboard/month/${selectedDate.getMonth() + 1}/year/${selectedDate.getFullYear()}`
    );
  };

  const handlePreviousMonth = () => {
    const prevMonth = new Date(
      date.getFullYear(),
      date.getMonth() - 1,
      date.getDate()
    );
    setLocation(
      `/dashboard/month/${prevMonth.getMonth() + 1}/year/${prevMonth.getFullYear()}`
    );
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    setLocation(
      `/dashboard/month/${nextMonth.getMonth() + 1}/year/${nextMonth.getFullYear()}`
    );
  };

  return (
    <>
      <VStack mb={4} align="flex-start" gap="md">
        <Heading>Dashboard</Heading>
        <Text>Welcome to the Dashboard!</Text>
      </VStack>
      <HStack mb={4} align="flex-end" justify="flex-end">
        <IconButton
          aria-label="Previous Month"
          title="Previous Month"
          variant="outline"
          onClick={handlePreviousMonth}
        >
          <IconCalendarMinus />
        </IconButton>
        <IconButton
          aria-label="Next Month"
          title="Next Month"
          variant="outline"
          onClick={handleNextMonth}
        >
          <IconCalendarPlus />
        </IconButton>
        <Input
          type="date"
          w={200}
          value={date.toISOString().slice(0, 10)}
          onChange={handleDateChange}
        />
        <IconButton
          aria-label="All Time"
          title="All Time"
          variant="outline"
          onClick={() => setLocation("/dashboard")}
        >
          <IconCalendarMonth />
        </IconButton>
      </HStack>
      <VStack spaceY={4} align="stretch">
        <CategoryBarSegment />
        <CategoryDetail />
      </VStack>
    </>
  );
}
