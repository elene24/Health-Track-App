import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMMON_METRICS } from "@/lib/types";
import { useHealthRecords } from "@/hooks/useHealthRecords";
import { useToast } from "@/hooks/use-toast";

type ManualEntryFormProps = {
  userId?: string; // ✅ if provided => guest mode
};

export function ManualEntryForm({ userId }: ManualEntryFormProps) {
  const { addRecord } = useHealthRecords(userId);
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    metric_name: "",
    metric_value: "",
    unit: "",
    test_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Basic validation
    if (!form.metric_name) {
      toast({ title: "Missing metric", description: "Please select a metric.", variant: "destructive" });
      return;
    }
    if (form.metric_value === "" || Number.isNaN(Number(form.metric_value))) {
      toast({ title: "Missing value", description: "Please enter a numeric value.", variant: "destructive" });
      return;
    }
    if (!form.test_date) {
      toast({ title: "Missing date", description: "Please choose a test date.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const result = await addRecord({
      metric_name: form.metric_name,
      metric_value: Number(form.metric_value),
      unit: form.unit,
      test_date: form.test_date,
      notes: form.notes || null,
      source: "manual",
    });

    setLoading(false);

    if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      return;
    }

    toast({ title: "Saved", description: "Record added successfully." });

    // Reset form
    setForm({
      metric_name: "",
      metric_value: "",
      unit: "",
      test_date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Record Manually</CardTitle>
        <CardDescription>Enter health metrics manually</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Metric</Label>
            <Select
              value={form.metric_name}
              onValueChange={(v) => {
                const m = COMMON_METRICS.find((x) => x.name === v);
                setForm((f) => ({ ...f, metric_name: v, unit: m?.unit || f.unit || "" }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select metric" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_METRICS.map((m) => (
                  <SelectItem key={m.name} value={m.name}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Test Date</Label>
            <Input
              type="date"
              value={form.test_date}
              onChange={(e) => setForm((f) => ({ ...f, test_date: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Value</Label>
            <Input
              type="number"
              placeholder="Value"
              value={form.metric_value}
              onChange={(e) => setForm((f) => ({ ...f, metric_value: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Unit</Label>
            <Input
              placeholder="Unit"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Notes"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>

          <Button disabled={loading} className="w-full" type="submit">
            <Plus className="mr-2 h-4 w-4" />
            {loading ? "Saving..." : "Add Record"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}