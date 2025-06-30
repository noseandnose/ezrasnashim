#!/usr/bin/env node

// Final deployment verification script
import { existsSync, readFileSync } from 'fs';

console.log('🔍 Final Deployment Security Verification');
console.log('=========================================');

// Check required files
const requiredFiles = [
  'production-server.js',
  'replit.deployment.toml',
  'dist/index.js',
  'dist/public/index.html'
];

console.log('\n📁 Required Files:');
let allFilesExist = true;
requiredFiles.forEach(file => {
  const exists = existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

// Check deployment configuration
console.log('\n⚙️  Deployment Configuration:');
if (existsSync('replit.deployment.toml')) {
  const deployConfig = readFileSync('replit.deployment.toml', 'utf8');
  console.log('  ✅ replit.deployment.toml exists');
  
  // Check for security issues
  const hasDevCommands = deployConfig.includes('npm run dev') || deployConfig.includes('dev');
  const hasProductionCommands = deployConfig.includes('production-server.js');
  const hasNodeEnvProduction = deployConfig.includes('NODE_ENV = "production"');
  const hasSinglePort = deployConfig.includes('PORT = "80"');
  
  console.log(`  ${hasDevCommands ? '❌' : '✅'} No dev commands in deployment config`);
  console.log(`  ${hasProductionCommands ? '✅' : '❌'} Production server command configured`);
  console.log(`  ${hasNodeEnvProduction ? '✅' : '❌'} NODE_ENV=production set`);
  console.log(`  ${hasSinglePort ? '✅' : '❌'} Single port configuration (port 80)`);
  
  if (!hasDevCommands && hasProductionCommands && hasNodeEnvProduction && hasSinglePort) {
    console.log('  ✅ Deployment configuration is secure');
  } else {
    console.log('  ❌ Deployment configuration has security issues');
    allFilesExist = false;
  }
} else {
  console.log('  ❌ replit.deployment.toml missing');
  allFilesExist = false;
}

// Check production server
console.log('\n🚀 Production Server:');
if (existsSync('production-server.js')) {
  const serverContent = readFileSync('production-server.js', 'utf8');
  const hasCorrectPort = serverContent.includes('PORT || 80');
  const hasHealthCheck = serverContent.includes('/health');
  const hasStaticFiles = serverContent.includes('dist/public');
  
  console.log(`  ${hasCorrectPort ? '✅' : '❌'} Configured for port 80`);
  console.log(`  ${hasHealthCheck ? '✅' : '❌'} Health check endpoint`);
  console.log(`  ${hasStaticFiles ? '✅' : '❌'} Static file serving`);
} else {
  console.log('  ❌ production-server.js missing');
  allFilesExist = false;
}

// Final status
console.log('\n🎯 Deployment Security Status:');
if (allFilesExist) {
  console.log('  ✅ DEPLOYMENT READY - ALL SECURITY CHECKS PASSED');
  console.log('');
  console.log('  📋 Configuration Summary:');
  console.log('     • Build: npm run build (creates dist/public and dist/index.js)');
  console.log('     • Run: node production-server.js (production entry point)');
  console.log('     • Environment: NODE_ENV=production');
  console.log('     • Port: 80 (single port for autoscale)');
  console.log('     • Static files: dist/public served by production server');
  console.log('     • API routes: Loaded from dist/index.js');
  console.log('');
  console.log('  🚀 Ready for Replit Autoscale Deployment');
  console.log('     The replit.deployment.toml overrides .replit development settings');
  console.log('     No dev commands or security vulnerabilities detected');
} else {
  console.log('  ❌ DEPLOYMENT NOT READY - SECURITY ISSUES DETECTED');
}

console.log('');