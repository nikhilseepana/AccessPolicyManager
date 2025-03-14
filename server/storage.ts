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
  sessionStore: session.SessionStore;
  
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
  sessionStore: session.SessionStore;
  
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
    
    // Initialize with admin user
    this.createUser({
      email: "admin@example.com",
      password: "$2b$10$KmhbT9.v4/NUzHZkIIY.CeZaQ8jqQI2gZgX6nJUYjXMVjVCHSxmSu", // "password123"
      role: "admin"
    });
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
      ...userData,
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
      ...requestData,
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
    
    const item: AccessRequestItem = {
      id,
      ...itemData,
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
    
    const policy: AccessPolicy = {
      id,
      ...policyData,
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
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
