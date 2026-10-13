import React from "react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  Box,
  Button,
  ColorSwatch,
  HStack,
  Progress,
  Skeleton,
  SkeletonCircle,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Label, Pie, PieChart, Tooltip } from "recharts";
import { formatBRL } from "@/shared/utils/currency";
import { generateColorByString } from "@/shared/utils/color";
import {
  groupBy,
  type Expense,
} from "@/features/Dashboard/utils/dashboardMetrics";

const MAX_SLICES = 7;
const OTHER_SLICE = "Other";
const OTHER_COLOR = "#a1a1aa";

interface CategoryBreakdownProps {
  /** Expenses of the selected month (undefined while loading). */
  expenses?: Expense[];
  monthLabel: string;
  selectedCategory?: string;
  onSelectCategory: (category?: string) => void;
  now: Date;
}

type Slice = {
  name: string;
  value: number;
  color: string;
  fill: string;
  fillOpacity: number;
};

function CategoryBreakdownSkeleton() {
  return (
    <Stack direction={{ base: "column", md: "row" }} gap={6} align="center">
      <SkeletonCircle size="200px" variant="shine" flexShrink={0} />
      <Stack flex={1} w="full" gap={3}>
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height="36px" variant="shine" borderRadius="md" />
        ))}
      </Stack>
    </Stack>
  );
}

export default function CategoryBreakdown({
  expenses,
  monthLabel,
  selectedCategory,
  onSelectCategory,
  now,
}: CategoryBreakdownProps) {
  const categories = React.useMemo(
    () =>
      expenses ? groupBy(expenses, (expense) => expense.category, now) : [],
    [expenses, now],
  );

  const total = categories.reduce((sum, category) => sum + category.total, 0);

  const slices: Slice[] = React.useMemo(() => {
    const opacityFor = (name: string) =>
      selectedCategory && selectedCategory !== name ? 0.3 : 1;

    const top: Slice[] = categories.slice(0, MAX_SLICES).map((category) => {
      const color = generateColorByString(category.key);
      return {
        name: category.key,
        value: category.total,
        color,
        fill: color,
        fillOpacity: opacityFor(category.key),
      };
    });

    const rest = categories.slice(MAX_SLICES);
    if (rest.length > 0) {
      top.push({
        name: OTHER_SLICE,
        value: rest.reduce((sum, category) => sum + category.total, 0),
        color: OTHER_COLOR,
        fill: OTHER_COLOR,
        fillOpacity: selectedCategory ? 0.3 : 1,
      });
    }

    return top;
  }, [categories, selectedCategory]);

  const chart = useChart<Slice>({ data: slices });

  const toggleCategory = (name: string) =>
    onSelectCategory(name === selectedCategory ? undefined : name);

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
          <Text fontSize="sm" color="fg.muted">
            {monthLabel}
          </Text>
        </Stack>
        {selectedCategory && (
          <Button
            size="xs"
            variant="ghost"
            onClick={() => onSelectCategory(undefined)}
          >
            Clear filter
          </Button>
        )}
      </HStack>

      {expenses === undefined ? (
        <CategoryBreakdownSkeleton />
      ) : categories.length === 0 ? (
        <Box py={16} textAlign="center" color="fg.muted">
          No expenses found for this month.
        </Box>
      ) : (
        <Stack
          direction={{ base: "column", md: "row", lg: "column", "2xl": "row" }}
          gap={4}
          align="center"
        >
          <Chart.Root boxSize="220px" flexShrink={0} chart={chart} mx="auto">
            <PieChart responsive>
              <Tooltip
                cursor={false}
                animationDuration={100}
                content={
                  <Chart.Tooltip
                    hideLabel
                    formatter={(value) => formatBRL(Number(value ?? 0))}
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
                cursor="pointer"
                onClick={(_, index) => {
                  const slice = slices[index];
                  if (slice && slice.name !== OTHER_SLICE) {
                    toggleCategory(slice.name);
                  }
                }}
              >
                <Label
                  content={({ viewBox }) => (
                    <Chart.RadialText
                      viewBox={viewBox}
                      title={formatBRL(total, true)}
                      description="total"
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
            gap={1}
            maxH="300px"
            overflowY="auto"
            pr={1}
          >
            {categories.map((category) => {
              const color = generateColorByString(category.key);
              const share = total > 0 ? (category.total / total) * 100 : 0;
              const selected = category.key === selectedCategory;
              const openCount = category.pendingCount + category.overdueCount;

              return (
                <Box as="li" key={category.key} listStyleType="none">
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
                    onClick={() => toggleCategory(category.key)}
                  >
                    <HStack justify="space-between" gap={2}>
                      <HStack gap={2} minW={0}>
                        <ColorSwatch
                          value={color}
                          boxSize="2.5"
                          rounded="full"
                        />
                        <Text fontSize="sm" fontWeight="medium" truncate>
                          {category.key}
                        </Text>
                      </HStack>
                      <HStack gap={2} flexShrink={0}>
                        <Text fontSize="sm" fontWeight="semibold">
                          {formatBRL(category.total)}
                        </Text>
                        <Text
                          fontSize="xs"
                          color="fg.muted"
                          w="3rem"
                          textAlign="right"
                        >
                          {share.toFixed(1)}%
                        </Text>
                      </HStack>
                    </HStack>
                    <Progress.Root value={share} size="xs" mt={1.5} aria-hidden>
                      <Progress.Track borderRadius="full">
                        <Progress.Range
                          borderRadius="full"
                          style={{ background: color }}
                        />
                      </Progress.Track>
                    </Progress.Root>
                    <Text fontSize="xs" color="fg.muted" mt={1}>
                      {category.count} {category.count === 1 ? "bill" : "bills"}
                      {openCount > 0 ? ` · ${openCount} open` : " · all paid"}
                      {category.overdueCount > 0 && (
                        <Text as="span" color="fg.error">
                          {` · ${category.overdueCount} overdue`}
                        </Text>
                      )}
                    </Text>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
