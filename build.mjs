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
      const path = args.path.replace('@shared/', './shared/');
      return { path: resolve(__dirname, path) };
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
        // Keep node modules external
        'pg-native',
        'fsevents'
      ],
      plugins: [pathResolverPlugin],
      sourcemap: false,
      minify: false, // Keep readable for debugging
      treeShaking: true,
    });

    console.log('✅ Server build completed successfully');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

buildServer();