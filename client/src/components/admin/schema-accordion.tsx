import { useState } from 'react';
import { ChevronDown, ChevronUp, Database, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

interface SchemaAccordionProps {
  schemas: any[];
}

export default function SchemaAccordion({ schemas }: SchemaAccordionProps) {
  const [expandedSchemas, setExpandedSchemas] = useState<Record<string, boolean>>({});
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  // Get schema details with tables and fields
  const { data: schemaDetails } = useQuery({
    queryKey: ['/api/schemas'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get tables
  const { data: tables } = useQuery({
    queryKey: ['/api/tables'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Toggle schema expansion
  const toggleSchema = (schemaId: number) => {
    setExpandedSchemas(prev => ({
      ...prev,
      [schemaId]: !prev[schemaId]
    }));
  };

  // Toggle table expansion
  const toggleTable = (tableId: number) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableId]: !prev[tableId]
    }));
  };

  // Get tables for schema
  const getTablesForSchema = (schemaId: number) => {
    if (!tables) return [];
    return tables.filter((table: any) => table.schemaId === schemaId) || [];
  };

  // Get fields for table
  const getFieldsForTable = (tableId: number) => {
    if (!getSchemaDetails.data) return [];
    
    let fields: any[] = [];
    getSchemaDetails.data.forEach((schema: any) => {
      if (schema.tables) {
        const table = schema.tables.find((t: any) => t.id === tableId);
        if (table && table.fields) {
          fields = table.fields;
        }
      }
    });
    
    return fields;
  };

  return (
    <div className="divide-y divide-gray-200">
      {schemas.map((schema) => (
        <div key={schema.id}>
          <Button
            variant="ghost"
            className="w-full py-3 flex items-center justify-between"
            onClick={() => toggleSchema(schema.id)}
          >
            <div className="flex items-center">
              <Database className="text-primary mr-2 h-5 w-5" />
              <span className="font-medium">{schema.name}</span>
            </div>
            {expandedSchemas[schema.id] ? (
              <ChevronUp className="text-gray-400 h-4 w-4" />
            ) : (
              <ChevronDown className="text-gray-400 h-4 w-4" />
            )}
          </Button>
          
          {expandedSchemas[schema.id] && (
            <div className="pb-3 pl-8">
              <div className="border border-gray-200 rounded overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                  Tables
                </div>
                <div className="divide-y divide-gray-200">
                  {getTablesForSchema(schema.id).map((table: any) => (
                    <div key={table.id}>
                      <Button
                        variant="ghost"
                        className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50"
                        onClick={() => toggleTable(table.id)}
                      >
                        <span className="text-sm font-medium">{table.name}</span>
                        {expandedTables[table.id] ? (
                          <ChevronUp className="text-gray-400 h-4 w-4" />
                        ) : (
                          <ChevronDown className="text-gray-400 h-4 w-4" />
                        )}
                      </Button>
                      
                      {expandedTables[table.id] && (
                        <div className="px-4 py-2 bg-gray-50">
                          <div className="text-xs font-medium text-gray-500 uppercase mb-1">Fields</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {getFieldsForTable(table.id).map((field: any) => (
                              <div key={field.id}>
                                {field.name} ({field.dataType})
                              </div>
                            ))}
                            
                            {getFieldsForTable(table.id).length === 0 && (
                              <div className="col-span-2 text-gray-500 text-sm flex items-center">
                                <FileText className="h-4 w-4 mr-1" />
                                No fields available
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {getTablesForSchema(schema.id).length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No tables available
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
