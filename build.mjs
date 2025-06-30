#!/usr/bin/env node

import { build } from 'esbuild';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read tsconfig to get path mappings
const tsconfig = JSON.parse(readFileSync(resolve(__dirname, 'tsconfig.json'), 'utf8'));
const paths = tsconfig.compilerOptions?.paths || {};

// Create path resolution plugin
const pathResolverPlugin = {
  name: 'path-resolver',
  setup(build) {
    // Resolve @shared/* to ./shared/*
    build.onResolve({ filter: /^@shared\// }, (args) => {
      const relativePath = args.path.replace('@shared/', './shared/');
      const fullPath = resolve(__dirname, relativePath);
      
      // Check if it's a TypeScript file and add .ts extension if needed
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
        // Keep all node modules external to avoid bundling issues
        'express',
        'cors',
        'pg',
        'drizzle-orm',
        'axios',
        'stripe',
        'pg-native',
        'fsevents'
      ],
      // Bundle the shared schema to avoid import resolution issues
      alias: {
        '@shared/schema': './shared/schema.ts'
      },
      plugins: [pathResolverPlugin],
      sourcemap: false,
      minify: false,
      treeShaking: true,
      banner: {
        js: 'import { createRequire } from "module"; const require = createRequire(import.meta.url);'
      },
    });

    console.log('✅ Server build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildServer();