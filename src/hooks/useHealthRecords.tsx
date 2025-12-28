import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface HealthRecord {
  id?: number;
  metric_name: string;
  metric_value: number;
  unit: string;
  test_date: string;
  user_id?: string;
}

export function useHealthRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`http://localhost:3000/records/${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRecords(data);
    } catch (error) {
      console.error("Error fetching records:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
      const data = await res.json();
      if (data.success) {
        await fetchRecords(); 
        return data.records;
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  const addMultipleRecords = async (newRecords: HealthRecord[]) => {
    if (!user) return;
    try {
      const res = await fetch('http://localhost:3000/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, records: newRecords })
      });
      if (res.ok) await fetchRecords();
    } catch (error) {
      console.error("Manual add error:", error);
    }
  };

  const getChartData = (metricName: string) => {
    return records
      .filter(r => r.metric_name === metricName)
      .sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime())
      .map(r => ({
        date: r.test_date,
        value: r.metric_value,
        unit: r.unit,
      }));
  };

  const metricNames = [...new Set(records.map(r => r.metric_name))];

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return { records, loading, uploadFile, addMultipleRecords, getChartData, metricNames };
}