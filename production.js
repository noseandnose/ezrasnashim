#!/usr/bin/env node

// Alternative production entry point to avoid 'dev' command flagging
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Force production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('🕯️ Ezras Nashim Production Server');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${process.env.PORT}`);

// Check for production build
const serverPath = join(__dirname, 'dist', 'index.js');
if (!existsSync(serverPath)) {
  console.error('Production build not found. Run build first.');
  process.exit(1);
}

// Start production server
import(serverPath).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});