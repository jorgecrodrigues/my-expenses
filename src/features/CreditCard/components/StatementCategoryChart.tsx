import React from "react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  Box,
  Button,
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
  category: string;
  name: string;
  value: number;
  color: string;
  fill: string;
  fillOpacity: number;
  count: number;
};

interface StatementCategoryChartProps {
  categories: CategoryTotal[];
  emptyMessage?: string;
  subtitle?: string;
  selectedCategory?: string;
  /** Makes categories clickable; called with undefined to clear. */
  onSelectCategory?: (category?: string) => void;
}

export default function StatementCategoryChart({
  categories,
  emptyMessage = "No spending in this statement.",
  subtitle,
  selectedCategory,
  onSelectCategory,
}: StatementCategoryChartProps) {
  const slices: Slice[] = React.useMemo(
    () =>
      categories
        .filter((category) => category.totalCents > 0)
        .map((category) => {
          const color = generateColorByString(category.category);
          return {
            category: category.category,
            name: categoryLabel(category.category),
            value: category.totalCents,
            color,
            fill: color,
            fillOpacity:
              selectedCategory && selectedCategory !== category.category
                ? 0.3
                : 1,
            count: category.count,
          };
        }),
    [categories, selectedCategory],
  );
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const chart = useChart<Slice>({ data: slices });

  const toggleCategory = (category: string) =>
    onSelectCategory?.(category === selectedCategory ? undefined : category);

  return (
    <Box
      borderWidth="1px"
      borderColor="border.subtle"
      borderRadius="xl"
      bg="bg.panel"
      p={4}
      h="full"
    >
      <HStack justify="space-between" align="flex-start" mb={4} gap={3}>
        <Stack gap={0.5}>
          <Text fontSize="lg" fontWeight="bold">
            Spending by category
          </Text>
          {subtitle && (
            <Text fontSize="sm" color="fg.muted">
              {subtitle}
            </Text>
          )}
        </Stack>
        {onSelectCategory && selectedCategory && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onSelectCategory(undefined)}
          >
            Clear filter
          </Button>
        )}
      </HStack>
      {slices.length === 0 ? (
        <Box py={16} textAlign="center" color="fg.muted">
          {emptyMessage}
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
                cursor={onSelectCategory ? "pointer" : undefined}
                onClick={(_, index) => {
                  const slice = slices[index];
                  if (slice) toggleCategory(slice.category);
                }}
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

          <Stack
            as="ul"
            aria-label="Categories"
            flex={1}
            w="full"
            gap={onSelectCategory ? 1 : 2}
            maxH={onSelectCategory ? "320px" : undefined}
            overflowY={onSelectCategory ? "auto" : undefined}
            pr={onSelectCategory ? 1 : undefined}
          >
            {slices.map((slice) => {
              const share = total > 0 ? (slice.value / total) * 100 : 0;
              const selected = slice.category === selectedCategory;
              const content = (
                <>
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
                </>
              );
              return (
                <Box as="li" key={slice.category} listStyleType="none">
                  {onSelectCategory ? (
                    <Box
                      as="button"
                      w="full"
                      textAlign="left"
                      px={2.5}
                      py={2}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={selected ? "border.emphasized" : "transparent"}
                      bg={selected ? "bg.muted" : undefined}
                      opacity={selectedCategory && !selected ? 0.6 : 1}
                      _hover={{ bg: "bg.muted" }}
                      cursor="pointer"
                      aria-pressed={selected}
                      onClick={() => toggleCategory(slice.category)}
                    >
                      {content}
                    </Box>
                  ) : (
                    content
                  )}
                </Box>
              );
            })}
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
