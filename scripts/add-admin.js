// This script creates an admin user with proper password hashing
const crypto = require('crypto');
const { promisify } = require('util');
const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

// We'll add this to our storage.ts file instead of running as a script
console.log('This is a reference implementation for updating the storage.ts file');