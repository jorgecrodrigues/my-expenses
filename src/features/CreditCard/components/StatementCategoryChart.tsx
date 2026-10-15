import React from "react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  Box,
  ColorSwatch,
  HStack,
  Progress,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Label, Pie, PieChart, Tooltip } from "recharts";
import { generateColorByString } from "@/shared/utils/color";
import type { CategoryTotal } from "../../../../convex/lib/creditCardReport";
import { categoryLabel, formatCents } from "../utils/creditCard";

type Slice = {
  name: string;
  value: number;
  color: string;
  fill: string;
  count: number;
};

export default function StatementCategoryChart({
  categories,
}: {
  categories: CategoryTotal[];
}) {
  const slices: Slice[] = React.useMemo(
    () =>
      categories
        .filter((category) => category.totalCents > 0)
        .map((category) => {
          const color = generateColorByString(category.category);
          return {
            name: categoryLabel(category.category),
            value: category.totalCents,
            color,
            fill: color,
            count: category.count,
          };
        }),
    [categories],
  );
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const chart = useChart<Slice>({ data: slices });

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={4}
      h="full"
    >
      <Text fontSize="lg" fontWeight="bold" mb={4}>
        Spending by category
      </Text>
      {slices.length === 0 ? (
        <Box py={16} textAlign="center" color="fg.muted">
          No spending in this statement.
        </Box>
      ) : (
        <Stack direction={{ base: "column", md: "row" }} gap={4} align="center">
          <Chart.Root boxSize="220px" flexShrink={0} chart={chart} mx="auto">
            <PieChart responsive>
              <Tooltip
                cursor={false}
                animationDuration={100}
                content={
                  <Chart.Tooltip
                    hideLabel
                    formatter={(value) => formatCents(Number(value ?? 0))}
                  />
                }
              />
              <Pie
                data={chart.data}
                dataKey={chart.key("value")}
                nameKey="name"
                innerRadius="62%"
                outerRadius="95%"
                paddingAngle={1.5}
                isAnimationActive={false}
              >
                <Label
                  content={({ viewBox }) => (
                    <Chart.RadialText
                      viewBox={viewBox}
                      title={formatCents(total, true)}
                      description="spent"
                      fontSize="lg"
                    />
                  )}
                />
              </Pie>
            </PieChart>
          </Chart.Root>

          <Stack as="ul" aria-label="Categories" flex={1} w="full" gap={2}>
            {slices.map((slice) => {
              const share = total > 0 ? (slice.value / total) * 100 : 0;
              return (
                <Box as="li" key={slice.name} listStyleType="none">
                  <HStack justify="space-between" gap={2}>
                    <HStack gap={2} minW={0}>
                      <ColorSwatch value={slice.color} boxSize="2.5" rounded="full" />
                      <Text fontSize="sm" fontWeight="medium" truncate>
                        {slice.name}
                      </Text>
                    </HStack>
                    <HStack gap={2} flexShrink={0}>
                      <Text fontSize="sm" fontWeight="semibold">
                        {formatCents(slice.value)}
                      </Text>
                      <Text fontSize="xs" color="fg.muted" w="3rem" textAlign="right">
                        {share.toFixed(1)}%
                      </Text>
                    </HStack>
                  </HStack>
                  <Progress.Root value={share} size="xs" mt={1.5} aria-hidden>
                    <Progress.Track borderRadius="full">
                      <Progress.Range
                        borderRadius="full"
                        style={{ background: slice.color }}
                      />
                    </Progress.Track>
                  </Progress.Root>
                  <Text fontSize="xs" color="fg.muted" mt={1}>
                    {slice.count} {slice.count === 1 ? "line" : "lines"}
                  </Text>
                </Box>
              );
            })}
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
