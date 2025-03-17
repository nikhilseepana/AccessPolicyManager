import { ExpandMore as ExpandMoreIcon, Storage as DatabaseIcon } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { useState } from 'react';

interface Field {
  id: number;
  name: string;
  dataType: string;
  tableId: number;
  createdAt: string;
  updatedAt: string;
}

interface Table {
  id: number;
  name: string;
  schemaId: number;
  createdAt: string;
  updatedAt: string;
  fields: Field[];
}

interface Schema {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  tables: Table[];
}

// Simplified schema interface for initial data
interface MinimalSchema {
  id: number;
  name: string;
  tables?: Table[]; // Optional, might be loaded later
}

interface SchemaAccordionProps {
  schemas: MinimalSchema[]; // This is now required and simpler
}

export default function SchemaAccordion({ schemas: initialSchemas }: SchemaAccordionProps) {
  const [expandedSchemas, setExpandedSchemas] = useState<Record<string, boolean>>({});
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});
  const [loadedSchemaIds, setLoadedSchemaIds] = useState<Set<number>>(new Set());
  const [fullSchemas, setFullSchemas] = useState<Record<number, Schema>>({});

  const toggleSchema = async (schemaId: number) => {
    // If already loaded or collapsed, just toggle visibility
    if (loadedSchemaIds.has(schemaId) || expandedSchemas[schemaId]) {
      setExpandedSchemas((prev) => ({
        ...prev,
        [schemaId]: !prev[schemaId],
      }));
      return;
    }

    // If expanding and not loaded, fetch the full schema
    try {
      const response = await fetch(`/api/schemas/${schemaId}`);
      if (!response.ok) throw new Error('Failed to fetch schema');

      const fullSchema = await response.json();

      // Store the full schema
      setFullSchemas((prev) => ({
        ...prev,
        [schemaId]: fullSchema,
      }));

      // Mark as loaded
      setLoadedSchemaIds((prev) => new Set(prev).add(schemaId));

      // Expand the schema
      setExpandedSchemas((prev) => ({
        ...prev,
        [schemaId]: true,
      }));
    } catch (err) {
      console.error('Error fetching schema:', err);
    }
  };

  const toggleTable = (tableId: number) => {
    setExpandedTables((prev) => ({
      ...prev,
      [tableId]: !prev[tableId],
    }));
  };

  return (
    <Paper elevation={0} variant="outlined">
      {initialSchemas.map((schema) => {
        const displaySchema = loadedSchemaIds.has(schema.id) ? fullSchemas[schema.id] : schema;

        return (
          <div key={schema.id}>
            <Accordion
              expanded={!!expandedSchemas[schema.id]}
              onChange={() => toggleSchema(schema.id)}
              disableGutters
              elevation={0}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`schema-${schema.id}-content`}
                id={`schema-${schema.id}-header`}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DatabaseIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="subtitle1">{schema.name}</Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails sx={{ pl: 4 }}>
                {loadedSchemaIds.has(schema.id) ? (
                  <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                    <Box sx={{ bgcolor: 'grey.100', px: 2, py: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 'medium', textTransform: 'uppercase' }}
                      >
                        Tables
                      </Typography>
                    </Box>

                    <Divider />

                    {displaySchema.tables && displaySchema.tables.length > 0 ? (
                      displaySchema.tables.map((table) => (
                        <Box key={table.id}>
                          <Accordion
                            disableGutters
                            elevation={0}
                            expanded={!!expandedTables[table.id]}
                            onChange={() => toggleTable(table.id)}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreIcon />}
                              aria-controls={`table-${table.id}-content`}
                              id={`table-${table.id}-header`}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {table.name}
                              </Typography>
                            </AccordionSummary>

                            <AccordionDetails sx={{ bgcolor: 'grey.50', px: 2, py: 1 }}>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 'medium', textTransform: 'uppercase', mb: 1 }}
                              >
                                Fields
                              </Typography>

                              <Grid container spacing={2}>
                                {table.fields && table.fields.length > 0 ? (
                                  table.fields.map((field) => (
                                    <Grid item xs={4} key={field.id}>
                                      <Typography variant="body2" component="div">
                                        <Box component="span" sx={{ fontWeight: 'medium' }}>
                                          {field.name}
                                        </Box>
                                        <Box
                                          component="span"
                                          sx={{ color: 'text.secondary', ml: 0.5 }}
                                        >
                                          ({field.dataType})
                                        </Box>
                                      </Typography>
                                    </Grid>
                                  ))
                                ) : (
                                  <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">
                                      No fields available
                                    </Typography>
                                  </Grid>
                                )}
                              </Grid>
                            </AccordionDetails>
                          </Accordion>
                          <Divider />
                        </Box>
                      ))
                    ) : (
                      <Box sx={{ px: 2, py: 1.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          No tables available
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                ) : (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}
                  >
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    <Typography>Loading schema details...</Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
            <Divider />
          </div>
        );
      })}
    </Paper>
  );
}
