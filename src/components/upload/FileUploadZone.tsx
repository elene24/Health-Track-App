import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom'; // Added for redirect
import { Upload, FileText, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useHealthRecords } from '@/hooks/useHealthRecords'; // Uses your new local hook

interface FileUploadZoneProps {
  onDataParsed: (data: any) => void;
}

export function FileUploadZone({ onDataParsed }: FileUploadZoneProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { uploadFile } = useHealthRecords(); // Connects to localhost:3000
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  }, []);

// Find this section in your FileUploadZone.tsx and modify it:
const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: {
    'text/plain': ['.txt'],      // Existing TXT support
    'application/pdf': ['.pdf'],  // ADD THIS LINE
  },
  maxFiles: 1,
});
  const processFile = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(30);

    try {
      // 1. Send to your local backend
      const records = await uploadFile(file);
      
      setProgress(100);
      
      toast({
        title: "Success!",
        description: "File processed and saved. Redirecting to records...",
      });

      // 2. Redirect to Records page to see the chart
      setTimeout(() => {
          navigate('/records');
      }, 1000);

    } catch (err) {
      console.error('Error processing file:', err);
      toast({
        title: "Connection Error",
        description: "Could not connect to backend. Is 'node server.js' running?",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const removeFile = () => {
    setFile(null);
    setProgress(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload Health Data
        </CardTitle>
        <CardDescription>
          Upload your blood test results (TXT or PDF files)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
              transition-all duration-200
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-1">
              {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse (.txt)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <FileText className="h-10 w-10 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              {!uploading && (
                <Button variant="ghost" size="icon" onClick={removeFile}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {uploading && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Sending to local backend...
                </p>
              </div>
            )}

            <Button 
              className="w-full btn-primary-gradient" 
              onClick={processFile}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Process
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}