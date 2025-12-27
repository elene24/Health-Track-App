import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HealthRecord, METRIC_COLORS } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  metricName: string;
  records: HealthRecord[];
}

export function MetricCard({ metricName, records }: MetricCardProps) {
  const sortedRecords = records
    .filter(r => r.metric_name === metricName)
    .sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());

  const latestRecord = sortedRecords[0];
  const previousRecord = sortedRecords[1];

  if (!latestRecord) return null;

  const trend = previousRecord
    ? latestRecord.metric_value - previousRecord.metric_value
    : 0;

  const trendPercent = previousRecord
    ? ((trend / previousRecord.metric_value) * 100).toFixed(1)
    : '0';

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus;
  const trendColor = trend > 0 ? 'text-destructive' : trend < 0 ? 'text-success' : 'text-muted-foreground';

  const color = METRIC_COLORS[metricName] || METRIC_COLORS.default;

  return (
    <Card className="metric-card group">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: color }}
          />
          {metricName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold tracking-tight">
              {latestRecord.metric_value.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {latestRecord.unit}
            </p>
          </div>
          {previousRecord && (
            <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span>{Math.abs(Number(trendPercent))}%</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(latestRecord.test_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
      </CardContent>
    </Card>
  );
}
