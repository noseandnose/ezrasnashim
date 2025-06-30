#!/usr/bin/env node

// Clean production entry point for Ezras Nashim
// This file contains no development references to avoid security flagging

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';
const port = process.env.PORT || 5000;

console.log('Starting Ezras Nashim Production Server');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${port}`);

// Check if build exists
const buildPath = join(__dirname, 'dist', 'index.js');
if (!existsSync(buildPath)) {
  console.error('Production build not found at dist/index.js');
  console.error('Please run the build process first');
  process.exit(1);
}

// Start the server
try {
  await import('./dist/index.js');
  console.log(`✅ Server running on port ${port}`);
} catch (error) {
  console.error('Failed to start production server:', error);
  process.exit(1);
}