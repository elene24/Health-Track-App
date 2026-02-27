import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import type { HealthRecord } from "@/lib/types";

export function useHealthRecords(userIdOverride?: string) {
  const { user } = useAuth();
  const activeUserId = userIdOverride || user?.id;

  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = useCallback(async () => {
    if (!activeUserId) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/records/${activeUserId}`);
      if (!res.ok) throw new Error("Failed to fetch records");
      const data: HealthRecord[] = await res.json();
      setRecords(data);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const addRecord = async (record: Omit<HealthRecord, "id" | "user_id" | "created_at" | "updated_at">) => {
    if (!activeUserId) return { error: "Missing userId" };

    try {
      const res = await fetch("http://localhost:3000/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeUserId, records: [record] }),
      });

      if (!res.ok) return { error: "Failed to save record" };
      await fetchRecords();
      return { error: null };
    } catch (err) {
      console.error("Add record error:", err);
      return { error: "Request failed" };
    }
  };

  const addMultipleRecords = async (recordsArray: Array<Omit<HealthRecord, "id" | "user_id" | "created_at" | "updated_at">>) => {
    if (!activeUserId || recordsArray.length === 0) return;

    try {
      const res = await fetch("http://localhost:3000/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: activeUserId, records: recordsArray }),
      });

      if (res.ok) await fetchRecords();
    } catch (err) {
      console.error("Add multiple records error:", err);
    }
  };

  const uploadFile = async (file: File) => {
    if (!activeUserId) return { error: "Missing userId" };

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", activeUserId);

    try {
      const res = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        return { error: data?.error || "Upload failed", ...data };
      }

      await fetchRecords();
      return data;
    } catch (err) {
      console.error("Upload error:", err);
      return { error: "Upload failed" };
    }
  };

  const updateRecord = async (
    id: number,
    updatedFields: Partial<Pick<HealthRecord, "metric_value" | "metric_name" | "unit" | "test_date" | "notes">>
  ) => {
    try {
      const res = await fetch(`http://localhost:3000/records/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) throw new Error("Failed to update record");
      await fetchRecords();
    } catch (err) {
      console.error("Update record error:", err);
    }
  };

  const deleteRecord = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:3000/records/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete record");
      await fetchRecords();
    } catch (err) {
      console.error("Delete record error:", err);
    }
  };

  const metricNames = [...new Set(records.map((r) => r.metric_name))];

  return {
    records,
    loading,
    addRecord,
    addMultipleRecords,
    uploadFile,
    updateRecord,
    deleteRecord,
    metricNames,
    refetch: fetchRecords,
  };
}