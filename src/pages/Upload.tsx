import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { ParsedDataPreview } from '@/components/upload/ParsedDataPreview';
import { ManualEntryForm } from '@/components/records/ManualEntryForm';
import { useAuth } from '@/hooks/useAuth';
import { useHealthRecords } from '@/hooks/useHealthRecords';
import { ParsedHealthData, ParsedMetric } from '@/lib/types';

export default function Upload() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { addMultipleRecords } = useHealthRecords();
  const [parsedData, setParsedData] = useState<ParsedHealthData | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const handleConfirmImport = async (metrics: ParsedMetric[], testDate: string) => {
    const records = metrics.map(m => ({
      metric_name: m.metric_name,
      metric_value: m.metric_value,
      unit: m.unit,
      test_date: testDate,
      notes: null,
      source: 'file_upload',
    }));
    await addMultipleRecords(records);
    setParsedData(null);
  };

  if (loading || !user) return null;

  return (
    <div className="page-container">
      <Header />
      <main className="content-container space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Health Data</h1>
          <p className="text-muted-foreground mt-1">Upload files or enter data manually</p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          {parsedData ? (
            <ParsedDataPreview data={parsedData} onConfirm={handleConfirmImport} onCancel={() => setParsedData(null)} />
          ) : (
            <FileUploadZone onDataParsed={setParsedData} />
          )}
          <ManualEntryForm />
        </div>
      </main>
    </div>
  );
}
