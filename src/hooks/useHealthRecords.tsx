import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface HealthRecord {
  id?: number;
  metric_name: string;
  metric_value: number;
  unit: string;
  test_date: string;
  user_id?: string;
  notes?: string | null;
  source?: 'manual' | 'file_upload';
}

export function useHealthRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch(`http://localhost:3000/records/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch records');
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = async (record: HealthRecord) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const res = await fetch('http://localhost:3000/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, records: [record] }),
      });

      if (!res.ok) return { error: 'Failed to save record' };

      await fetchRecords();
      return { error: null };
    } catch (err) {
      console.error('Add record error:', err);
      return { error: 'Request failed' };
    }
  };

  const addMultipleRecords = async (recordsArray: HealthRecord[]) => {
    if (!user || recordsArray.length === 0) return;

    try {
      const res = await fetch('http://localhost:3000/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, records: recordsArray }),
      });

      if (res.ok) await fetchRecords();
    } catch (err) {
      console.error('Add multiple records error:', err);
    }
  };

  const uploadFile = async (file: File) => {
    if (!user) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', user.id);

    try {
      const res = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();

      // Optionally refresh records after successful upload
      await fetchRecords();
      return data;
    } catch (err) {
      console.error('Upload error:', err);
      return { error: 'Upload failed' };
    }
  };

  const getChartData = (metricName: string) =>
    records
      .filter(r => r.metric_name === metricName)
      .sort((a, b) => +new Date(a.test_date) - +new Date(b.test_date))
      .map(r => ({
        date: r.test_date,
        value: r.metric_value,
        unit: r.unit,
      }));

  const metricNames = [...new Set(records.map(r => r.metric_name))];

  return {
    records,
    loading,
    addRecord,
    addMultipleRecords,
    uploadFile,
    getChartData,
    metricNames,
  };
}
