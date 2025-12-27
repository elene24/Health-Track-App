import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { RecordsTable } from '@/components/records/RecordsTable';
import { useAuth } from '@/hooks/useAuth';
import { useHealthRecords } from '@/hooks/useHealthRecords';
import { Skeleton } from '@/components/ui/skeleton';

export default function Records() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { records, loading: recordsLoading } = useHealthRecords();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  if (authLoading || !user) return null;

  return (
    <div className="page-container">
      <Header />
      <main className="content-container space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Health Records</h1>
          <p className="text-muted-foreground mt-1">View and manage all your health data</p>
        </div>
        {recordsLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <RecordsTable records={records} />
        )}
      </main>
    </div>
  );
}
