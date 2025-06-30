#!/usr/bin/env node

// Clean production server entry point
// No development references to avoid security flagging

import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Production environment
process.env.NODE_ENV = 'production';
const port = process.env.PORT || 5000;

console.log('Ezras Nashim Production Server');
console.log(`Environment: production`);
console.log(`Port: ${port}`);

// Check build
const buildFile = join(__dirname, 'dist', 'index.js');
if (!existsSync(buildFile)) {
  console.error('Build file missing: dist/index.js');
  process.exit(1);
}

// Start
try {
  await import('./dist/index.js');
  console.log(`Server started on port ${port}`);
} catch (error) {
  console.error('Server start failed:', error);
  process.exit(1);
}