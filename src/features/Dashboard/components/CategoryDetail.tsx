import { useQuery } from "convex/react";
import React from "react";
import { useParams } from "wouter";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Chart, useChart } from "@chakra-ui/charts";
import { generateColorByString } from "@/shared/utils/color";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Text, VStack } from "@chakra-ui/react";

type NormalizedData = {
  month: string;
  [key: string]: string | number;
};

type NormalizedSeries = {
  name: string;
  color: string;
  stackId: string;
};

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

  // Normalize data for chart representation
  const normalizedData: NormalizedData[] = React.useMemo(() => {
    if (!data) return [];

    const months: string[] = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthData = months.map((month, index) => {
      const monthItems = data.filter(
        (item) => new Date(item.date).getMonth() === index
      );

      const distinctNames = Array.from(
        new Set(monthItems.map((item) => item.name))
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

  return (
    <>
      <VStack spaceY={0} lineHeight={1}>
        <Text fontSize="lg" fontWeight="bold">
          Show details for category: {params.category || "None"}
        </Text>
        <Text fontSize="sm">
          Breakdown of expenses by month for the year{" "}
          {date ? date.getFullYear() : ""}:
        </Text>
        <Text>
          Total Expenses:{" "}
          {totalByCategory.toLocaleString("en-US", {
            style: "currency",
            currency: "BRL",
          })}
        </Text>
      </VStack>
      <VStack justify="center" align="center">
        <Chart.Root h={280} chart={chart}>
          <BarChart data={chart.data} barCategoryGap={4} stackOffset="positive">
            <CartesianGrid
              stroke={chart.color("border.emphasized")}
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              axisLine={false}
              tickLine={false}
              dataKey={chart.key("month")}
              stroke={chart.color("border")}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
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
              >
                <LabelList
                  dataKey={chart.key(item.name)}
                  position="top"
                  style={{ fontWeight: 600, fill: chart.color("fg") }}
                />
              </Bar>
            ))}
          </BarChart>
        </Chart.Root>
        <Text fontSize="sm" color="gray.500">
          Data for{" "}
          {date
            ? date.toLocaleDateString("en-US", {
                year: "numeric",
              })
            : "All Time"}
        </Text>
      </VStack>
    </>
  );
}
