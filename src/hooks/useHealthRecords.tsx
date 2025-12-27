import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { HealthRecord } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useHealthRecords() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('health_records')
        .select('*')
        .eq('user_id', user.id)
        .order('test_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching health records:', err);
      setError('Failed to load health records');
      toast({
        title: "Error",
        description: "Failed to load health records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = async (record: Omit<HealthRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data, error } = await supabase
        .from('health_records')
        .insert({
          ...record,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setRecords(prev => [data, ...prev].sort((a, b) => 
        new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
      ));
      
      toast({
        title: "Success",
        description: "Health record added successfully",
      });
      
      return { data, error: null };
    } catch (err) {
      console.error('Error adding health record:', err);
      toast({
        title: "Error",
        description: "Failed to add health record",
        variant: "destructive",
      });
      return { error: err as Error };
    }
  };

  const addMultipleRecords = async (newRecords: Array<Omit<HealthRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const recordsWithUserId = newRecords.map(r => ({
        ...r,
        user_id: user.id,
      }));

      const { data, error } = await supabase
        .from('health_records')
        .insert(recordsWithUserId)
        .select();

      if (error) throw error;
      
      setRecords(prev => [...(data || []), ...prev].sort((a, b) => 
        new Date(b.test_date).getTime() - new Date(a.test_date).getTime()
      ));
      
      toast({
        title: "Success",
        description: `${data?.length || 0} health records imported successfully`,
      });
      
      return { data, error: null };
    } catch (err) {
      console.error('Error adding health records:', err);
      toast({
        title: "Error",
        description: "Failed to import health records",
        variant: "destructive",
      });
      return { error: err as Error };
    }
  };

  const updateRecord = async (id: string, updates: Partial<HealthRecord>) => {
    try {
      const { data, error } = await supabase
        .from('health_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setRecords(prev => prev.map(r => r.id === id ? data : r));
      
      toast({
        title: "Success",
        description: "Health record updated successfully",
      });
      
      return { data, error: null };
    } catch (err) {
      console.error('Error updating health record:', err);
      toast({
        title: "Error",
        description: "Failed to update health record",
        variant: "destructive",
      });
      return { error: err as Error };
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('health_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setRecords(prev => prev.filter(r => r.id !== id));
      
      toast({
        title: "Success",
        description: "Health record deleted successfully",
      });
      
      return { error: null };
    } catch (err) {
      console.error('Error deleting health record:', err);
      toast({
        title: "Error",
        description: "Failed to delete health record",
        variant: "destructive",
      });
      return { error: err as Error };
    }
  };

  // Get unique metric names from records
  const metricNames = [...new Set(records.map(r => r.metric_name))];

  // Get chart data for a specific metric
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

  return {
    records,
    loading,
    error,
    metricNames,
    fetchRecords,
    addRecord,
    addMultipleRecords,
    updateRecord,
    deleteRecord,
    getChartData,
  };
}
