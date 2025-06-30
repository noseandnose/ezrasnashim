#!/usr/bin/env node

import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Building production server...');

try {
  await build({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    outdir: 'dist',
    packages: 'external',
    sourcemap: false,
    minify: false,
    // Resolve the @shared alias
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
    // External packages that should not be bundled
    external: [
      'express',
      'cors',
      'pg',
      'drizzle-orm',
      'axios',
      '@neondatabase/serverless',
      'express-session',
      'connect-pg-simple',
      'memorystore',
      'passport',
      'passport-local',
      'stripe',
      'ws',
    ],
  });
  
  console.log('✅ Production server build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}