import React from "react";
import { HStack, Skeleton, Text, Button, NativeSelect } from "@chakra-ui/react";
import { BarSegment, useChart } from "@chakra-ui/charts";
import { generateColorByString } from "@/shared/utils/color";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { useLocation, useParams } from "wouter";

export default function CategoryBarSegment() {
  const params = useParams<{ month?: string; year?: string }>();

  const today = new Date();
  const date = React.useMemo(() => {
    const month = params.month ? parseInt(params.month, 10) - 1 : undefined;
    const year = params.year ? parseInt(params.year, 10) : undefined;
    if (month === undefined || year === undefined) {
      return undefined;
    }
    return new Date(year, month, 1);
  }, [params.month, params.year]);

  const [, setLocation] = useLocation();

  const handlePreviousMonth = () => {
    const d = date ? date : today;
    const prevMonth = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate());
    setLocation(
      `/dashboard/month/${prevMonth.getMonth() + 1}/year/${prevMonth.getFullYear()}`
    );
  };

  const handleNextMonth = () => {
    const d = date ? date : today;
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, d.getDate());
    setLocation(
      `/dashboard/month/${nextMonth.getMonth() + 1}/year/${nextMonth.getFullYear()}`
    );
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
      setLocation("/dashboard");
      return;
    }
    const d = date ? date : today;
    const newDate = new Date(d.getFullYear(), month, d.getDate());
    setLocation(
      `/dashboard/month/${newDate.getMonth() + 1}/year/${newDate.getFullYear()}`
    );
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value, 10);
    if (isNaN(year)) {
      setLocation("/dashboard");
      return;
    }
    const d = date ? date : today;
    const newDate = new Date(year, d.getMonth(), d.getDate());
    setLocation(
      `/dashboard/month/${newDate.getMonth() + 1}/year/${newDate.getFullYear()}`
    );
  };

  return (
    <>
      <HStack justify="flex-end">
        <HStack mb={2}>
          <Button
            variant="surface"
            size="sm"
            onClick={() => setLocation("/dashboard")}
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
            <BarSegment.Bar
              tooltip={({ payload }: BarSegment.TooltipProps) => (
                <Button
                  w="100%"
                  h="100%"
                  bg="transparent"
                  rounded={0}
                  onClick={() => {
                    setLocation(
                      `/dashboard/month/${params.month || today.getMonth() + 1}/year/${params.year || today.getFullYear()}/category/${payload.name}`
                    );
                  }}
                />
              )}
            />
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
