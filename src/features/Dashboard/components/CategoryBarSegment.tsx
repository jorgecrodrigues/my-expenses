import { BarSegment, useChart } from "@chakra-ui/charts";
import { generateColorByString } from "@/shared/utils/color";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { HStack, Text } from "@chakra-ui/react";

interface CategoryBarSegmentProps {
  date: Date;
}

export default function CategoryBarSegment({ date }: CategoryBarSegmentProps) {
  const user = useQuery(api.users.viewer);
  const expenseByCategoryValues = useQuery(
    api.expenses.getExpenseByCategoryValues,
    {
      userId: user?._id as Id<"users">,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
    }
  );

  const chart = useChart({
    data:
      expenseByCategoryValues?.map((item) => ({
        name: item.category,
        value: item.total,
        color: generateColorByString(item.category),
      })) || [],
    sort: { by: "name", direction: "asc" },
  });

  return (
    <>
      <HStack justify="space-between">
        <Text fontSize="lg" fontWeight="bold" mb="2">
          Expenses by Category
        </Text>
        <Text fontSize="lg" fontWeight="bold" mb="2">
          Total:{" "}
          {chart
            ?.getTotal("value")
            ?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </Text>
      </HStack>
      <BarSegment.Root chart={chart}>
        <BarSegment.Content>
          <BarSegment.Value />
          <BarSegment.Bar tooltip />
          <BarSegment.Label textStyle="xs" />
        </BarSegment.Content>
        <BarSegment.Legend showPercent />
      </BarSegment.Root>
      <Text fontSize="sm" color="gray.500" mt="2">
        Data for{" "}
        {date.toLocaleString("default", { month: "long", year: "numeric" })}
      </Text>
    </>
  );
}
