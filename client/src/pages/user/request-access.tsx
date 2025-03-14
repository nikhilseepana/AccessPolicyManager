import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Form schema
const accessRequestSchema = z.object({
  schemaId: z.string().min(1, "Please select a schema"),
  tableId: z.string().min(1, "Please select a table"),
  effect: z.enum(["allow", "allowAll", "deny"]),
  fields: z.array(z.string()).optional(),
  reason: z.string().min(5, "Please provide a reason for your request"),
});

type AccessRequestFormValues = z.infer<typeof accessRequestSchema>;

export default function RequestAccess() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  
  // Fetch schemas
  const { data: schemas, isLoading: schemasLoading } = useQuery({
    queryKey: ['/api/schemas'],
    staleTime: 1000 * 60, // 1 minute
  });

  // Initialize form
  const form = useForm<AccessRequestFormValues>({
    resolver: zodResolver(accessRequestSchema),
    defaultValues: {
      schemaId: "",
      tableId: "",
      effect: "allow",
      fields: [],
      reason: "",
    }
  });

  // Watch form values to update UI
  const schemaId = form.watch('schemaId');
  const tableId = form.watch('tableId');
  const effect = form.watch('effect');

  // Fetch schema details when schema is selected
  const { data: schemaDetails, isLoading: tableLoading } = useQuery({
    queryKey: ['/api/schemas', schemaId],
    enabled: !!schemaId,
    staleTime: 1000 * 60, // 1 minute
  });

  // Get tables for selected schema
  const tables = schemaDetails?.tables || [];

  // Get fields for selected table
  const fields = tables.find((t: any) => t.id.toString() === tableId)?.fields || [];

  // Create access request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/access-requests', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/access-requests'] });
      form.reset();
      setSelectedFields([]);
      toast({
        title: 'Access request submitted',
        description: 'Your request has been submitted for approval.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to submit request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: AccessRequestFormValues) => {
    // Prepare request data
    const requestData = {
      schemaId: parseInt(data.schemaId),
      reason: data.reason,
      items: [
        {
          tableId: parseInt(data.tableId),
          effect: data.effect,
          fields: data.effect === 'allowAll' ? [] : selectedFields
        }
      ]
    };
    
    createRequestMutation.mutate(requestData);
  };

  // Handle field selection
  const handleFieldCheck = (fieldName: string, checked: boolean) => {
    if (checked) {
      setSelectedFields(prev => [...prev, fieldName]);
    } else {
      setSelectedFields(prev => prev.filter(f => f !== fieldName));
    }
  };

  // Handle select all fields
  const handleSelectAllFields = () => {
    const allFieldNames = fields.map((field: any) => field.name);
    setSelectedFields(allFieldNames);
  };

  // Update form value when selectedFields changes
  useEffect(() => {
    form.setValue('fields', selectedFields);
  }, [selectedFields]);

  // Clear fields when effect changes to allowAll
  useEffect(() => {
    if (effect === 'allowAll') {
      setSelectedFields([]);
    }
  }, [effect]);

  // Clear table and fields when schema changes
  useEffect(() => {
    if (schemaId) {
      form.setValue('tableId', '');
      setSelectedFields([]);
    }
  }, [schemaId]);

  // Clear fields when table changes
  useEffect(() => {
    if (tableId) {
      setSelectedFields([]);
    }
  }, [tableId]);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium">Request New Access</h2>
      </div>
      
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="schemaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select Schema</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={schemasLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a schema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {schemas && schemas.map((schema: any) => (
                        <SelectItem key={schema.id} value={schema.id.toString()}>
                          {schema.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {schemaId && (
              <FormField
                control={form.control}
                name="tableId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Table</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={tableLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a table" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tables.map((table: any) => (
                          <SelectItem key={table.id} value={table.id.toString()}>
                            {table.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {tableId && (
              <>
                <FormField
                  control={form.control}
                  name="effect"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="allowAll" />
                            </FormControl>
                            <FormLabel className="cursor-pointer">AllowAll</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="allow" />
                            </FormControl>
                            <FormLabel className="cursor-pointer">Allow</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="deny" />
                            </FormControl>
                            <FormLabel className="cursor-pointer">Deny</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {effect !== 'allowAll' && fields.length > 0 && (
                  <FormField
                    control={form.control}
                    name="fields"
                    render={() => (
                      <FormItem>
                        <FormLabel>Select Fields</FormLabel>
                        <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                          <div className="flex justify-end mb-2">
                            <Button
                              type="button"
                              variant="link"
                              className="p-0 h-auto"
                              onClick={handleSelectAllFields}
                            >
                              Select All
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {fields.map((field: any) => (
                              <div key={field.id} className="flex items-start">
                                <Checkbox
                                  id={`field-${field.id}`}
                                  checked={selectedFields.includes(field.name)}
                                  onCheckedChange={(checked) => 
                                    handleFieldCheck(field.name, checked as boolean)
                                  }
                                />
                                <label
                                  htmlFor={`field-${field.id}`}
                                  className="ml-2 text-sm text-gray-700"
                                >
                                  {field.name} ({field.dataType})
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Reason</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please explain why you need access to these resources..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setSelectedFields([]);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    type="submit"
                    disabled={createRequestMutation.isPending}
                  >
                    {createRequestMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}
