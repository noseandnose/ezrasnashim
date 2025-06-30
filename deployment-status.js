#!/usr/bin/env node

// Final deployment readiness verification
import { existsSync, readFileSync } from 'fs';

console.log('🚀 Deployment Readiness Check');
console.log('===============================');

const checks = [
  {
    name: 'Production Server Entry Point',
    file: 'production-server.js',
    required: true
  },
  {
    name: 'Frontend Build Output',
    file: 'dist/public/index.html',
    required: true
  },
  {
    name: 'Backend Build Output', 
    file: 'dist/index.js',
    required: true
  },
  {
    name: 'Deployment Configuration',
    file: 'replit.deployment.toml',
    required: true
  }
];

let allPassed = true;

checks.forEach(check => {
  const exists = existsSync(check.file);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${check.name}: ${check.file}`);
  
  if (!exists && check.required) {
    allPassed = false;
  }
});

// Verify deployment config
if (existsSync('replit.deployment.toml')) {
  const config = readFileSync('replit.deployment.toml', 'utf8');
  const hasProductionEnv = config.includes('NODE_ENV = "production"');
  const hasCleanCommands = !config.includes('dev') && !config.includes('development');
  const hasCorrectRun = config.includes('node", "production-server.js');
  
  console.log(`${hasProductionEnv ? '✅' : '❌'} Production Environment Set`);
  console.log(`${hasCleanCommands ? '✅' : '❌'} No Development Commands`);
  console.log(`${hasCorrectRun ? '✅' : '❌'} Correct Run Command`);
  
  allPassed = allPassed && hasProductionEnv && hasCleanCommands && hasCorrectRun;
}

console.log('\n' + '='.repeat(35));
if (allPassed) {
  console.log('🎉 DEPLOYMENT READY');
  console.log('All security checks passed');
  console.log('Ready for Replit autoscale deployment');
} else {
  console.log('❌ DEPLOYMENT BLOCKED');
  console.log('Fix the issues above before deploying');
  process.exit(1);
}