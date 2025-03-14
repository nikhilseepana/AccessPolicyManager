// Script to initialize sample data directly in the application
// @ts-check
// This is an ESM module
import { storage } from '../server/storage.js';

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
    
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}

// Run the initialization
initSampleData().catch(console.error);