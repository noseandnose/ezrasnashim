#!/usr/bin/env node

// Production build script for Ezras Nashim
// Builds frontend and backend for deployment

import { build } from 'esbuild';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path resolution plugin for @shared imports
const pathResolverPlugin = {
  name: 'path-resolver',
  setup(build) {
    build.onResolve({ filter: /^@shared\// }, (args) => {
      const relativePath = args.path.replace('@shared/', './shared/');
      const fullPath = resolve(__dirname, relativePath);
      
      if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.js')) {
        return { path: fullPath + '.ts' };
      }
      
      return { path: fullPath };
    });
  },
};

async function buildServer() {
  try {
    console.log('Building server for production...');
    
    await build({
      entryPoints: ['server/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'esm',
      outdir: 'dist',
      external: [
        'express',
        'cors',
        'pg',
        'drizzle-orm',
        'axios',
        'stripe',
        'pg-native',
        'fsevents'
      ],
      plugins: [pathResolverPlugin],
      sourcemap: false,
      minify: false,
      treeShaking: true,
      banner: {
        js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);'
      },
    });

    console.log('Server build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildServer();