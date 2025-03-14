// Script to set up sample data for the User Access Management System
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// This function will create sample data and store it in memory
async function setupSampleData() {
  // Sample schemas with tables and fields
  const sampleSchemas = [
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
            { name: "status", dataType: "text", description: "Order status (pending, shipped, delivered)" },
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
            { name: "status", dataType: "text", description: "Request status (pending, approved, rejected)" },
            { name: "type", dataType: "text", description: "Leave type (vacation, sick, personal)" },
            { name: "reason", dataType: "text", description: "Reason for leave" }
          ]
        }
      ]
    }
  ];

  // Sample users with different roles
  const sampleUsers = [
    { email: "sales_user@example.com", password: await hashPassword("password123"), role: "user" },
    { email: "finance_user@example.com", password: await hashPassword("password123"), role: "user" },
    { email: "hr_user@example.com", password: await hashPassword("password123"), role: "user" },
    { email: "manager@example.com", password: await hashPassword("password123"), role: "user" }
  ];

  // Create a data file to load this sample data
  const data = {
    schemas: sampleSchemas,
    users: sampleUsers
  };

  // Write the setup data to a JSON file
  const dataFilePath = path.join(__dirname, 'sample-data.json');
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  console.log(`Sample data written to ${dataFilePath}`);
  
  return data;
}

// Entry point for this script
(async () => {
  try {
    const data = await setupSampleData();
    console.log('Sample data setup complete!');
    console.log(`Created ${data.schemas.length} schemas and ${data.users.length} users`);
  } catch (error) {
    console.error('Error setting up sample data:', error);
  }
})();