import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Database, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SchemaAccordionProps {
  schemas: any[];
}

export default function SchemaAccordion({ schemas }: SchemaAccordionProps) {
  const [expandedSchemas, setExpandedSchemas] = useState<Record<string, boolean>>({});
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  // Get tables query
  const { data: tables } = useQuery({
    queryKey: ['/api/tables'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get fields query
  const { data: fields } = useQuery({
    queryKey: ['/api/fields'],
    staleTime: 1000 * 60 * 5,
  });

  const toggleSchema = (schemaId: number) => {
    setExpandedSchemas(prev => ({
      ...prev,
      [schemaId]: !prev[schemaId]
    }));
  };

  const toggleTable = (tableId: number) => {
    setExpandedTables(prev => ({
      ...prev,
      [tableId]: !prev[tableId]
    }));
  };

  const getTablesForSchema = (schemaId: number) => {
    if (!tables) return [];
    return tables.filter((table: any) => table.schemaId === schemaId) || [];
  };

  const getFieldsForTable = (tableId: number) => {
    if (!fields) return [];
    return fields.filter((field: any) => field.tableId === tableId) || [];
  };

  return (
    <div className="divide-y divide-gray-200">
      {schemas.map((schema) => (
        <div key={schema.id} className="bg-white">
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
              <div className="border border-gray-200 rounded-md overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                  Tables
                </div>
                <div className="divide-y divide-gray-200">
                  {getTablesForSchema(schema.id).map((table: any) => (
                    <div key={table.id} className="bg-white">
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
                          <div className="text-xs font-medium text-gray-500 uppercase mb-2">Fields</div>
                          <div className="grid grid-cols-3 gap-2">
                            {getFieldsForTable(table.id).map((field: any) => (
                              <div key={field.id} className="text-sm">
                                <span className="font-medium">{field.name}</span>
                                <span className="text-gray-500 ml-1">({field.dataType})</span>
                              </div>
                            ))}
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