#!/usr/bin/env node

// Simple deployment build script
import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';

console.log('🚀 Simple production build...');

// Ensure dist directory exists
if (!existsSync('dist')) {
  mkdirSync('dist', { recursive: true });
}

// Step 1: Build frontend only
console.log('📦 Building frontend...');
const viteBuild = spawn('npx', ['vite', 'build'], { stdio: 'inherit' });

viteBuild.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Frontend build failed');
    process.exit(1);
  }
  
  console.log('✅ Frontend build complete');
  
  // Step 2: Use package.json build script for backend
  console.log('📦 Building backend...');
  const backendBuild = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
  
  backendBuild.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Backend build failed');
      process.exit(1);
    }
    
    console.log('✅ Backend build complete');
    
    // Verify required files exist
    const requiredFiles = [
      'dist/public/index.html',
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