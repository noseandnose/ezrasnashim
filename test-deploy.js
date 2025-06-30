#!/usr/bin/env node

// Test if the deployment configuration is working
console.log('Testing deployment configuration...');

// Check if required files exist
import { existsSync } from 'fs';

const requiredFiles = [
  'dist/index.js',
  'dist/public/index.html',
  'replit.deployment.toml'
];

let allGood = true;

requiredFiles.forEach(file => {
  if (existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
    allGood = false;
  }
});

if (allGood) {
  console.log('✅ All deployment files are ready');
  
  // Test the actual deployment entry point
  try {
    console.log('Testing main.js entry point...');
    await import('./main.js');
    console.log('✅ Entry point works correctly');
  } catch (error) {
    console.log('❌ Entry point failed:', error.message);
  }
} else {
  console.log('❌ Deployment not ready - missing files');
}
