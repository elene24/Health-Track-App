import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { FileUploadZone } from '@/components/upload/FileUploadZone';
import { ManualEntryForm } from '@/components/records/ManualEntryForm';
import { useAuth } from '@/hooks/useAuth';
import { ParsedHealthData } from '@/lib/types';

export default function Upload() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [parsedData, setParsedData] = useState<ParsedHealthData | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <div className="page-container">
      <Header />
      <main className="content-container grid lg:grid-cols-2 gap-8">
        {parsedData ? (
          <FileUploadZone onDataParsed={setParsedData} />
        ) : (
          <>
            <FileUploadZone onDataParsed={setParsedData} />
            <ManualEntryForm />
          </>
        )}
      </main>
    </div>
  );
}
