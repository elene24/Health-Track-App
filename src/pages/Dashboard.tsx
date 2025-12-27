import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { HealthChart } from '@/components/dashboard/HealthChart';
import { useAuth } from '@/hooks/useAuth';
import { useHealthRecords } from '@/hooks/useHealthRecords';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { records, loading: recordsLoading, metricNames } = useHealthRecords();
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (metricNames.length > 0 && selectedMetrics.length === 0) {
      setSelectedMetrics([metricNames[0]]);
    }
  }, [metricNames, selectedMetrics.length]);

  if (authLoading || !user) return null;

  return (
    <div className="page-container">
      <Header />
      <main className="content-container space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor your health metrics over time</p>
        </div>

        {recordsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}
          </div>
        ) : metricNames.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {metricNames.slice(0, 4).map(name => (
                <MetricCard key={name} metricName={name} records={records} />
              ))}
            </div>
            <HealthChart
              records={records}
              selectedMetrics={selectedMetrics}
              onMetricChange={setSelectedMetrics}
              metricNames={metricNames}
            />
          </>
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-border">
            <h2 className="text-xl font-semibold mb-2">No Health Data Yet</h2>
            <p className="text-muted-foreground mb-4">Upload a file or add records manually to get started</p>
          </div>
        )}
      </main>
    </div>
  );
}
