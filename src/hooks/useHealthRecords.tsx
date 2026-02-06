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

  // Fetch records from backend
  const fetchRecords = useCallback(async () => {
    if (!user) return;

    setLoading(true);
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

  // Add a single record
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

  // Add multiple records
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

  // Upload file
const uploadFile = async (file: File) => {
  if (!user) return { error: 'Not authenticated' };

  const formData = new FormData();
  formData.append('file', file);
  formData.append('userId', user.id);

  try {
    const res = await fetch('http://localhost:3000/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json().catch(() => ({}));

    // 🔍 DEBUG
    console.log('UPLOAD status:', res.status);
    console.log('UPLOAD response:', data);

    if (!res.ok) {
      return { error: data?.error || 'Upload failed', ...data };
    }

    await fetchRecords();
    return data; // { success:true, records:[...] }
  } catch (err) {
    console.error('Upload error:', err);
    return { error: 'Upload failed' };
  }
};


  // Update a record
  const updateRecord = async (id: number | string, updatedFields: Partial<HealthRecord>) => {
    try {
      const res = await fetch(`http://localhost:3000/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) throw new Error('Failed to update record');
      await fetchRecords();
    } catch (err) {
      console.error('Update record error:', err);
    }
  };

  // Delete a record
  const deleteRecord = async (id: number | string) => {
    try {
      const res = await fetch(`http://localhost:3000/records/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete record');
      await fetchRecords();
    } catch (err) {
      console.error('Delete record error:', err);
    }
  };

  // Get chart data for a specific metric
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
    updateRecord,
    deleteRecord,
    getChartData,
    metricNames,
  };
}
