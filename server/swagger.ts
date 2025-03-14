
import { OpenAPIV3 } from 'openapi-types';

export const swaggerDocument: OpenAPIV3.Document = {
  openapi: '3.0.0',
  info: {
    title: 'Database Access Management API',
    version: '1.0.0',
    description: 'API for managing database schema access requests and permissions'
  },
  servers: [
    {
      url: '/api',
      description: 'API endpoint'
    }
  ],
  paths: {
    '/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'user@example.com' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Login successful'
          }
        }
      }
    },
    '/schemas': {
      get: {
        tags: ['Schemas'],
        summary: 'Get all schemas',
        security: [{ cookieAuth: [] }],
        responses: {
          '200': {
            description: 'List of schemas'
          }
        }
      },
      post: {
        tags: ['Schemas'],
        summary: 'Create new schema (admin only)',
        security: [{ cookieAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Sales' },
                  description: { type: 'string', example: 'Sales department schema' },
                  tables: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', example: 'Customers' },
                        fields: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string', example: 'customer_id' },
                              dataType: { type: 'string', example: 'integer' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Schema created'
          }
        }
      }
    },
    '/access-requests': {
      post: {
        tags: ['Access Requests'],
        summary: 'Create access request',
        security: [{ cookieAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  schemaId: { type: 'number', example: 1 },
                  reason: { type: 'string', example: 'Need access for reporting' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Access request created'
          }
        }
      }
    },
    '/access-requests/{id}': {
      patch: {
        tags: ['Access Requests'],
        summary: 'Update request status (admin only)',
        security: [{ cookieAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer'
            }
          }
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { 
                    type: 'string',
                    enum: ['approved', 'rejected'],
                    example: 'approved'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Request status updated'
          }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'connect.sid'
      }
    }
  }
};
