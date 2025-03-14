import { 
  User, InsertUser, Schema, InsertSchema, Table, InsertTable, 
  Field, InsertField, AccessRequest, InsertAccessRequest, 
  AccessRequestItem, InsertAccessRequestItem, AccessPolicy, 
  InsertAccessPolicy, Notification, InsertNotification,
  SchemaUpload
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage operations
export interface IStorage {
  // Session store
  sessionStore: any; // Express session store
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getAdminUsers(): Promise<User[]>;
  
  // Schema operations
  getAllSchemas(): Promise<Schema[]>;
  getSchema(id: number): Promise<Schema | undefined>;
  createSchema(schemaData: SchemaUpload): Promise<Schema>;
  getSchemaWithTablesAndFields(id: number): Promise<any | undefined>;
  
  // Table operations
  getTable(id: number): Promise<Table | undefined>;
  getTablesBySchema(schemaId: number): Promise<Table[]>;
  createTable(table: InsertTable): Promise<Table>;
  
  // Field operations
  getField(id: number): Promise<Field | undefined>;
  getFieldsByTable(tableId: number): Promise<Field[]>;
  createField(field: InsertField): Promise<Field>;
  
  // Access request operations
  createAccessRequest(request: InsertAccessRequest): Promise<AccessRequest>;
  getAccessRequest(id: number): Promise<AccessRequest | undefined>;
  getAllAccessRequests(): Promise<AccessRequest[]>;
  getUserAccessRequests(userId: number): Promise<AccessRequest[]>;
  updateAccessRequestStatus(id: number, status: string): Promise<AccessRequest | undefined>;
  getAccessRequestWithItems(id: number): Promise<any | undefined>;
  
  // Access request item operations
  createAccessRequestItem(item: InsertAccessRequestItem): Promise<AccessRequestItem>;
  getAccessRequestItems(requestId: number): Promise<AccessRequestItem[]>;
  
  // Access policy operations
  createAccessPolicy(policy: InsertAccessPolicy): Promise<AccessPolicy>;
  getUserAccessPolicies(userId: number): Promise<AccessPolicy[]>;
  getAllAccessPolicies(): Promise<AccessPolicy[]>;
  checkPolicyConflict(userId: number, schemaId: number, tableId: number, effect: string, fields: string[]): Promise<boolean>;
  copyUserAccessPolicies(sourceUserId: number, targetUserId: number, replaceExisting: boolean): Promise<void>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotification(id: number): Promise<Notification | undefined>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private schemas: Map<number, Schema>;
  private tables: Map<number, Table>;
  private fields: Map<number, Field>;
  private accessRequests: Map<number, AccessRequest>;
  private accessRequestItems: Map<number, AccessRequestItem>;
  private accessPolicies: Map<number, AccessPolicy>;
  private notifications: Map<number, Notification>;
  sessionStore: any; // Express session store
  
  private userIdCounter: number = 1;
  private schemaIdCounter: number = 1;
  private tableIdCounter: number = 1;
  private fieldIdCounter: number = 1;
  private requestIdCounter: number = 1;
  private requestItemIdCounter: number = 1;
  private policyIdCounter: number = 1;
  private notificationIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.schemas = new Map();
    this.tables = new Map();
    this.fields = new Map();
    this.accessRequests = new Map();
    this.accessRequestItems = new Map();
    this.accessPolicies = new Map();
    this.notifications = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Initialize sample data
    this.initializeSampleData();
  }

  private async initializeSampleData() {
    const now = new Date();

    // Create admin user
    const adminId = this.userIdCounter++;
    const adminUser: User = {
      id: adminId,
      email: "admin@example.com",
      password: "admin123",
      role: "admin",
      createdAt: now
    };
    this.users.set(adminId, adminUser);
    console.log("Admin user created with email: admin@example.com and password: admin123");

    // Create sample users
    const sampleUsers = [
      { email: "sales_user@example.com", password: "password123", role: "user" },
      { email: "finance_user@example.com", password: "password123", role: "user" },
      { email: "hr_user@example.com", password: "password123", role: "user" },
      { email: "manager@example.com", password: "password123", role: "user" }
    ];

    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = await this.createUser(userData);
      createdUsers.push(user);
    }

    // Create sample schemas
    const schemas = [
      {
        name: "Sales",
        description: "Sales department database schema",
        tables: [
          {
            name: "Customers",
            description: "Customer information table",
            fields: [
              { name: "customer_id", dataType: "integer", description: "Primary key" },
              { name: "name", dataType: "text", description: "Customer full name" },
              { name: "email", dataType: "text", description: "Customer email address" },
              { name: "phone", dataType: "text", description: "Customer phone number" },
              { name: "address", dataType: "text", description: "Customer address" },
              { name: "created_at", dataType: "timestamp", description: "Record creation date" }
            ]
          },
          {
            name: "Orders",
            description: "Customer orders data",
            fields: [
              { name: "order_id", dataType: "integer", description: "Primary key" },
              { name: "customer_id", dataType: "integer", description: "Foreign key to Customers" },
              { name: "order_date", dataType: "date", description: "Date of order" },
              { name: "total_amount", dataType: "decimal", description: "Total order amount" },
              { name: "status", dataType: "text", description: "Order status" },
              { name: "payment_method", dataType: "text", description: "Payment method used" }
            ]
          },
          {
            name: "Products",
            description: "Product catalog",
            fields: [
              { name: "product_id", dataType: "integer", description: "Primary key" },
              { name: "name", dataType: "text", description: "Product name" },
              { name: "description", dataType: "text", description: "Product description" },
              { name: "price", dataType: "decimal", description: "Product price" },
              { name: "category", dataType: "text", description: "Product category" },
              { name: "stock_quantity", dataType: "integer", description: "Available stock" }
            ]
          }
        ]
      },
      {
        name: "Finance",
        description: "Financial department database schema",
        tables: [
          {
            name: "Invoices",
            description: "Customer invoices",
            fields: [
              { name: "invoice_id", dataType: "integer", description: "Primary key" },
              { name: "order_id", dataType: "integer", description: "Foreign key to Orders" },
              { name: "amount", dataType: "decimal", description: "Invoice amount" },
              { name: "issued_date", dataType: "date", description: "Date invoice was issued" },
              { name: "due_date", dataType: "date", description: "Invoice due date" },
              { name: "status", dataType: "text", description: "Payment status" }
            ]
          },
          {
            name: "Expenses",
            description: "Company expenses",
            fields: [
              { name: "expense_id", dataType: "integer", description: "Primary key" },
              { name: "category", dataType: "text", description: "Expense category" },
              { name: "amount", dataType: "decimal", description: "Expense amount" },
              { name: "date", dataType: "date", description: "Date of expense" },
              { name: "department", dataType: "text", description: "Department responsible" },
              { name: "description", dataType: "text", description: "Expense description" }
            ]
          }
        ]
      },
      {
        name: "HR",
        description: "Human resources database schema",
        tables: [
          {
            name: "Employees",
            description: "Employee information",
            fields: [
              { name: "employee_id", dataType: "integer", description: "Primary key" },
              { name: "name", dataType: "text", description: "Employee full name" },
              { name: "position", dataType: "text", description: "Job position" },
              { name: "department", dataType: "text", description: "Department" },
              { name: "salary", dataType: "decimal", description: "Employee salary" },
              { name: "hire_date", dataType: "date", description: "Date employee was hired" },
              { name: "email", dataType: "text", description: "Employee email" },
              { name: "phone", dataType: "text", description: "Employee phone number" }
            ]
          },
          {
            name: "Departments",
            description: "Company departments",
            fields: [
              { name: "department_id", dataType: "integer", description: "Primary key" },
              { name: "name", dataType: "text", description: "Department name" },
              { name: "manager_id", dataType: "integer", description: "Department manager employee ID" },
              { name: "budget", dataType: "decimal", description: "Department annual budget" },
              { name: "location", dataType: "text", description: "Department location" }
            ]
          },
          {
            name: "Leave_Requests",
            description: "Employee leave requests",
            fields: [
              { name: "request_id", dataType: "integer", description: "Primary key" },
              { name: "employee_id", dataType: "integer", description: "Foreign key to Employees" },
              { name: "start_date", dataType: "date", description: "Leave start date" },
              { name: "end_date", dataType: "date", description: "Leave end date" },
              { name: "status", dataType: "text", description: "Request status" },
              { name: "type", dataType: "text", description: "Leave type" },
              { name: "reason", dataType: "text", description: "Reason for leave" }
            ]
          }
        ]
      }
    ];

    // Create schemas and their tables/fields
    for (const schemaData of schemas) {
      const schema = await this.createSchema({ 
        name: schemaData.name,
        description: schemaData.description,
        tables: schemaData.tables
      });

      // Set up access policies
      const salesUser = createdUsers.find(u => u.email === "sales_user@example.com");
      const financeUser = createdUsers.find(u => u.email === "finance_user@example.com");
      const hrUser = createdUsers.find(u => u.email === "hr_user@example.com");
      const managerUser = createdUsers.find(u => u.email === "manager@example.com");

      if (schema.name === "Sales" && salesUser) {
        const tables = await this.getTablesBySchema(schema.id);
        for (const table of tables) {
          await this.createAccessPolicy({
            userId: salesUser.id,
            schemaId: schema.id,
            tableId: table.id,
            effect: "allow",
            fields: null
          });
        }
      }

      if (schema.name === "Finance" && financeUser) {
        const tables = await this.getTablesBySchema(schema.id);
        for (const table of tables) {
          await this.createAccessPolicy({
            userId: financeUser.id,
            schemaId: schema.id,
            tableId: table.id,
            effect: "allow",
            fields: null
          });
        }
      }

      if (schema.name === "HR" && hrUser) {
        const tables = await this.getTablesBySchema(schema.id);
        for (const table of tables) {
          await this.createAccessPolicy({
            userId: hrUser.id,
            schemaId: schema.id,
            tableId: table.id,
            effect: "allow",
            fields: null
          });
        }
      }

      // Set up manager access (limited)
      if (schema.name === "HR" && managerUser) {
        const tables = await this.getTablesBySchema(schema.id);
        const employeesTable = tables.find(t => t.name === "Employees");
        const leaveRequestsTable = tables.find(t => t.name === "Leave_Requests");

        if (employeesTable) {
          const fields = await this.getFieldsByTable(employeesTable.id);
          const fieldNames = fields
            .filter(f => f.name !== "salary")
            .map(f => f.name);

          await this.createAccessPolicy({
            userId: managerUser.id,
            schemaId: schema.id,
            tableId: employeesTable.id,
            effect: "allow",
            fields: fieldNames
          });
        }

        if (leaveRequestsTable) {
          await this.createAccessPolicy({
            userId: managerUser.id,
            schemaId: schema.id,
            tableId: leaveRequestsTable.id,
            effect: "allow",
            fields: null
          });
        }
      }
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = {
      id,
      email: userData.email,
      password: userData.password,
      role: userData.role || 'user', // Ensure role is always a string
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getAdminUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === 'admin');
  }

  // Schema operations
  async getAllSchemas(): Promise<Schema[]> {
    return Array.from(this.schemas.values());
  }

  async getSchema(id: number): Promise<Schema | undefined> {
    return this.schemas.get(id);
  }

  async createSchema(schemaData: SchemaUpload): Promise<Schema> {
    const schemaId = this.schemaIdCounter++;
    const now = new Date();
    
    const schema: Schema = {
      id: schemaId,
      name: schemaData.name,
      createdAt: now,
      updatedAt: now
    };
    
    this.schemas.set(schemaId, schema);
    
    // Create tables and fields
    for (const tableData of schemaData.tables) {
      const table = await this.createTable({
        name: tableData.name,
        schemaId: schemaId
      });
      
      for (const fieldData of tableData.fields) {
        await this.createField({
          name: fieldData.name,
          dataType: fieldData.dataType,
          tableId: table.id
        });
      }
    }
    
    return schema;
  }

  async getSchemaWithTablesAndFields(id: number): Promise<any | undefined> {
    const schema = await this.getSchema(id);
    if (!schema) return undefined;
    
    const tables = await this.getTablesBySchema(id);
    const tablesWithFields = await Promise.all(
      tables.map(async (table) => {
        const fields = await this.getFieldsByTable(table.id);
        return {
          ...table,
          fields
        };
      })
    );
    
    return {
      ...schema,
      tables: tablesWithFields
    };
  }

  // Table operations
  async getTable(id: number): Promise<Table | undefined> {
    return this.tables.get(id);
  }

  async getTablesBySchema(schemaId: number): Promise<Table[]> {
    return Array.from(this.tables.values()).filter(table => table.schemaId === schemaId);
  }

  async createTable(tableData: InsertTable): Promise<Table> {
    const id = this.tableIdCounter++;
    const now = new Date();
    
    const table: Table = {
      id,
      ...tableData,
      createdAt: now,
      updatedAt: now
    };
    
    this.tables.set(id, table);
    return table;
  }

  // Field operations
  async getField(id: number): Promise<Field | undefined> {
    return this.fields.get(id);
  }

  async getFieldsByTable(tableId: number): Promise<Field[]> {
    return Array.from(this.fields.values()).filter(field => field.tableId === tableId);
  }

  async createField(fieldData: InsertField): Promise<Field> {
    const id = this.fieldIdCounter++;
    const now = new Date();
    
    const field: Field = {
      id,
      ...fieldData,
      createdAt: now,
      updatedAt: now
    };
    
    this.fields.set(id, field);
    return field;
  }

  // Access request operations
  async createAccessRequest(requestData: InsertAccessRequest): Promise<AccessRequest> {
    const id = this.requestIdCounter++;
    const now = new Date();
    
    const request: AccessRequest = {
      id,
      userId: requestData.userId,
      schemaId: requestData.schemaId,
      reason: requestData.reason || null, // Ensure reason is string | null
      status: "pending",
      createdAt: now,
      updatedAt: now
    };
    
    this.accessRequests.set(id, request);
    return request;
  }

  async getAccessRequest(id: number): Promise<AccessRequest | undefined> {
    return this.accessRequests.get(id);
  }

  async getAllAccessRequests(): Promise<AccessRequest[]> {
    return Array.from(this.accessRequests.values());
  }

  async getUserAccessRequests(userId: number): Promise<AccessRequest[]> {
    return Array.from(this.accessRequests.values())
      .filter(request => request.userId === userId);
  }

  async updateAccessRequestStatus(id: number, status: string): Promise<AccessRequest | undefined> {
    const request = this.accessRequests.get(id);
    if (!request) return undefined;
    
    const updated: AccessRequest = {
      ...request,
      status: status as any,
      updatedAt: new Date()
    };
    
    this.accessRequests.set(id, updated);
    return updated;
  }

  async getAccessRequestWithItems(id: number): Promise<any | undefined> {
    const request = await this.getAccessRequest(id);
    if (!request) return undefined;
    
    const items = await this.getAccessRequestItems(id);
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const table = await this.getTable(item.tableId);
        const fields = item.fields as string[];
        return {
          ...item,
          table,
          fields
        };
      })
    );
    
    const user = await this.getUser(request.userId);
    const schema = await this.getSchema(request.schemaId);
    
    return {
      ...request,
      user,
      schema,
      items: itemsWithDetails
    };
  }

  // Access request item operations
  async createAccessRequestItem(itemData: InsertAccessRequestItem): Promise<AccessRequestItem> {
    const id = this.requestItemIdCounter++;
    const now = new Date();
    
    // Convert fields to string[] if it exists
    const fields = itemData.fields ? 
      (Array.isArray(itemData.fields) ? itemData.fields : Array.from(itemData.fields)) : 
      null;
    
    const item: AccessRequestItem = {
      id,
      requestId: itemData.requestId,
      tableId: itemData.tableId,
      effect: itemData.effect,
      fields: fields, // Properly converted to string[] | null
      createdAt: now
    };
    
    this.accessRequestItems.set(id, item);
    return item;
  }

  async getAccessRequestItems(requestId: number): Promise<AccessRequestItem[]> {
    return Array.from(this.accessRequestItems.values())
      .filter(item => item.requestId === requestId);
  }

  // Access policy operations
  async createAccessPolicy(policyData: InsertAccessPolicy): Promise<AccessPolicy> {
    const id = this.policyIdCounter++;
    const now = new Date();
    
    // Convert fields to string[] if it exists
    const fields = policyData.fields ? 
      (Array.isArray(policyData.fields) ? policyData.fields : Array.from(policyData.fields as any)) : 
      null;
    
    const policy: AccessPolicy = {
      id,
      userId: policyData.userId,
      schemaId: policyData.schemaId,
      tableId: policyData.tableId,
      effect: policyData.effect,
      fields: fields, // Properly converted to string[] | null
      createdAt: now,
      updatedAt: now
    };
    
    this.accessPolicies.set(id, policy);
    return policy;
  }

  async getUserAccessPolicies(userId: number): Promise<AccessPolicy[]> {
    return Array.from(this.accessPolicies.values())
      .filter(policy => policy.userId === userId);
  }

  async getAllAccessPolicies(): Promise<AccessPolicy[]> {
    return Array.from(this.accessPolicies.values());
  }

  async checkPolicyConflict(
    userId: number, 
    schemaId: number, 
    tableId: number, 
    effect: string, 
    fields: string[]
  ): Promise<boolean> {
    const userPolicies = await this.getUserAccessPolicies(userId);
    
    // Filter policies for the same table
    const tablePolicies = userPolicies.filter(
      policy => policy.tableId === tableId
    );
    
    for (const policy of tablePolicies) {
      const policyFields = policy.fields as string[];
      
      // Check for conflicts between effects
      if (effect !== policy.effect) {
        // Check if any fields overlap
        const overlappingFields = fields.filter(field => 
          policyFields.includes(field)
        );
        
        if (overlappingFields.length > 0) {
          return true; // Conflict found
        }
      }
      
      // Special case for AllowAll effect
      if (
        (effect === "allowAll" && policy.effect !== "allowAll") ||
        (effect !== "allowAll" && policy.effect === "allowAll")
      ) {
        return true; // Conflict between AllowAll and other effects
      }
    }
    
    return false; // No conflicts
  }

  async copyUserAccessPolicies(
    sourceUserId: number, 
    targetUserId: number, 
    replaceExisting: boolean
  ): Promise<void> {
    const sourcePolicies = await this.getUserAccessPolicies(sourceUserId);
    
    if (replaceExisting) {
      // Delete existing target policies
      const targetPolicies = await this.getUserAccessPolicies(targetUserId);
      for (const policy of targetPolicies) {
        this.accessPolicies.delete(policy.id);
      }
    }
    
    // Copy policies from source to target
    for (const policy of sourcePolicies) {
      await this.createAccessPolicy({
        userId: targetUserId,
        schemaId: policy.schemaId,
        tableId: policy.tableId,
        effect: policy.effect,
        fields: policy.fields as string[]
      });
    }
  }

  // Notification operations
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const id = this.notificationIdCounter++;
    const now = new Date();
    
    const notification: Notification = {
      id,
      ...notificationData,
      read: false,
      createdAt: now
    };
    
    this.notifications.set(id, notification);
    return notification;
  }

  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => {
        // Handle potential null createdAt values
        const timeA = a.createdAt ? a.createdAt.getTime() : 0;
        const timeB = b.createdAt ? b.createdAt.getTime() : 0;
        return timeB - timeA;
      });
  }

  async markNotificationAsRead(id: number): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.read = true;
      this.notifications.set(id, notification);
    }
  }
}

// Create and export storage instance
export const storage = new MemStorage();
