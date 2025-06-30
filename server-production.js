#!/usr/bin/env node

// Clean production entry point for Ezras Nashim
// No development command references

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate production environment
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

if (!process.env.PORT) {
  process.env.PORT = '5000';
}

console.log('🚀 Starting Ezras Nashim in production mode');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);

// Verify required files exist
const requiredFiles = [
  'dist/index.js',
  'dist/public/index.html'
];

for (const file of requiredFiles) {
  try {
    readFileSync(join(__dirname, file));
  } catch (error) {
    console.error(`❌ Required file missing: ${file}`);
    console.error('Please run the build process first');
    process.exit(1);
  }
}

console.log('✅ All required files present');

// Start the production server
try {
  await import('./dist/index.js');
} catch (error) {
  console.error('❌ Failed to start production server:', error);
  process.exit(1);
}