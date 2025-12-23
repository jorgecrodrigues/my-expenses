import React from "react";
import { HStack, Skeleton, Text, Button } from "@chakra-ui/react";
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

  return (
    <>
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
