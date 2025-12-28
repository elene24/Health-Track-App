import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HealthRecord, METRIC_COLORS } from '@/lib/types';

interface HealthChartProps {
  records: HealthRecord[];
  selectedMetrics: string[];
  onMetricChange: (metrics: string[]) => void;
  metricNames: string[];
}

export function HealthChart({ records, selectedMetrics, onMetricChange, metricNames }: HealthChartProps) {
  const chartData = useMemo(() => {
    if (selectedMetrics.length === 0) return [];

    // Group records by date
    const dateMap = new Map<string, Record<string, number>>();
    
    records
      .filter(r => selectedMetrics.includes(r.metric_name))
      .forEach(record => {
        const existing = dateMap.get(record.test_date) || {};
        existing[record.metric_name] = record.metric_value;
        dateMap.set(record.test_date, existing);
      });

    return Array.from(dateMap.entries())
      .map(([date, values]) => ({
        date,
        displayDate: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ...values,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [records, selectedMetrics]);

  const toggleMetric = (metric: string) => {
    if (selectedMetrics.includes(metric)) {
      onMetricChange(selectedMetrics.filter(m => m !== metric));
    } else {
      onMetricChange([...selectedMetrics, metric]);
    }
  };

  return (
    <Card className="chart-container">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Health Trends</CardTitle>
        <Select value={selectedMetrics[0] || ''} onValueChange={(value) => onMetricChange([value])}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select metric" />
          </SelectTrigger>
          <SelectContent>
  {metricNames.map((name) => (
    // We add (name || "Unknown") to ensure the value is NEVER an empty string
    <SelectItem key={name || "unknown"} value={name || "Unknown"}>
      {name || "Unknown Metric"}
    </SelectItem>
  ))}
</SelectContent>
        </Select>
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
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  boxShadow: 'var(--shadow-lg)',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              {selectedMetrics.map((metric, index) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={METRIC_COLORS[metric] || `hsl(var(--chart-${(index % 5) + 1}))`}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2, fill: 'hsl(var(--card))' }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[350px] text-muted-foreground">
            {metricNames.length === 0 
              ? "No health data yet. Upload a file or add records manually."
              : "Select a metric to view trends"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
