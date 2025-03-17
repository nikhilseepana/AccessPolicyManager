import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Upload, Database } from 'lucide-react';
import { useState, useRef } from 'react';

import SchemaAccordion from '@/components/admin/schema-accordion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function AdminSchema() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [schemaFile, setSchemaFile] = useState<File | null>(null);

  // Fetch schemas
  const { data: schemas, isLoading } = useQuery({
    queryKey: ['/api/schemas'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Upload schema mutation
  const uploadSchemaMutation = useMutation({
    mutationFn: async (schemaData: any) => {
      return await apiRequest({ method: 'POST', path: '/api/schemas', data: schemaData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schemas'] });
      setSchemaFile(null);
      toast({
        title: 'Schema uploaded',
        description: 'The database schema metadata has been successfully uploaded.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to upload schema',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSchemaFile(e.target.files[0]);
    }
  };

  // Handle file upload button click
  const handleTriggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // Handle schema upload
  const handleUploadSchema = async () => {
    if (!schemaFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a JSON file to upload.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const schemaData = JSON.parse(event.target?.result as string);
          uploadSchemaMutation.mutate(schemaData);
        } catch (error) {
          toast({
            title: 'Invalid JSON file',
            description: 'Please ensure the file contains valid JSON data.',
            variant: 'destructive',
          });
        }
      };
      reader.readAsText(schemaFile);
    } catch (error) {
      toast({
        title: 'Error reading file',
        description: 'An error occurred while reading the file.',
        variant: 'destructive',
      });
    }
  };

  // Format last updated date
  const formatLastUpdated = (date: string) => {
    if (!date) return 'Never';

    const now = new Date();
    const updated = new Date(date);
    const diffInHours = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Get last updated schema date
  const getLastUpdatedDate = () => {
    if (!schemas || schemas.length === 0) return 'Never';

    const dates = schemas.map((schema) => new Date(schema.updatedAt));
    const mostRecent = new Date(Math.max(...dates.map((d) => d.getTime())));

    return formatLastUpdated(mostRecent.toISOString());
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div className="col-span-1">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium mb-4">Upload Schema Metadata</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload the latest data dictionary to update schema, table, and field metadata.
          </p>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                setSchemaFile(e.dataTransfer.files[0]);
              }
            }}
          >
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-2">
              {schemaFile ? schemaFile.name : 'Drag and drop a JSON file here, or click to browse'}
            </p>
            <p className="text-xs text-gray-400">Supports JSON format only</p>
            <input
              type="file"
              className="hidden"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
            />
            <Button variant="outline" className="mt-4" onClick={handleTriggerFileUpload}>
              Browse Files
            </Button>
          </div>
          <div className="mt-6">
            <Button
              className="w-full"
              onClick={handleUploadSchema}
              disabled={!schemaFile || uploadSchemaMutation.isPending}
            >
              {uploadSchemaMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload Schema'
              )}
            </Button>
          </div>
        </div>
      </div>
      <div className="col-span-2">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Current Database Schemas</h3>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Last updated:</span>
              <span className="text-sm font-medium">{getLastUpdatedDate()}</span>
            </div>
          </div>

          {schemas && schemas.length > 0 ? (
            <SchemaAccordion schemas={schemas} />
          ) : (
            <div className="text-center p-8 text-gray-500">
              <Database className="mx-auto h-12 w-12 text-gray-300 mb-2" />
              <p>No schemas available</p>
              <p className="text-sm mt-1">Upload a schema to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
