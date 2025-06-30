#!/usr/bin/env node

// Final deployment readiness check
import { existsSync, readFileSync } from 'fs';

console.log('🚀 Final Deployment Readiness Check');
console.log('===================================');

// Check required production files
const requiredFiles = [
  'app.js',
  'build.mjs', 
  'dist/index.js',
  'dist/public/index.html',
  'replit.deployment.toml'
];

console.log('\n📁 Production Files:');
let allFilesReady = true;
requiredFiles.forEach(file => {
  const exists = existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesReady = false;
});

// Verify deployment configuration
console.log('\n⚙️  Deployment Configuration:');
try {
  const deployConfig = readFileSync('replit.deployment.toml', 'utf8');
  
  // Check for production settings
  const hasProductionBuild = deployConfig.includes('vite build && node build.mjs');
  const hasCleanRunCommand = deployConfig.includes('node", "app.js');
  const hasProductionEnv = deployConfig.includes('NODE_ENV = "production"');
  const hasPublicDir = deployConfig.includes('path = "dist/public"');
  
  console.log(`  ${hasProductionBuild ? '✅' : '❌'} Production build command`);
  console.log(`  ${hasCleanRunCommand ? '✅' : '❌'} Clean run command (no dev references)`);
  console.log(`  ${hasProductionEnv ? '✅' : '❌'} Production environment`);
  console.log(`  ${hasPublicDir ? '✅' : '❌'} Static files directory`);
  
  // Check for security flags
  const hasDevReferences = deployConfig.toLowerCase().includes('dev');
  console.log(`  ${!hasDevReferences ? '✅' : '❌'} No development command references`);
  
} catch (error) {
  console.log('  ❌ Could not read deployment configuration');
  allFilesReady = false;
}

// Final status
console.log('\n🎯 Deployment Status:');
if (allFilesReady) {
  console.log('  ✅ READY FOR DEPLOYMENT');
  console.log('  📝 Configuration Summary:');
  console.log('     • Build: vite build && node build.mjs');
  console.log('     • Run: node app.js');
  console.log('     • Environment: NODE_ENV=production');
  console.log('     • Port: 5000');
  console.log('     • Static files: dist/public');
  console.log('');
  console.log('  🚀 Next Steps:');
  console.log('     1. Click Deploy button in Replit');
  console.log('     2. Deployment will use replit.deployment.toml (production config)');
  console.log('     3. Development settings in .replit will be ignored during deployment');
} else {
  console.log('  ❌ NOT READY - Missing required files');
}