import type { Express } from "express";
import { createServer, type Server } from "http";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./swagger";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { schemaUploadSchema } from "@shared/schema";

// Function to initialize sample data
async function initSampleData() {
  console.log('Initializing sample data...');
  
  try {
    // Create sample users (admin already exists)
    const users = [
      { email: 'sales_user@example.com', password: 'password123', role: 'user' },
      { email: 'finance_user@example.com', password: 'password123', role: 'user' },
      { email: 'hr_user@example.com', password: 'password123', role: 'user' },
      { email: 'manager@example.com', password: 'password123', role: 'user' }
    ];
    
    const createdUsers = [];
    for (const userData of users) {
      try {
        const user = await storage.createUser(userData);
        console.log(`Created user: ${user.email}`);
        createdUsers.push(user);
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
      }
    }
    
    // Create sample schemas
    const schemas = [
      {
        name: 'Sales',
        description: 'Sales department database schema',
        tables: [
          {
            name: 'Customers',
            description: 'Customer information table',
            fields: [
              { name: 'customer_id', dataType: 'integer', description: 'Primary key' },
              { name: 'name', dataType: 'text', description: 'Customer full name' },
              { name: 'email', dataType: 'text', description: 'Customer email address' },
              { name: 'phone', dataType: 'text', description: 'Customer phone number' },
              { name: 'address', dataType: 'text', description: 'Customer address' },
              { name: 'created_at', dataType: 'timestamp', description: 'Record creation date' }
            ]
          },
          {
            name: 'Orders',
            description: 'Customer orders data',
            fields: [
              { name: 'order_id', dataType: 'integer', description: 'Primary key' },
              { name: 'customer_id', dataType: 'integer', description: 'Foreign key to Customers' },
              { name: 'order_date', dataType: 'date', description: 'Date of order' },
              { name: 'total_amount', dataType: 'decimal', description: 'Total order amount' },
              { name: 'status', dataType: 'text', description: 'Order status' },
              { name: 'payment_method', dataType: 'text', description: 'Payment method used' }
            ]
          },
          {
            name: 'Products',
            description: 'Product catalog',
            fields: [
              { name: 'product_id', dataType: 'integer', description: 'Primary key' },
              { name: 'name', dataType: 'text', description: 'Product name' },
              { name: 'description', dataType: 'text', description: 'Product description' },
              { name: 'price', dataType: 'decimal', description: 'Product price' },
              { name: 'category', dataType: 'text', description: 'Product category' },
              { name: 'stock_quantity', dataType: 'integer', description: 'Available stock' }
            ]
          }
        ]
      },
      {
        name: 'Finance',
        description: 'Financial department database schema',
        tables: [
          {
            name: 'Invoices',
            description: 'Customer invoices',
            fields: [
              { name: 'invoice_id', dataType: 'integer', description: 'Primary key' },
              { name: 'order_id', dataType: 'integer', description: 'Foreign key to Orders' },
              { name: 'amount', dataType: 'decimal', description: 'Invoice amount' },
              { name: 'issued_date', dataType: 'date', description: 'Date invoice was issued' },
              { name: 'due_date', dataType: 'date', description: 'Invoice due date' },
              { name: 'status', dataType: 'text', description: 'Payment status' }
            ]
          },
          {
            name: 'Expenses',
            description: 'Company expenses',
            fields: [
              { name: 'expense_id', dataType: 'integer', description: 'Primary key' },
              { name: 'category', dataType: 'text', description: 'Expense category' },
              { name: 'amount', dataType: 'decimal', description: 'Expense amount' },
              { name: 'date', dataType: 'date', description: 'Date of expense' },
              { name: 'department', dataType: 'text', description: 'Department responsible' },
              { name: 'description', dataType: 'text', description: 'Expense description' }
            ]
          }
        ]
      },
      {
        name: 'HR',
        description: 'Human resources database schema',
        tables: [
          {
            name: 'Employees',
            description: 'Employee information',
            fields: [
              { name: 'employee_id', dataType: 'integer', description: 'Primary key' },
              { name: 'name', dataType: 'text', description: 'Employee full name' },
              { name: 'position', dataType: 'text', description: 'Job position' },
              { name: 'department', dataType: 'text', description: 'Department' },
              { name: 'salary', dataType: 'decimal', description: 'Employee salary' },
              { name: 'hire_date', dataType: 'date', description: 'Date employee was hired' },
              { name: 'email', dataType: 'text', description: 'Employee email' },
              { name: 'phone', dataType: 'text', description: 'Employee phone number' }
            ]
          },
          {
            name: 'Departments',
            description: 'Company departments',
            fields: [
              { name: 'department_id', dataType: 'integer', description: 'Primary key' },
              { name: 'name', dataType: 'text', description: 'Department name' },
              { name: 'manager_id', dataType: 'integer', description: 'Department manager employee ID' },
              { name: 'budget', dataType: 'decimal', description: 'Department annual budget' },
              { name: 'location', dataType: 'text', description: 'Department location' }
            ]
          },
          {
            name: 'Leave_Requests',
            description: 'Employee leave requests',
            fields: [
              { name: 'request_id', dataType: 'integer', description: 'Primary key' },
              { name: 'employee_id', dataType: 'integer', description: 'Foreign key to Employees' },
              { name: 'start_date', dataType: 'date', description: 'Leave start date' },
              { name: 'end_date', dataType: 'date', description: 'Leave end date' },
              { name: 'status', dataType: 'text', description: 'Request status' },
              { name: 'type', dataType: 'text', description: 'Leave type' },
              { name: 'reason', dataType: 'text', description: 'Reason for leave' }
            ]
          }
        ]
      }
    ];

    // Create schemas, tables, and fields
    const createdSchemas = [];
    for (const schemaData of schemas) {
      try {
        const schemaObj = await storage.createSchema({ 
          name: schemaData.name, 
          description: schemaData.description || null 
        });
        console.log(`Created schema: ${schemaObj.name}`);
        createdSchemas.push(schemaObj);
        
        for (const tableData of schemaData.tables) {
          const tableObj = await storage.createTable({
            name: tableData.name,
            description: tableData.description || null,
            schemaId: schemaObj.id
          });
          console.log(`  Created table: ${tableObj.name}`);
          
          for (const fieldData of tableData.fields) {
            const fieldObj = await storage.createField({
              name: fieldData.name,
              dataType: fieldData.dataType,
              description: fieldData.description || null,
              tableId: tableObj.id
            });
            console.log(`    Created field: ${fieldObj.name}`);
          }
        }
      } catch (error) {
        console.error(`Error creating schema ${schemaData.name}:`, error);
      }
    }

    // Set up access policies for users
    // Find users by email
    const salesUser = createdUsers.find(u => u.email === 'sales_user@example.com');
    const financeUser = createdUsers.find(u => u.email === 'finance_user@example.com');
    const hrUser = createdUsers.find(u => u.email === 'hr_user@example.com');
    const managerUser = createdUsers.find(u => u.email === 'manager@example.com');
    
    // Find schemas by name
    const salesSchema = createdSchemas.find(s => s.name === 'Sales');
    const financeSchema = createdSchemas.find(s => s.name === 'Finance');
    const hrSchema = createdSchemas.find(s => s.name === 'HR');
    
    if (salesSchema) {
      // Get tables for Sales schema
      const salesTables = await storage.getTablesBySchema(salesSchema.id);
      const customersTable = salesTables.find(t => t.name === 'Customers');
      const ordersTable = salesTables.find(t => t.name === 'Orders');
      const productsTable = salesTables.find(t => t.name === 'Products');
      
      // Create access policies for sales user
      if (salesUser && customersTable) {
        await storage.createAccessPolicy({
          userId: salesUser.id,
          schemaId: salesSchema.id,
          tableId: customersTable.id,
          effect: 'allow',
          fields: null // Allow all fields
        });
        console.log(`Granted sales_user access to Customers table`);
      }
      
      if (salesUser && ordersTable) {
        await storage.createAccessPolicy({
          userId: salesUser.id,
          schemaId: salesSchema.id,
          tableId: ordersTable.id,
          effect: 'allow',
          fields: null // Allow all fields
        });
        console.log(`Granted sales_user access to Orders table`);
      }
      
      if (salesUser && productsTable) {
        await storage.createAccessPolicy({
          userId: salesUser.id,
          schemaId: salesSchema.id,
          tableId: productsTable.id,
          effect: 'allow',
          fields: null // Allow all fields
        });
        console.log(`Granted sales_user access to Products table`);
      }
      
      // Create access policy for finance user to Orders table (limited)
      if (financeUser && ordersTable) {
        const orderFields = await storage.getFieldsByTable(ordersTable.id);
        const fieldNames = orderFields
          .filter(f => ['order_id', 'customer_id', 'order_date', 'total_amount'].includes(f.name))
          .map(f => f.name);
        
        await storage.createAccessPolicy({
          userId: financeUser.id,
          schemaId: salesSchema.id,
          tableId: ordersTable.id,
          effect: 'allow',
          fields: fieldNames
        });
        console.log(`Granted finance_user limited access to Orders table`);
      }
    }
    
    if (financeSchema) {
      // Get tables for Finance schema
      const financeTables = await storage.getTablesBySchema(financeSchema.id);
      const invoicesTable = financeTables.find(t => t.name === 'Invoices');
      const expensesTable = financeTables.find(t => t.name === 'Expenses');
      
      // Create access policies for finance user
      if (financeUser && invoicesTable) {
        await storage.createAccessPolicy({
          userId: financeUser.id,
          schemaId: financeSchema.id,
          tableId: invoicesTable.id,
          effect: 'allow',
          fields: null // Allow all fields
        });
        console.log(`Granted finance_user access to Invoices table`);
      }
      
      if (financeUser && expensesTable) {
        await storage.createAccessPolicy({
          userId: financeUser.id,
          schemaId: financeSchema.id,
          tableId: expensesTable.id,
          effect: 'allow',
          fields: null // Allow all fields
        });
        console.log(`Granted finance_user access to Expenses table`);
      }
    }
    
    if (hrSchema) {
      // Get tables for HR schema
      const hrTables = await storage.getTablesBySchema(hrSchema.id);
      const employeesTable = hrTables.find(t => t.name === 'Employees');
      const departmentsTable = hrTables.find(t => t.name === 'Departments');
      const leaveRequestsTable = hrTables.find(t => t.name === 'Leave_Requests');
      
      // Create access policies for HR user
      if (hrUser && employeesTable) {
        await storage.createAccessPolicy({
          userId: hrUser.id,
          schemaId: hrSchema.id,
          tableId: employeesTable.id,
          effect: 'allow',
          fields: null // Allow all fields
        });
        console.log(`Granted hr_user access to Employees table`);
      }
      
      if (hrUser && departmentsTable) {
        await storage.createAccessPolicy({
          userId: hrUser.id,
          schemaId: hrSchema.id,
          tableId: departmentsTable.id,
          effect: 'allow',
          fields: null // Allow all fields
        });
        console.log(`Granted hr_user access to Departments table`);
      }
      
      if (hrUser && leaveRequestsTable) {
        await storage.createAccessPolicy({
          userId: hrUser.id,
          schemaId: hrSchema.id,
          tableId: leaveRequestsTable.id,
          effect: 'allow',
          fields: null // Allow all fields
        });
        console.log(`Granted hr_user access to Leave_Requests table`);
      }
      
      // Create limited access policy for manager user to Employees table (no salary)
      if (managerUser && employeesTable) {
        const employeeFields = await storage.getFieldsByTable(employeesTable.id);
        const fieldNames = employeeFields
          .filter(f => f.name !== 'salary')
          .map(f => f.name);
        
        await storage.createAccessPolicy({
          userId: managerUser.id,
          schemaId: hrSchema.id,
          tableId: employeesTable.id,
          effect: 'allow',
          fields: fieldNames
        });
        console.log(`Granted manager limited access to Employees table (excluding salary)`);
      }
      
      // Create access policy for manager user to Leave_Requests table
      if (managerUser && leaveRequestsTable) {
        await storage.createAccessPolicy({
          userId: managerUser.id,
          schemaId: hrSchema.id,
          tableId: leaveRequestsTable.id,
          effect: 'allow',
          fields: null // Allow all fields
        });
        console.log(`Granted manager access to Leave_Requests table`);
      }
    }
    
    console.log('Sample data initialization complete!');
    return { success: true };
    
  } catch (error) {
    console.error('Error initializing sample data:', error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Set up authentication routes
  setupAuth(app);

  // Schema routes
  app.get("/api/schemas", isAuthenticated, async (req, res) => {
    try {
      const schemas = await storage.getAllSchemas();
      res.json(schemas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schemas" });
    }
  });

  app.post("/api/schemas", isAdmin, async (req, res) => {
    try {
      const validatedData = schemaUploadSchema.parse(req.body);
      const schema = await storage.createSchema(validatedData);
      res.status(201).json(schema);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schema data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create schema" });
    }
  });

  app.get("/api/schemas/:id", isAuthenticated, async (req, res) => {
    try {
      const schema = await storage.getSchemaWithTablesAndFields(parseInt(req.params.id));
      if (!schema) {
        return res.status(404).json({ message: "Schema not found" });
      }
      res.json(schema);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schema" });
    }
  });

  // Access Request routes
  app.post("/api/access-requests", isAuthenticated, async (req, res) => {
    try {
      const request = await storage.createAccessRequest({
        userId: req.user!.id,
        ...req.body,
      });
      
      // Create notification for admins
      const admins = await storage.getAdminUsers();
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: "new_request",
          message: `New access request from ${req.user!.email}`,
        });
      }
      
      res.status(201).json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to create access request" });
    }
  });

  app.get("/api/access-requests", isAuthenticated, async (req, res) => {
    try {
      let requests;
      if (req.user!.role === "admin") {
        requests = await storage.getAllAccessRequests();
      } else {
        requests = await storage.getUserAccessRequests(req.user!.id);
      }
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch access requests" });
    }
  });

  app.get("/api/access-requests/:id", isAuthenticated, async (req, res) => {
    try {
      const request = await storage.getAccessRequestWithItems(parseInt(req.params.id));
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      // Check if user is admin or the request belongs to them
      if (req.user!.role !== "admin" && request.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch access request" });
    }
  });

  app.patch("/api/access-requests/:id", isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const request = await storage.updateAccessRequestStatus(
        parseInt(req.params.id),
        status
      );
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      // Create policies if approved
      if (status === "approved") {
        const requestItems = await storage.getAccessRequestItems(request.id);
        for (const item of requestItems) {
          // Check for conflicts before creating policy
          const hasConflict = await storage.checkPolicyConflict(
            request.userId,
            request.schemaId,
            item.tableId,
            item.effect,
            item.fields as string[]
          );
          
          if (!hasConflict) {
            await storage.createAccessPolicy({
              userId: request.userId,
              schemaId: request.schemaId,
              tableId: item.tableId,
              effect: item.effect,
              fields: item.fields as string[],
            });
          } else {
            // Handle conflict - in this case we'll reject the specific conflicting policy
            // but still approve the request overall
            console.log(`Conflict detected for user ${request.userId}, table ${item.tableId}`);
          }
        }
      }
      
      // Create notification for the user
      await storage.createNotification({
        userId: request.userId,
        type: status === "approved" ? "request_approved" : "request_rejected",
        message: `Your access request has been ${status}`,
      });
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to update access request" });
    }
  });

  // Access Policy routes
  app.get("/api/access-policies", isAuthenticated, async (req, res) => {
    try {
      let policies;
      if (req.user!.role === "admin") {
        if (req.query.userId) {
          policies = await storage.getUserAccessPolicies(parseInt(req.query.userId as string));
        } else {
          policies = await storage.getAllAccessPolicies();
        }
      } else {
        policies = await storage.getUserAccessPolicies(req.user!.id);
      }
      res.json(policies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch access policies" });
    }
  });

  app.post("/api/access-policies/copy", isAdmin, async (req, res) => {
    try {
      const { sourceUserId, targetUserId, replaceExisting } = req.body;
      if (!sourceUserId || !targetUserId) {
        return res.status(400).json({ message: "Source and target user IDs are required" });
      }
      
      const result = await storage.copyUserAccessPolicies(
        parseInt(sourceUserId), 
        parseInt(targetUserId),
        !!replaceExisting
      );
      
      res.json({ success: true, message: "Access policies copied successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to copy access policies" });
    }
  });

  // User routes
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notification = await storage.getNotification(parseInt(req.params.id));
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.markNotificationAsRead(notification.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Sample data initialization route (admin only)
  app.post("/api/init-sample-data", isAdmin, async (req, res) => {
    try {
      await initSampleData();
      res.json({ success: true, message: "Sample data initialized successfully" });
    } catch (error) {
      console.error("Failed to initialize sample data:", error);
      res.status(500).json({ 
        message: "Failed to initialize sample data",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
