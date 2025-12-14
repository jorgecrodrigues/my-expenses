import React from "react";
import { HStack, Skeleton, Text, Button, NativeSelect } from "@chakra-ui/react";
import { BarSegment, useChart } from "@chakra-ui/charts";
import { generateColorByString } from "@/shared/utils/color";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function CategoryBarSegment() {
  const today = new Date();
  const [date, setDate] = React.useState<Date | undefined>();

  const handlePreviousMonth = () => {
    const d = date ? date : today;
    const prevMonth = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate());
    setDate(prevMonth);
  };

  const handleNextMonth = () => {
    const d = date ? date : today;
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
    setDate(nextMonth);
  };

  const user = useQuery(api.users.viewer);
  const data = useQuery(api.expenses.getExpenseByCategoryValues, {
    userId: user?._id as Id<"users">,
    month: date ? date.getMonth() + 1 : undefined,
    year: date ? date.getFullYear() : undefined,
  });

  const chart = useChart({
    data:
      data?.map((item) => ({
        name: item.category,
        value: item.total,
        color: generateColorByString(item.category),
      })) || [],
  });

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = parseInt(e.target.value, 10);
    if (isNaN(month) || month < 0 || month > 11) {
      setDate(undefined);
      return;
    }
    const d = date ? date : today;
    const newDate = new Date(d.getFullYear(), month, d.getDate());
    setDate(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value, 10);
    if (isNaN(year)) {
      setDate(undefined);
      return;
    }
    const d = date ? date : today;
    const newDate = new Date(year, d.getMonth(), d.getDate());
    setDate(newDate);
  };

  return (
    <>
      <HStack justify="flex-end">
        <HStack mb={4}>
          <Button
            variant="surface"
            size="sm"
            onClick={() => setDate(undefined)}
          >
            Todos os Meses
          </Button>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={date ? date.getMonth() : -1}
              onChange={handleMonthChange}
            >
              <option value={-1}>Todos os Meses</option>
              {Array.from({ length: 12 }, (_, i) => i)
                .reverse()
                .map((month) => (
                  <option key={month} value={month}>
                    {new Date(0, month).toLocaleString("pt-BR", {
                      month: "long",
                    })}
                  </option>
                ))}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
          <NativeSelect.Root>
            <NativeSelect.Field
              value={date ? date.getFullYear() : -1}
              onChange={handleYearChange}
            >
              <option value={-1}>Todos os Anos</option>
              {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map(
                (year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                )
              )}
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
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
          {date
            ? date.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })
            : today.toLocaleDateString("en-US", { year: "numeric" })}
        </Text>
      </Skeleton>
    </>
  );
}
