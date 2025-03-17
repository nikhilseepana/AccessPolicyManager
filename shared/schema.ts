import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  json,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// User schema
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Effect enum for access policies
export const effectEnum = pgEnum('effect', ['allow', 'deny', 'allowAll']);

// Schema dictionary (metadata from database)
export const schemas = pgTable('schemas', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Modify the insertSchemaSchema to better match SchemaUpload expectations
export const insertSchemaSchema = createInsertSchema(schemas)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    description: z.string().nullable().optional(),
  });

// Tables within schemas
export const tables = pgTable('tables', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  schemaId: integer('schema_id')
    .notNull()
    .references(() => schemas.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertTableSchema = createInsertSchema(tables).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Fields within tables
export const fields = pgTable('fields', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  dataType: text('data_type').notNull(),
  description: text('description'),
  tableId: integer('table_id')
    .notNull()
    .references(() => tables.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertFieldSchema = createInsertSchema(fields).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Access requests
export const requestStatus = pgEnum('request_status', ['pending', 'approved', 'rejected']);

export const accessRequests = pgTable('access_requests', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  schemaId: integer('schema_id')
    .notNull()
    .references(() => schemas.id),
  reason: text('reason'),
  status: requestStatus('status').notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertAccessRequestSchema = createInsertSchema(accessRequests).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

// Access request items (for each table/field combination)
export const accessRequestItems = pgTable('access_request_items', {
  id: serial('id').primaryKey(),
  requestId: integer('request_id')
    .notNull()
    .references(() => accessRequests.id),
  tableId: integer('table_id')
    .notNull()
    .references(() => tables.id),
  effect: effectEnum('effect').notNull(),
  fields: json('fields').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertAccessRequestItemSchema = createInsertSchema(accessRequestItems).omit({
  id: true,
  createdAt: true,
});

// User access policies
export const accessPolicies = pgTable('access_policies', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  schemaId: integer('schema_id')
    .notNull()
    .references(() => schemas.id),
  tableId: integer('table_id')
    .notNull()
    .references(() => tables.id),
  effect: effectEnum('effect').notNull(),
  fields: json('fields').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const insertAccessPolicySchema = createInsertSchema(accessPolicies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Notifications
export const notificationTypes = pgEnum('notification_type', [
  'request_approved',
  'request_rejected',
  'new_request',
]);

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  type: notificationTypes('type').notNull(),
  message: text('message').notNull(),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  read: true,
  createdAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Schema = typeof schemas.$inferSelect;
export type InsertSchema = z.infer<typeof insertSchemaSchema>;
export type Table = typeof tables.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;
export type Field = typeof fields.$inferSelect;
export type InsertField = z.infer<typeof insertFieldSchema>;
export type AccessRequest = typeof accessRequests.$inferSelect;
export type InsertAccessRequest = z.infer<typeof insertAccessRequestSchema>;
export type AccessRequestItem = typeof accessRequestItems.$inferSelect;
export type InsertAccessRequestItem = z.infer<typeof insertAccessRequestItemSchema>;
export type AccessPolicy = typeof accessPolicies.$inferSelect;
export type InsertAccessPolicy = z.infer<typeof insertAccessPolicySchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Custom zod schemas for validations
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof loginSchema>;

export const registerSchema = insertUserSchema
  .extend({
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// For consistency, update the SchemaUpload validation schema
export const schemaUploadSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  tables: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().nullable().optional(),
      fields: z.array(
        z.object({
          name: z.string().min(1),
          dataType: z.string().min(1),
          description: z.string().nullable().optional(),
        })
      ),
    })
  ),
});

// This ensures a consistent type definition that better matches how it's used
export type SchemaUpload = z.infer<typeof schemaUploadSchema>;
