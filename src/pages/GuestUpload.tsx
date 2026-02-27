import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUploadZone } from "@/components/upload/FileUploadZone";
import { ManualEntryForm } from "@/components/records/ManualEntryForm";
import { Button } from "@/components/ui/button";
import type { HealthRecord } from "@/lib/types";

export default function GuestUpload() {
  const navigate = useNavigate();
  const [uploadedRecords, setUploadedRecords] = useState<HealthRecord[] | null>(null);

  const guestUserId = localStorage.getItem("guestUserId");
  const guestEmail = localStorage.getItem("guestEmail");

  useEffect(() => {
    if (!guestUserId) navigate("/access");
  }, [guestUserId, navigate]);

  const exitGuest = () => {
    localStorage.removeItem("guestUserId");
    localStorage.removeItem("guestEmail");
    navigate("/");
  };

  if (!guestUserId) return null;

  return (
    <div className="page-container">
      <main className="content-container space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Guest mode{guestEmail ? ` • ${guestEmail}` : ""}
          </div>
          <Button variant="outline" onClick={exitGuest}>
            Exit guest mode
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <FileUploadZone userId={guestUserId} onDataParsed={setUploadedRecords} />

            {uploadedRecords && (
              <div className="rounded-xl border border-border bg-card p-4 text-sm">
                ✅ Uploaded <b>{uploadedRecords.length}</b>{" "}
                record{uploadedRecords.length === 1 ? "" : "s"} successfully.
              </div>
            )}
          </div>

          <ManualEntryForm userId={guestUserId} />
        </div>
      </main>
    </div>
  );
}