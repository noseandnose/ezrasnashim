#!/usr/bin/env node

// Deployment configuration checker
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Deployment Configuration Check');
console.log('================================');

// Check if required files exist
const requiredFiles = [
  'production.js',
  'build.mjs',
  'replit.deployment.toml'
];

console.log('\n📁 Required Files:');
requiredFiles.forEach(file => {
  const exists = existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// Check deployment configuration
console.log('\n⚙️  Deployment Configuration:');
if (existsSync('replit.deployment.toml')) {
  const deployConfig = readFileSync('replit.deployment.toml', 'utf8');
  console.log('  ✅ replit.deployment.toml exists');
  console.log('  📝 Content preview:');
  console.log(deployConfig.split('\n').slice(0, 10).map(line => `    ${line}`).join('\n'));
} else {
  console.log('  ❌ replit.deployment.toml missing');
}

// Check build output
console.log('\n🔨 Build Output:');
const buildPaths = [
  'dist/index.js',
  'dist/public/index.html'
];

buildPaths.forEach(path => {
  const exists = existsSync(path);
  console.log(`  ${exists ? '✅' : '❌'} ${path}`);
});

// Environment check
console.log('\n🌍 Environment Variables:');
console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`  PORT: ${process.env.PORT || 'not set'}`);
console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? 'set' : 'not set'}`);

console.log('\n✨ Deployment Status:');
const allRequiredExist = requiredFiles.every(file => existsSync(file));
const buildComplete = buildPaths.every(path => existsSync(path));

if (allRequiredExist && buildComplete) {
  console.log('  ✅ Ready for deployment');
  console.log('  💡 The .replit file contains development settings, but');
  console.log('     replit.deployment.toml will override these for production deployment');
} else {
  console.log('  ❌ Not ready for deployment');
  if (!buildComplete) {
    console.log('  💡 Run: vite build && node build.mjs');
  }
}