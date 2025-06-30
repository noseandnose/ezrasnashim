#!/usr/bin/env node

// Clean production entry point - no 'dev' references
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('🕯️ Ezras Nashim Production Application');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${process.env.PORT}`);

// Verify production build exists
const serverPath = join(__dirname, 'dist', 'index.js');
if (!existsSync(serverPath)) {
  console.error('❌ Production build not found. Please run build first.');
  process.exit(1);
}

// Import and start the production server
import(serverPath).catch(error => {
  console.error('❌ Failed to start production server:', error);
  process.exit(1);
});