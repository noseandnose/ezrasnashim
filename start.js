#!/usr/bin/env node

// Production start script
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set production environment
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

console.log('Starting Ezras Nashim in production mode...');
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${process.env.PORT}`);

// Check if dist/index.js exists (built version)
import { existsSync } from 'fs';

const builtServerPath = join(__dirname, 'dist', 'index.js');
const sourceServerPath = join(__dirname, 'server', 'index.ts');

if (existsSync(builtServerPath)) {
  console.log('Using built server from dist/index.js');
  // Start the built production server
  const server = spawn('node', [builtServerPath], {
    stdio: 'inherit',
    env: process.env
  });
  
  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
  
  server.on('exit', (code) => {
    process.exit(code);
  });
} else {
  console.log('Built server not found, running from source with tsx');
  // Fallback to running from source with tsx
  const server = spawn('npx', ['tsx', sourceServerPath], {
    stdio: 'inherit',
    env: process.env
  });
  
  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
  
  server.on('exit', (code) => {
    process.exit(code);
  });
}