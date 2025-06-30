#!/usr/bin/env node

// Production start script for Ezras Nashim
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set production environment variables
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('🕯️ Starting Ezras Nashim in production mode...');
console.log(`📍 Environment: ${process.env.NODE_ENV}`);
console.log(`🌐 Port: ${process.env.PORT}`);

// Check for built server
const builtServerPath = join(__dirname, 'dist', 'index.js');

if (!existsSync(builtServerPath)) {
  console.error('❌ Production build not found at dist/index.js');
  console.error('📝 Please run: npm run build');
  process.exit(1);
}

console.log('✅ Using built production server');
console.log(`📂 Server path: ${builtServerPath}`);

// Import and start the production server
try {
  await import(builtServerPath);
  console.log('🚀 Production server started successfully');
} catch (error) {
  console.error('❌ Failed to start production server:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}