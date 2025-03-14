// Script to load sample data into the application storage
const fs = require('fs');
const path = require('path');
const { storage } = require('../server/storage');

async function loadSampleData() {
  try {
    // Read the sample data file
    const dataFilePath = path.join(__dirname, 'sample-data.json');
    if (!fs.existsSync(dataFilePath)) {
      console.error('Sample data file not found. Run setup-sample-data.js first.');
      return;
    }

    const sampleData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    
    // Create sample users
    for (const userData of sampleData.users) {
      try {
        const user = await storage.createUser(userData);
        console.log(`Created user: ${user.email}`);
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error.message);
      }
    }

    // Create sample schemas with tables and fields
    for (const schemaData of sampleData.schemas) {
      try {
        // First create the schema
        const schema = await storage.createSchema({ 
          name: schemaData.name, 
          description: schemaData.description 
        });
        console.log(`Created schema: ${schema.name}`);
        
        // Then create tables for this schema
        for (const tableData of schemaData.tables) {
          try {
            const table = await storage.createTable({
              name: tableData.name,
              description: tableData.description,
              schemaId: schema.id
            });
            console.log(`  Created table: ${table.name}`);
            
            // Then create fields for this table
            for (const fieldData of tableData.fields) {
              try {
                const field = await storage.createField({
                  name: fieldData.name,
                  dataType: fieldData.dataType,
                  description: fieldData.description,
                  tableId: table.id
                });
                console.log(`    Created field: ${field.name}`);
              } catch (error) {
                console.error(`    Error creating field ${fieldData.name}:`, error.message);
              }
            }
          } catch (error) {
            console.error(`  Error creating table ${tableData.name}:`, error.message);
          }
        }
      } catch (error) {
        console.error(`Error creating schema ${schemaData.name}:`, error.message);
      }
    }

    // Create sample access policies
    await createSampleAccessPolicies();

    console.log('Sample data loading complete!');
  } catch (error) {
    console.error('Error loading sample data:', error);
  }
}

async function createSampleAccessPolicies() {
  try {
    // Get all users
    const users = await storage.getAllUsers();
    
    // Get all schemas
    const schemas = await storage.getAllSchemas();
    
    if (!users.length || !schemas.length) {
      console.log('No users or schemas found for creating access policies');
      return;
    }
    
    // Find specific users
    const salesUser = users.find(u => u.email === 'sales_user@example.com');
    const financeUser = users.find(u => u.email === 'finance_user@example.com');
    const hrUser = users.find(u => u.email === 'hr_user@example.com');
    const managerUser = users.find(u => u.email === 'manager@example.com');
    
    // Find specific schemas
    const salesSchema = schemas.find(s => s.name === 'Sales');
    const financeSchema = schemas.find(s => s.name === 'Finance');
    const hrSchema = schemas.find(s => s.name === 'HR');
    
    if (salesSchema) {
      // Get Sales tables
      const salesTables = await storage.getTablesBySchema(salesSchema.id);
      const customersTable = salesTables.find(t => t.name === 'Customers');
      const ordersTable = salesTables.find(t => t.name === 'Orders');
      const productsTable = salesTables.find(t => t.name === 'Products');
      
      // Give sales user access to all Sales tables
      if (salesUser && customersTable) {
        await storage.createAccessPolicy({
          userId: salesUser.id,
          schemaId: salesSchema.id,
          tableId: customersTable.id,
          effect: "allow",
          fields: null // Allow all fields
        });
        console.log(`Granted sales_user access to Customers table`);
      }
      
      if (salesUser && ordersTable) {
        await storage.createAccessPolicy({
          userId: salesUser.id,
          schemaId: salesSchema.id,
          tableId: ordersTable.id,
          effect: "allow",
          fields: null // Allow all fields
        });
        console.log(`Granted sales_user access to Orders table`);
      }
      
      if (salesUser && productsTable) {
        await storage.createAccessPolicy({
          userId: salesUser.id,
          schemaId: salesSchema.id,
          tableId: productsTable.id,
          effect: "allow",
          fields: null // Allow all fields
        });
        console.log(`Granted sales_user access to Products table`);
      }
      
      // Give finance user read-only access to Orders table
      if (financeUser && ordersTable) {
        await storage.createAccessPolicy({
          userId: financeUser.id,
          schemaId: salesSchema.id,
          tableId: ordersTable.id,
          effect: "allow",
          fields: ["order_id", "customer_id", "order_date", "total_amount"] // Limited fields
        });
        console.log(`Granted finance_user limited access to Orders table`);
      }
    }
    
    if (financeSchema) {
      // Get Finance tables
      const financeTables = await storage.getTablesBySchema(financeSchema.id);
      const invoicesTable = financeTables.find(t => t.name === 'Invoices');
      const expensesTable = financeTables.find(t => t.name === 'Expenses');
      
      // Give finance user access to all Finance tables
      if (financeUser && invoicesTable) {
        await storage.createAccessPolicy({
          userId: financeUser.id,
          schemaId: financeSchema.id,
          tableId: invoicesTable.id,
          effect: "allow",
          fields: null // Allow all fields
        });
        console.log(`Granted finance_user access to Invoices table`);
      }
      
      if (financeUser && expensesTable) {
        await storage.createAccessPolicy({
          userId: financeUser.id,
          schemaId: financeSchema.id,
          tableId: expensesTable.id,
          effect: "allow",
          fields: null // Allow all fields
        });
        console.log(`Granted finance_user access to Expenses table`);
      }
    }
    
    if (hrSchema) {
      // Get HR tables
      const hrTables = await storage.getTablesBySchema(hrSchema.id);
      const employeesTable = hrTables.find(t => t.name === 'Employees');
      const departmentsTable = hrTables.find(t => t.name === 'Departments');
      const leaveRequestsTable = hrTables.find(t => t.name === 'Leave_Requests');
      
      // Give HR user access to all HR tables
      if (hrUser && employeesTable) {
        await storage.createAccessPolicy({
          userId: hrUser.id,
          schemaId: hrSchema.id,
          tableId: employeesTable.id,
          effect: "allow",
          fields: null // Allow all fields
        });
        console.log(`Granted hr_user access to Employees table`);
      }
      
      if (hrUser && departmentsTable) {
        await storage.createAccessPolicy({
          userId: hrUser.id,
          schemaId: hrSchema.id,
          tableId: departmentsTable.id,
          effect: "allow",
          fields: null // Allow all fields
        });
        console.log(`Granted hr_user access to Departments table`);
      }
      
      if (hrUser && leaveRequestsTable) {
        await storage.createAccessPolicy({
          userId: hrUser.id,
          schemaId: hrSchema.id,
          tableId: leaveRequestsTable.id,
          effect: "allow",
          fields: null // Allow all fields
        });
        console.log(`Granted hr_user access to Leave_Requests table`);
      }
      
      // Give manager user access to employee data but not salary info
      if (managerUser && employeesTable) {
        // Get fields for the employees table
        const employeeFields = await storage.getFieldsByTable(employeesTable.id);
        const fieldNames = employeeFields
          .filter(f => f.name !== 'salary') // Exclude salary
          .map(f => f.name);
        
        await storage.createAccessPolicy({
          userId: managerUser.id,
          schemaId: hrSchema.id,
          tableId: employeesTable.id,
          effect: "allow",
          fields: fieldNames // Allow specific fields
        });
        console.log(`Granted manager limited access to Employees table (excluding salary)`);
      }
      
      // Give manager access to leave requests
      if (managerUser && leaveRequestsTable) {
        await storage.createAccessPolicy({
          userId: managerUser.id,
          schemaId: hrSchema.id,
          tableId: leaveRequestsTable.id,
          effect: "allow",
          fields: null // Allow all fields
        });
        console.log(`Granted manager access to Leave_Requests table`);
      }
    }
    
    // Give admin user access to everything (already built into the system)
    
    console.log('Created sample access policies');
  } catch (error) {
    console.error('Error creating access policies:', error);
  }
}

// Run the script
loadSampleData().catch(console.error);