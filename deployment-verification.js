#!/usr/bin/env node

// Production deployment verification script
import { existsSync, readFileSync } from 'fs';

console.log('🔍 Production Deployment Verification');
console.log('====================================');

let allChecksPass = true;

// Check required production files
console.log('\n📁 Required Production Files:');
const requiredFiles = [
  'app.js',
  'build.mjs', 
  'dist/index.js',
  'dist/public/index.html',
  'dist/public/assets',
  'replit.deployment.toml'
];

requiredFiles.forEach(file => {
  const exists = existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allChecksPass = false;
});

// Verify deployment configuration
console.log('\n⚙️  Deployment Configuration Check:');
try {
  const deployConfig = readFileSync('replit.deployment.toml', 'utf8');
  
  const hasProductionBuild = deployConfig.includes('npm", "run", "build');
  const hasCleanRunCommand = deployConfig.includes('node", "app.js');
  const hasProductionEnv = deployConfig.includes('NODE_ENV = "production"');
  const hasPublicDir = deployConfig.includes('path = "dist/public"');
  const hasAutoscale = deployConfig.includes('deploymentTarget = "autoscale"');
  
  console.log(`  ${hasProductionBuild ? '✅' : '❌'} Production build command`);
  console.log(`  ${hasCleanRunCommand ? '✅' : '❌'} Clean run command`);
  console.log(`  ${hasProductionEnv ? '✅' : '❌'} Production environment`);
  console.log(`  ${hasPublicDir ? '✅' : '❌'} Static files directory`);
  console.log(`  ${hasAutoscale ? '✅' : '❌'} Autoscale deployment target`);
  
  // Check for any development references
  const hasNoDevReferences = !deployConfig.toLowerCase().includes('dev');
  console.log(`  ${hasNoDevReferences ? '✅' : '❌'} No development command references`);
  
  if (!hasProductionBuild || !hasCleanRunCommand || !hasProductionEnv || !hasPublicDir || !hasAutoscale || !hasNoDevReferences) {
    allChecksPass = false;
  }
  
} catch (error) {
  console.log('  ❌ Could not read deployment configuration');
  allChecksPass = false;
}

// Check environment variables
console.log('\n🌍 Environment Configuration:');
const envChecks = [
  { name: 'DATABASE_URL', required: true },
  { name: 'NODE_ENV', expected: 'production' },
  { name: 'PORT', expected: '5000' }
];

envChecks.forEach(({ name, required, expected }) => {
  const value = process.env[name];
  if (required && !value) {
    console.log(`  ❌ ${name}: missing (required)`);
    allChecksPass = false;
  } else if (expected && value !== expected) {
    console.log(`  ⚠️  ${name}: ${value || 'not set'} (expected: ${expected})`);
  } else {
    console.log(`  ✅ ${name}: ${value ? 'configured' : 'not set'}`);
  }
});

// Final deployment status
console.log('\n🚀 Deployment Status:');
if (allChecksPass) {
  console.log('  ✅ Ready for production deployment');
  console.log('  📝 Configuration Summary:');
  console.log('     • Build: npm run build (creates dist/ folder)');
  console.log('     • Run: node app.js (production entry point)');
  console.log('     • Environment: NODE_ENV=production');
  console.log('     • Static files: dist/public/');
  console.log('     • Target: autoscale deployment');
  console.log('\n💡 Next Steps:');
  console.log('   1. Click Deploy button in Replit');
  console.log('   2. Deployment will use replit.deployment.toml configuration');
  console.log('   3. Build process will run automatically');
  console.log('   4. Application will start with node app.js');
} else {
  console.log('  ❌ Deployment configuration issues found');
  console.log('  🔧 Please resolve the issues above before deploying');
}

console.log('\n' + '='.repeat(50));