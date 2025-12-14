import React from "react";
import { HStack, Skeleton, Text, Input, Button } from "@chakra-ui/react";
import { BarSegment, useChart } from "@chakra-ui/charts";
import { generateColorByString } from "@/shared/utils/color";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function CategoryBarSegment() {
  const [date, setDate] = React.useState<Date>(new Date());

  const handlePreviousMonth = () => {
    const prevMonth = new Date(
      date.getFullYear(),
      date.getMonth() - 1,
      date.getDate()
    );
    setDate(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    );
    setDate(nextMonth);
  };

  const user = useQuery(api.users.viewer);
  const data = useQuery(api.expenses.getExpenseByCategoryValues, {
    userId: user?._id as Id<"users">,
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  });

  const chart = useChart({
    data:
      data?.map((item) => ({
        name: item.category,
        value: item.total,
        color: generateColorByString(item.category),
      })) || [],
    sort: { by: "name", direction: "asc" },
  });

  return (
    <>
      <HStack justify="flex-end">
        <HStack mb={4}>
          <Input
            mr={8}
            variant="subtle"
            type="date"
            value={date.toISOString().slice(0, 10)}
            onChange={(e) => setDate(new Date(e.target.value))}
          />
          <Button variant="surface" size="sm" onClick={handlePreviousMonth}>
            Mês Anterior
          </Button>
          <Button variant="surface" size="sm" onClick={handleNextMonth}>
            Próximo Mês
          </Button>
        </HStack>
      </HStack>
      <HStack justify="space-between">
        <Skeleton mb={2} w="fit-content" loading={!data}>
          <Text fontSize="lg" fontWeight="bold">
            Expenses by Category
          </Text>
        </Skeleton>
        <Skeleton mb={2} w="fit-content" loading={!data}>
          <Text fontSize="lg" fontWeight="bold">
            Total:{" "}
            {chart
              ?.getTotal("value")
              ?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </Text>
        </Skeleton>
      </HStack>
      <Skeleton loading={!data}>
        <BarSegment.Root mb={2} chart={chart}>
          <BarSegment.Content>
            <BarSegment.Value />
            <BarSegment.Bar tooltip />
            <BarSegment.Label textStyle="xs" />
            {data && data.length === 0 && (
              <Text>No expenses found for this month.</Text>
            )}
          </BarSegment.Content>
          <BarSegment.Legend showPercent />
        </BarSegment.Root>
      </Skeleton>
      <Skeleton w="fit-content" loading={!data}>
        <Text fontSize="sm" color="gray.500">
          Data for{" "}
          {date.toLocaleString("default", { month: "long", year: "numeric" })}
        </Text>
      </Skeleton>
    </>
  );
}
