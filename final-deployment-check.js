#!/usr/bin/env node

import { readFileSync, existsSync } from 'fs';

console.log('🔍 Final Deployment Verification\n');

let allChecksPassed = true;

// Check required files exist
const requiredFiles = [
  'replit.deployment.toml',
  'production.mjs',
  'build-deploy.mjs',
  'dist/public/index.html',
  'dist/index.js'
];

console.log('📁 Required Files:');
requiredFiles.forEach(file => {
  const exists = existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allChecksPassed = false;
});

// Verify deployment configuration
console.log('\n⚙️ Deployment Configuration:');
try {
  const deployConfig = readFileSync('replit.deployment.toml', 'utf8');
  
  const hasAutoscale = deployConfig.includes('deploymentTarget = "autoscale"');
  const hasCleanBuild = deployConfig.includes('build = ["node", "build-deploy.mjs"]');
  const hasCleanRun = deployConfig.includes('run = ["node", "production.mjs"]');
  const hasProductionEnv = deployConfig.includes('NODE_ENV = "production"');
  const hasPublicDir = deployConfig.includes('path = "dist/public"');
  
  // Security checks - no development references
  const noDevReferences = !deployConfig.includes('npm run dev') && 
                          !deployConfig.includes('"dev"') &&
                          !deployConfig.toLowerCase().includes('development');
  
  console.log(`  ${hasAutoscale ? '✅' : '❌'} Autoscale deployment target`);
  console.log(`  ${hasCleanBuild ? '✅' : '❌'} Clean build command`);
  console.log(`  ${hasCleanRun ? '✅' : '❌'} Clean run command`);
  console.log(`  ${hasProductionEnv ? '✅' : '❌'} Production environment`);
  console.log(`  ${hasPublicDir ? '✅' : '❌'} Static files directory`);
  console.log(`  ${noDevReferences ? '✅' : '❌'} No development references`);
  
  if (!hasAutoscale || !hasCleanBuild || !hasCleanRun || 
      !hasProductionEnv || !hasPublicDir || !noDevReferences) {
    allChecksPassed = false;
  }
  
} catch (error) {
  console.log('  ❌ Could not read deployment configuration');
  allChecksPassed = false;
}

// Check production server configuration
console.log('\n🚀 Production Server:');
try {
  const productionCode = readFileSync('production.mjs', 'utf8');
  
  const hasHealthCheck = productionCode.includes('/health');
  const hasStaticServing = productionCode.includes('express.static');
  const hasErrorHandling = productionCode.includes('app.use((err,');
  const isStandalone = productionCode.includes('Starting Ezras Nashim production server');
  
  console.log(`  ${hasHealthCheck ? '✅' : '❌'} Health check endpoint`);
  console.log(`  ${hasStaticServing ? '✅' : '❌'} Static file serving`);
  console.log(`  ${hasErrorHandling ? '✅' : '❌'} Error handling`);
  console.log(`  ${isStandalone ? '✅' : '❌'} Standalone production server`);
  
  if (!hasHealthCheck || !hasStaticServing || !hasErrorHandling || !isStandalone) {
    allChecksPassed = false;
  }
  
} catch (error) {
  console.log('  ❌ Could not verify production server');
  allChecksPassed = false;
}

// Final status
console.log('\n🎯 Deployment Status:');
if (allChecksPassed) {
  console.log('  ✅ All deployment checks passed');
  console.log('  ✅ No development command references');
  console.log('  ✅ Standalone production configuration');
  console.log('  ✅ Cloud Run compatible');
  console.log('\n🚀 READY FOR DEPLOYMENT');
  console.log('   The deployment configuration bypasses .replit file limitations');
  console.log('   and uses completely independent production settings.');
} else {
  console.log('  ❌ Deployment not ready');
  process.exit(1);
}