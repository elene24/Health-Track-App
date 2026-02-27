// src/components/dashboard/HealthChart.tsx

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import type { HealthRecord } from "@/lib/types";
import { METRIC_COLORS } from "@/lib/types";

interface HealthChartProps {
  records: HealthRecord[];
  selectedMetrics: string[];
  onMetricChange: (metrics: string[]) => void;
  metricNames: string[];
}

export function HealthChart({
  records,
  selectedMetrics,
  onMetricChange,
  metricNames,
}: HealthChartProps) {
  const chartData = useMemo(() => {
    if (selectedMetrics.length === 0) return [];

    const dateMap = new Map<string, Record<string, number>>();

    records
      .filter((r) => selectedMetrics.includes(r.metric_name))
      .forEach((record) => {
        const existing = dateMap.get(record.test_date) || {};
        existing[record.metric_name] = record.metric_value;
        dateMap.set(record.test_date, existing);
      });

    return Array.from(dateMap.entries())
      .map(([date, values]) => ({
        date,
        displayDate: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        ...values,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records, selectedMetrics]);

  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      const next = selectedMetrics.filter((m) => m !== metric);
      if (next.length === 0) return; // ✅ don't allow empty
      onMetricChange(next);
    } else {
      onMetricChange([...selectedMetrics, metric]);
    }
  };

  return (
    <Card className="chart-container">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Health Trends</CardTitle>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[240px] justify-between">
              {selectedMetrics.length
                ? `${selectedMetrics.length} selected`
                : "Select metrics"}
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-[280px] p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Metrics</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMetricChange(metricNames)}
                disabled={metricNames.length === 0}
              >
                Select all
              </Button>
            </div>

            <ScrollArea className="h-64 pr-2">
              <div className="space-y-2">
                {metricNames.map((name) => {
                  const checked = selectedMetrics.includes(name);

                  return (
                    <label key={name} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleMetric(name)}
                      />
                      <span className="text-sm">{name}</span>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (metricNames.length > 0) onMetricChange([metricNames[0]]);
                }}
              >
                Reset
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </CardHeader>

      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="displayDate"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  boxShadow: "var(--shadow-lg)",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend />

              {selectedMetrics.map((metric, index) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={METRIC_COLORS[metric] || `hsl(var(--chart-${(index % 5) + 1}))`}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2, fill: "hsl(var(--card))" }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            {metricNames.length === 0
              ? "No health data yet. Upload a file or add records manually."
              : "Select at least one metric to view trends"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}