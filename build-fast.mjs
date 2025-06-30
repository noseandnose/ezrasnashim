#!/usr/bin/env node

import { build } from 'esbuild';
import { existsSync } from 'fs';

console.log('🔨 Fast production build...');

try {
  await build({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: 'dist/index.js',
    external: ['pg-native'],
    minify: false,
    sourcemap: false
  });

  // Verify output
  if (existsSync('dist/index.js')) {
    console.log('✅ Backend built successfully');
  } else {
    console.error('❌ Build output missing');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}