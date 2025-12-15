import { useQuery } from "convex/react";
import React from "react";
import { useParams } from "wouter";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Chart, useChart } from "@chakra-ui/charts";
import { generateColorByString } from "@/shared/utils/color";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
import { Text, VStack } from "@chakra-ui/react";

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

  const normalizedData = React.useMemo(() => {
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
      const amount = monthItems.reduce((sum, item) => sum + item.amount, 0);
      return { month, amount };
    });

    return monthData;
  }, [data]);

  const chart = useChart({
    data: normalizedData,
    series: [
      {
        name: "amount",
        color: generateColorByString(params.category || ""),
      },
    ],
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
          {chart.getTotal("amount").toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </Text>
      </VStack>
      <VStack justify="center" align="center">
        <Chart.Root maxH={280} chart={chart}>
          <BarChart data={chart.data}>
            <CartesianGrid
              stroke={chart.color("border.muted")}
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
                radius={4}
              />
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
