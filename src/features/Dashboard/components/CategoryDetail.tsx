import { useQuery } from "convex/react";
import React from "react";
import { useParams } from "wouter";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  generateColorByString,
  getContrastingTextColor,
} from "@/shared/utils/color";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Box,
  HStack,
  Progress,
  SimpleGrid,
  Skeleton,
  Span,
  Text,
  VStack,
} from "@chakra-ui/react";

type NormalizedData = {
  month: string;
  [key: string]: string | number;
};

type NormalizedSeries = {
  name: string;
  color: string;
  stackId: string;
};

// Relative bar heights (12 months) to mimic a stacked monthly chart.
const CHART_SKELETON_BAR_HEIGHTS = [
  38, 58, 44, 72, 50, 66, 36, 78, 48, 62, 54, 70,
] as const;

// Width of the y-axis.
const CHART_SKELETON_Y_AXIS_W = "2.5rem";

// Number of skeleton cards to show.
const SUBCATEGORY_SKELETON_CARD_COUNT = 4;

// Labels for the subcategory rows.
const SUBCATEGORY_ROW_LABELS = ["Paid", "Left to pay", "Total"] as const;

function CategoryBarChartSkeleton() {
  return (
    <Box w="full" h="280px">
      <VStack gap={2} h="full" align="stretch">
        <HStack flex={1} align="flex-end" gap={2} minH={0} minW={0}>
          <VStack
            w={CHART_SKELETON_Y_AXIS_W}
            flexShrink={0}
            justify="space-between"
            h="full"
            py={1}
            align="flex-end"
          >
            {[0, 1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                height="10px"
                width="65%"
                variant="shine"
                borderRadius="sm"
              />
            ))}
          </VStack>
          <Box
            flex={1}
            minW={0}
            h="full"
            position="relative"
            borderLeftWidth="1px"
            borderBottomWidth="1px"
            borderColor="border.subtle"
            borderRadius="sm"
          >
            <VStack
              position="absolute"
              inset={0}
              justify="space-between"
              pointerEvents="none"
              py={0}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <Box
                  key={i}
                  w="full"
                  borderTopWidth="1px"
                  borderColor="border.subtle"
                  opacity={0.55}
                />
              ))}
            </VStack>
            <HStack
              align="flex-end"
              justify="space-between"
              gap={1.5}
              h="full"
              px={1.5}
              pb={0}
              position="relative"
            >
              {CHART_SKELETON_BAR_HEIGHTS.map((pct, i) => (
                <Skeleton
                  key={i}
                  flex={1}
                  minW={0}
                  maxW="100%"
                  h={`${pct}%`}
                  variant="shine"
                  borderTopRadius="sm"
                />
              ))}
            </HStack>
          </Box>
        </HStack>
        <HStack align="flex-start" gap={2} w="full">
          <Box w={CHART_SKELETON_Y_AXIS_W} flexShrink={0} />
          <HStack flex={1} minW={0} gap={1.5}>
            {CHART_SKELETON_BAR_HEIGHTS.map((_, i) => (
              <Skeleton
                key={i}
                flex={1}
                minW={0}
                height="8px"
                variant="shine"
                borderRadius="sm"
              />
            ))}
          </HStack>
        </HStack>
      </VStack>
    </Box>
  );
}

function SubcategoryGridSkeleton() {
  return (
    <VStack align="stretch" gap={3} w="full" mt={2}>
      <Text fontSize="sm" fontWeight="semibold" color="fg" textAlign="right">
        By expense name
      </Text>
      <SimpleGrid minChildWidth="250px" gap={3} w="full">
        {Array.from({ length: SUBCATEGORY_SKELETON_CARD_COUNT }).map(
          (_, index) => (
            <Box
              key={index}
              borderWidth="1px"
              borderColor="border.subtle"
              borderRadius="lg"
              px={3}
              py={2.5}
              bg="bg.panel"
            >
              <Skeleton
                height="20px"
                maxW={index % 3 === 0 ? "72%" : index % 3 === 1 ? "88%" : "64%"}
                variant="shine"
                borderRadius="sm"
                mb={2}
              />
              <VStack align="stretch" gap={1.5}>
                {SUBCATEGORY_ROW_LABELS.map((label) => (
                  <HStack key={label} justify="space-between" gap={2} w="full">
                    <Text fontSize="xs" color="fg.muted" flexShrink={0}>
                      {label}
                    </Text>
                    <Skeleton
                      height="16px"
                      width="6.25rem"
                      variant="shine"
                      borderRadius="sm"
                      flexShrink={0}
                    />
                  </HStack>
                ))}
              </VStack>
              <Skeleton
                height="8px"
                w="full"
                variant="shine"
                borderRadius="full"
                mt={2.5}
              />
            </Box>
          ),
        )}
      </SimpleGrid>
    </VStack>
  );
}

export default function CategoryDetail() {
  const params = useParams<{
    month?: string;
    year?: string;
    category?: string;
  }>();

  const date = React.useMemo(() => {
    const month = params.month ? parseInt(params.month, 10) - 1 : undefined;
    const year = params.year ? parseInt(params.year, 10) : undefined;
    if (month === undefined || year === undefined) {
      return undefined;
    }
    return new Date(year, month, 1);
  }, [params.month, params.year]);

  const user = useQuery(api.users.viewer);
  const data = useQuery(api.expenses.getExpenseByCategory, {
    userId: user?._id as Id<"users">,
    category: params.category || "",
    year: date ? date.getFullYear() : undefined,
  });

  // Calculate total expenses for the category
  const totalByCategory = React.useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, item) => sum + item.amount, 0);
  }, [data]);
  // Calculate total expenses for the category excluding paid items
  const totalByCategoryExceptPaid = React.useMemo(() => {
    if (!data) return 0;
    return data
      .filter((item) => !item.paidAt)
      .reduce((sum, item) => sum + item.amount, 0);
  }, [data]);
  // Calculate total expenses for the category by name
  const totalByCategoryByName = React.useMemo(() => {
    if (!data) return {};
    return data.reduce(
      (acc, item) => {
        if (!acc[item.name]) {
          acc[item.name] = 0;
        }
        if (!acc[`${item.name} [paid]`]) {
          acc[`${item.name} [paid]`] = 0;
        }
        acc[item.name] += item.amount;
        acc[`${item.name} [paid]`] += item.paidAt ? item.amount : 0;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [data]);

  const subcategoryRows = React.useMemo(() => {
    return Object.entries(totalByCategoryByName)
      .filter(([name]) => !name.includes("[paid]"))
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, total]) => ({
        name,
        total,
        paid: totalByCategoryByName[`${name} [paid]`] ?? 0,
      }));
  }, [totalByCategoryByName]);

  // Normalize data for chart representation
  const normalizedData: NormalizedData[] = React.useMemo(() => {
    if (!data) return [];

    // Generate month labels
    const months: string[] = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(0, i);
      return date.toLocaleString(undefined, { month: "long" });
    });

    const monthData = months.map((month, index) => {
      const monthItems = data.filter(
        (item) => new Date(item.date).getMonth() === index,
      );

      const distinctNames = Array.from(
        new Set(monthItems.map((item) => item.name)),
      );

      const totalAmountByName = distinctNames.map((name) => {
        const total = monthItems
          .filter((item) => item.name === name)
          .reduce((sum, item) => sum + item.amount, 0);
        return { name, total };
      });

      return {
        month,
        ...Object.fromEntries(totalAmountByName.map((t) => [t.name, t.total])),
      };
    });

    return monthData;
  }, [data]);

  // Prepare series for the chart representation
  const normalizedSeries: NormalizedSeries[] = React.useMemo(() => {
    if (!data) return [];

    const distinctNames = Array.from(new Set(data.map((item) => item.name)));

    return distinctNames.map((name) => ({
      name,
      color: generateColorByString(name),
      stackId: "a",
    }));
  }, [data]);

  const chart = useChart({
    data: normalizedData,
    series: normalizedSeries,
  });

  console.log("Normalized Data:", normalizedData);
  console.log("Normalized Series:", normalizedSeries);
  console.log("Chart Data:", chart.data);

  return (
    <VStack gap={4} align="stretch">
      <Text fontSize="md">
        Breakdown of expenses by month for <b>{params.category}</b> in{" "}
        {date ? date.getFullYear() : "All Time"}
      </Text>

      <VStack mb={8} justify="center" align="center" w="full">
        {data === undefined ? (
          <CategoryBarChartSkeleton />
        ) : (
          <Chart.Root h={280} w="full" chart={chart}>
            <BarChart
              data={chart.data}
              barCategoryGap={4}
              stackOffset="positive"
              responsive
            >
              <CartesianGrid
                stroke={chart.color("border.emphasized")}
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                axisLine
                tickLine
                dataKey={chart.key("month")}
                stroke={chart.color("border")}
              />

              <YAxis
                axisLine
                tickLine
                tickFormatter={chart.formatNumber({
                  style: "currency",
                  currency: "BRL",
                  notation: "compact",
                })}
                stroke={chart.color("border")}
              />

              <Tooltip
                cursor={{ fill: chart.color("background.muted") }}
                animationDuration={0}
                content={<Chart.Tooltip />}
              />

              {chart.series.map((item) => (
                <Bar
                  key={item.name}
                  dataKey={chart.key(item.name)}
                  fill={chart.color(item.color)}
                  stroke={chart.color(item.color)}
                  stackId={item.stackId}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey={chart.key(item.name)}
                    position="middle"
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      fill: getContrastingTextColor(
                        generateColorByString(item?.name?.toString() ?? ""),
                      ),
                    }}
                  />
                </Bar>
              ))}
            </BarChart>
          </Chart.Root>
        )}

        <VStack align="stretch" gap={2} w="full">
          <Progress.Root
            value={totalByCategory - totalByCategoryExceptPaid}
            max={totalByCategory}
            w="full"
            colorPalette="gray"
            size="md"
            variant="subtle"
          >
            <HStack>
              <Progress.ValueText>
                {(totalByCategory - totalByCategoryExceptPaid).toLocaleString(
                  "pt-BR",
                  {
                    style: "currency",
                    currency: "BRL",
                  },
                )}{" "}
                paid {" • "}
                {totalByCategoryExceptPaid.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}{" "}
                left to pay
              </Progress.ValueText>
              <Progress.Track borderRadius="full" flex={1}>
                <Progress.Range borderRadius="full" />
              </Progress.Track>
              <Progress.ValueText />
            </HStack>
          </Progress.Root>
        </VStack>
      </VStack>

      {data === undefined ? (
        <SubcategoryGridSkeleton />
      ) : subcategoryRows.length > 0 ? (
        <VStack align="stretch" gap={3} w="full" mt={2}>
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="fg"
            textAlign="right"
          >
            By expense name
          </Text>
          <SimpleGrid minChildWidth={250} gap={3} w="full">
            {subcategoryRows.map(({ name, total, paid }) => {
              const leftToPay = Math.max(0, total - paid);
              return (
                <Box
                  key={name}
                  borderWidth="1px"
                  borderColor="border.subtle"
                  borderRadius="lg"
                  px={3}
                  py={2.5}
                  bg="bg.panel"
                >
                  <Text
                    fontSize="sm"
                    fontWeight="medium"
                    color="fg"
                    mb={2}
                    lineClamp={2}
                    title={name}
                  >
                    {name}
                  </Text>

                  <VStack align="stretch" gap={1.5}>
                    <HStack justify="space-between" gap={2}>
                      <Text fontSize="xs" color="fg.muted">
                        Paid
                      </Text>
                      <Span fontSize="xs" color="fg.success">
                        {paid.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </Span>
                    </HStack>
                    <HStack justify="space-between" gap={2}>
                      <Text fontSize="xs" color="fg.muted">
                        Left to pay
                      </Text>
                      <Span fontSize="xs" color="fg.warning">
                        {leftToPay.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </Span>
                    </HStack>
                    <HStack justify="space-between" gap={2}>
                      <Text fontSize="xs" color="fg.muted">
                        Total
                      </Text>
                      <Span fontSize="xs" color="fg.error">
                        {total.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </Span>
                    </HStack>
                  </VStack>

                  <Progress.Root
                    variant="subtle"
                    value={paid}
                    max={total}
                    w="full"
                    mt={2.5}
                    size="xs"
                    colorPalette="gray"
                    title={`${Math.round((paid / total) * 100)}% paid`}
                  >
                    <HStack>
                      <Progress.Track borderRadius="full" flex={1}>
                        <Progress.Range borderRadius="full" />
                      </Progress.Track>
                      <Progress.ValueText>
                        {Math.round((paid / total) * 100)}%
                      </Progress.ValueText>
                    </HStack>
                  </Progress.Root>
                </Box>
              );
            })}
          </SimpleGrid>
        </VStack>
      ) : null}
    </VStack>
  );
}
