import { useState } from 'react';
import { Check, X, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ParsedHealthData, ParsedMetric } from '@/lib/types';

interface ParsedDataPreviewProps {
  data: ParsedHealthData;
  onConfirm: (metrics: ParsedMetric[], testDate: string) => void;
  onCancel: () => void;
}

export function ParsedDataPreview({ data, onConfirm, onCancel }: ParsedDataPreviewProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<Set<number>>(
    new Set(data.metrics?.map((_, i) => i) || [])
  );
  const [testDate, setTestDate] = useState(
    data.test_date || new Date().toISOString().split('T')[0]
  );

  const toggleMetric = (index: number) => {
    const newSelected = new Set(selectedMetrics);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMetrics(newSelected);
  };

  const handleConfirm = () => {
    const metrics = data.metrics?.filter((_, i) => selectedMetrics.has(i)) || [];
    onConfirm(metrics, testDate);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Check className="h-5 w-5 text-success" />
          Extracted Health Data
        </CardTitle>
        <CardDescription>
          Review and confirm the extracted metrics before saving
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="test-date" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Test Date
          </Label>
          <Input
            id="test-date"
            type="date"
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            className="input-health max-w-xs"
          />
        </div>

        <div className="space-y-3">
          <Label>Extracted Metrics</Label>
          <div className="grid gap-2">
            {data.metrics?.map((metric, index) => (
              <div
                key={index}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-colors
                  ${selectedMetrics.has(index) 
                    ? 'border-primary/50 bg-primary/5' 
                    : 'border-border bg-muted/30'
                  }
                `}
              >
                <Checkbox
                  checked={selectedMetrics.has(index)}
                  onCheckedChange={() => toggleMetric(index)}
                />
                <div className="flex-1 flex items-center justify-between">
                  <span className="font-medium">{metric.metric_name}</span>
                  <span className="text-muted-foreground">
                    {metric.metric_value} {metric.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={onCancel}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button 
            className="flex-1 btn-primary-gradient"
            onClick={handleConfirm}
            disabled={selectedMetrics.size === 0}
          >
            <Check className="h-4 w-4 mr-2" />
            Save {selectedMetrics.size} Metrics
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
