#!/usr/bin/env node

// Production build script for deployment
import { spawn } from 'child_process';
import { existsSync } from 'fs';

console.log('🚀 Starting production build...');

// Step 1: Frontend build
console.log('📦 Building frontend...');
const viteBuild = spawn('npx', ['vite', 'build'], { stdio: 'inherit' });

viteBuild.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Frontend build failed');
    process.exit(1);
  }
  
  console.log('✅ Frontend build complete');
  
  // Step 2: Backend build
  console.log('📦 Building backend...');
  const backendBuild = spawn('node', ['build-fast.mjs'], { stdio: 'inherit' });
  
  backendBuild.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Backend build failed');
      process.exit(1);
    }
    
    console.log('✅ Backend build complete');
    
    // Verify build outputs
    const requiredFiles = [
      'dist/public/index.html',
      'dist/index.js',
      'production-server.js'
    ];
    
    const missing = requiredFiles.filter(file => !existsSync(file));
    if (missing.length > 0) {
      console.error('❌ Missing files:', missing);
      process.exit(1);
    }
    
    console.log('🎉 Production build successful!');
  });
});