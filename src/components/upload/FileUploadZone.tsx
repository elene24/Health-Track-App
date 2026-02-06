import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHealthRecords, HealthRecord } from '@/hooks/useHealthRecords';
import { useToast } from '@/hooks/use-toast';

interface FileUploadZoneProps {
  onDataParsed: (data: HealthRecord[]) => void;
}

export function FileUploadZone({ onDataParsed }: FileUploadZoneProps) {
  const { uploadFile } = useHealthRecords();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((files: File[]) => {
    setFile(files?.[0] ?? null);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'text/plain': ['.txt'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    try {
      const result: any = await uploadFile(file);

      // 🔍 DEBUG: inspect what uploadFile actually returned
      console.log('uploadFile result:', result);

      // If hook returned an error object
      if (result && typeof result === 'object' && 'error' in result) {
        toast({
          title: 'Error',
          description: String(result.error),
          variant: 'destructive',
        });
        return;
      }

      // Expect backend response: { success: true, records: [...] }
      const records: HealthRecord[] = result?.records ?? [];

      if (records.length === 0) {
        toast({
          title: 'Error',
          description: 'No data found in file',
          variant: 'destructive',
        });
        return;
      }

      onDataParsed(records);

      toast({
        title: 'Success',
        description: `Added ${records.length} record${records.length === 1 ? '' : 's'}`,
      });

      setFile(null);
    } catch (err: any) {
      console.error('Upload threw error:', err);

      toast({
        title: 'Error',
        description: err?.message || 'Upload failed',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Health Data</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div {...getRootProps()} className="border-dashed border p-8 text-center cursor-pointer">
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-2" />
            Drag & drop TXT or PDF
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <FileText /> {file.name}
            </div>
            <Button onClick={handleUpload} disabled={loading} className="w-full">
              {loading ? <Loader2 className="animate-spin" /> : 'Upload & Process'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
