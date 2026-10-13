import React from "react";
import { Chart, useChart } from "@chakra-ui/charts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL } from "@/shared/utils/currency";
import { getMonthLabel } from "@/features/Dashboard/utils/dashboardMetrics";

export interface StackedSeries {
  /** Data key; must be a plain identifier (no dots) to be safe for recharts. */
  id: string;
  label: string;
  color: string;
}

interface MonthlyStackedBarChartProps {
  /** 12 entries (January to December) mapping series ids to amounts. */
  data: Record<string, number>[];
  series: StackedSeries[];
  selectedMonthIndex?: number;
  onSelectMonth?: (monthIndex: number) => void;
  showLegend?: boolean;
  height?: number;
}

type ChartRow = { month: string } & Record<string, number | string>;

export default function MonthlyStackedBarChart({
  data,
  series,
  selectedMonthIndex,
  onSelectMonth,
  showLegend = true,
  height = 300,
}: MonthlyStackedBarChartProps) {
  const rows: ChartRow[] = React.useMemo(
    () =>
      data.map((values, monthIndex) => ({
        ...values,
        month: getMonthLabel(monthIndex, "short"),
      })),
    [data],
  );

  const average = React.useMemo(() => {
    const totals = data
      .map((values) =>
        series.reduce((sum, item) => sum + (values[item.id] ?? 0), 0),
      )
      .filter((total) => total > 0);
    return totals.length
      ? totals.reduce((sum, total) => sum + total, 0) / totals.length
      : 0;
  }, [data, series]);

  const chart = useChart<ChartRow>({
    data: rows,
    series: series.map((item) => ({
      name: item.id,
      label: item.label,
      color: item.color,
      stackId: "total",
    })),
  });

  const selectedLabel =
    selectedMonthIndex !== undefined
      ? getMonthLabel(selectedMonthIndex, "short")
      : undefined;

  return (
    <Chart.Root h={height} w="full" chart={chart}>
      <BarChart data={chart.data} barCategoryGap="18%" responsive>
        <CartesianGrid
          stroke={chart.color("border.muted")}
          strokeDasharray="3 3"
          vertical={false}
        />

        {selectedLabel && (
          <ReferenceArea
            x1={selectedLabel}
            x2={selectedLabel}
            fill={chart.color("bg.emphasized")}
            fillOpacity={0.7}
          />
        )}

        <XAxis
          dataKey={chart.key("month")}
          tickLine={false}
          axisLine={false}
          stroke={chart.color("fg.muted")}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={80}
          tickFormatter={(value: number) => formatBRL(value, true)}
          stroke={chart.color("fg.muted")}
        />

        <Tooltip
          cursor={{ fill: chart.color("bg.muted") }}
          animationDuration={100}
          content={
            <Chart.Tooltip
              showTotal
              formatter={(value) => formatBRL(Number(value ?? 0))}
            />
          }
        />

        {average > 0 && (
          <ReferenceLine
            y={average}
            stroke={chart.color("fg.subtle")}
            strokeDasharray="4 4"
            label={{
              value: `Avg ${formatBRL(average, true)}`,
              position: "insideTopRight",
              fill: chart.color("fg.muted"),
              fontSize: 11,
            }}
          />
        )}

        {showLegend && (
          <Legend content={<Chart.Legend interaction="hover" />} />
        )}

        {chart.series.map((item) => (
          <Bar
            key={String(item.name)}
            name={String(item.name)}
            dataKey={chart.key(item.name)}
            stackId={item.stackId}
            fill={chart.color(item.color)}
            fillOpacity={chart.getSeriesOpacity(String(item.name), 0.25)}
            maxBarSize={48}
            isAnimationActive={false}
            cursor={onSelectMonth ? "pointer" : undefined}
            onClick={(_, index) => onSelectMonth?.(index)}
          />
        ))}
      </BarChart>
    </Chart.Root>
  );
}
