#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';

console.log('Building for deployment...');

// Clean previous build
if (existsSync('dist')) {
  rmSync('dist', { recursive: true, force: true });
}

try {
  // Build frontend
  console.log('Building frontend...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Build backend
  console.log('Building backend...');
  execSync(`npx esbuild server/index.ts --platform=node --target=node20 --format=esm --bundle --outdir=dist --packages=external --alias:@shared=./shared --external:express --external:cors --external:pg --external:drizzle-orm --external:axios --external:@neondatabase/serverless --external:express-session --external:connect-pg-simple --external:memorystore --external:passport --external:passport-local --external:stripe --external:ws`, { stdio: 'inherit' });

  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}