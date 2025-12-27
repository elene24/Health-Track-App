import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { COMMON_METRICS } from '@/lib/types';
import { useHealthRecords } from '@/hooks/useHealthRecords';

interface ManualEntryFormProps {
  onSuccess?: () => void;
}

export function ManualEntryForm({ onSuccess }: ManualEntryFormProps) {
  const { addRecord } = useHealthRecords();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    metric_name: '',
    metric_value: '',
    unit: '',
    test_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const handleMetricSelect = (metricName: string) => {
    const metric = COMMON_METRICS.find(m => m.name === metricName);
    setFormData(prev => ({
      ...prev,
      metric_name: metricName,
      unit: metric?.unit || prev.unit,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await addRecord({
      metric_name: formData.metric_name,
      metric_value: parseFloat(formData.metric_value),
      unit: formData.unit,
      test_date: formData.test_date,
      notes: formData.notes || null,
      source: 'manual',
    });

    setIsSubmitting(false);

    if (!error) {
      setFormData({
        metric_name: '',
        metric_value: '',
        unit: '',
        test_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
      onSuccess?.();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Add Record Manually
        </CardTitle>
        <CardDescription>
          Enter your health metrics manually
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="metric">Metric</Label>
              <Select value={formData.metric_name} onValueChange={handleMetricSelect}>
                <SelectTrigger className="input-health">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_METRICS.map(metric => (
                    <SelectItem key={metric.name} value={metric.name}>
                      {metric.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="test-date">Test Date</Label>
              <Input
                id="test-date"
                type="date"
                value={formData.test_date}
                onChange={(e) => setFormData(prev => ({ ...prev, test_date: e.target.value }))}
                className="input-health"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                type="number"
                step="any"
                placeholder="Enter value"
                value={formData.metric_value}
                onChange={(e) => setFormData(prev => ({ ...prev, metric_value: e.target.value }))}
                className="input-health"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                placeholder="e.g., mg/dL"
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className="input-health"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this test..."
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="resize-none"
              rows={2}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full btn-primary-gradient"
            disabled={isSubmitting || !formData.metric_name || !formData.metric_value || !formData.unit}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
