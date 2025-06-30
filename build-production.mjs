#!/usr/bin/env node

import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔨 Building production server...');

// Simple path resolver that bundles everything
const bundleAllPlugin = {
  name: 'bundle-all',
  setup(build) {
    build.onResolve({ filter: /^@shared\// }, (args) => {
      const path = args.path.replace('@shared/', './shared/');
      const fullPath = resolve(__dirname, path + '.ts');
      return { path: fullPath };
    });
  },
};

try {
  await build({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: 'dist/server.js',
    external: [
      'express',
      'cors', 
      'pg',
      'drizzle-orm',
      'axios',
      'stripe'
    ],
    plugins: [bundleAllPlugin],
    banner: {
      js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);'
    },
  });

  console.log('✅ Production server built successfully');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}