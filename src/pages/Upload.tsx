import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { FileUploadZone } from "@/components/upload/FileUploadZone";
import { ManualEntryForm } from "@/components/records/ManualEntryForm";
import { useAuth } from "@/hooks/useAuth";
import type { HealthRecord } from "@/lib/types";

export default function Upload() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // ✅ FileUploadZone returns HealthRecord[]
  const [uploadedRecords, setUploadedRecords] = useState<HealthRecord[] | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <div className="page-container">
      <Header />
      <main className="content-container grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <FileUploadZone onDataParsed={setUploadedRecords} />

          {uploadedRecords && (
            <div className="rounded-xl border border-border bg-card p-4 text-sm">
              ✅ Uploaded <b>{uploadedRecords.length}</b>{" "}
              record{uploadedRecords.length === 1 ? "" : "s"} successfully.
            </div>
          )}
        </div>

        <ManualEntryForm />
      </main>
    </div>
  );
}