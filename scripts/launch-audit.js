#!/usr/bin/env node

/**
 * Launch Audit Script for Ezras Nashim
 * Verifies app readiness for production launch
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Ezras Nashim Launch Audit - Starting...\n');

// Store results
const results = {
  compass: { status: 'pending', issues: [] },
  modals: { status: 'pending', issues: [] },
  performance: { status: 'pending', issues: [] },
  build: { status: 'pending', issues: [] },
  overall: 'pending'
};

// 1. COMPASS AUDIT
console.log('📍 Priority 1: Compass Simplification Audit');
console.log('----------------------------------------');
try {
  // Check compass implementation
  const compassFile = fs.readFileSync(
    path.join(__dirname, '../client/src/components/modals/tefilla-modals.tsx'),
    'utf8'
  );
  
  // Check for removed complexity
  const removedFeatures = [
    { pattern: /getMagneticDeclination/, name: 'Magnetic declination calculation' },
    { pattern: /smoothing|filter|smooth/, name: 'Smoothing filters' },
    { pattern: /tiltCompensation|tilt/, name: 'Tilt compensation' },
    { pattern: /calibration|calibrate/, name: 'Complex calibration' }
  ];
  
  let compassClean = true;
  removedFeatures.forEach(({ pattern, name }) => {
    if (pattern.test(compassFile)) {
      results.compass.issues.push(`❌ Still contains: ${name}`);
      compassClean = false;
    } else {
      console.log(`✅ Removed: ${name}`);
    }
  });
  
  // Check for required features
  const requiredFeatures = [
    { pattern: /31\.7767.*35\.2345/, name: 'Jerusalem fallback coordinates' },
    { pattern: /webkitCompassHeading/, name: 'iOS compass support' },
    { pattern: /requestPermission/, name: 'iOS permission handling' }
  ];
  
  requiredFeatures.forEach(({ pattern, name }) => {
    if (pattern.test(compassFile)) {
      console.log(`✅ Present: ${name}`);
    } else {
      results.compass.issues.push(`❌ Missing: ${name}`);
      compassClean = false;
    }
  });
  
  results.compass.status = compassClean ? 'passed' : 'failed';
  console.log(`\nCompass Audit: ${results.compass.status.toUpperCase()}\n`);
} catch (error) {
  console.error('❌ Compass audit failed:', error.message);
  results.compass.status = 'error';
}

// 2. MODAL MIGRATION AUDIT
console.log('🎭 Priority 2: Modal Migration Audit');
console.log('-----------------------------------');
try {
  // Check for fullscreen modal usage
  const modalFiles = [
    'torah-modals.tsx',
    'tefilla-modals.tsx',
    'table-modals.tsx',
    'birkat-hamazon-modal.tsx'
  ];
  
  let allFullscreen = true;
  modalFiles.forEach(file => {
    const content = fs.readFileSync(
      path.join(__dirname, '../client/src/components/modals/', file),
      'utf8'
    );
    
    if (content.includes('FullscreenModal')) {
      console.log(`✅ ${file}: Using FullscreenModal`);
    } else {
      console.log(`⚠️  ${file}: Not using FullscreenModal`);
      results.modals.issues.push(`${file} not migrated to fullscreen`);
      allFullscreen = false;
    }
  });
  
  // Check for text preservation
  const criticalTexts = [
    'Morning Brochas',
    'Mincha',
    'Maariv',
    'Tehillim',
    'Nishmas'
  ];
  
  console.log('\nText Preservation Check:');
  const tefillaModals = fs.readFileSync(
    path.join(__dirname, '../client/src/components/modals/tefilla-modals.tsx'),
    'utf8'
  );
  
  criticalTexts.forEach(text => {
    if (tefillaModals.includes(text)) {
      console.log(`✅ Found: ${text}`);
    } else {
      console.log(`❌ Missing: ${text}`);
      results.modals.issues.push(`Missing text: ${text}`);
      allFullscreen = false;
    }
  });
  
  results.modals.status = allFullscreen ? 'passed' : 'failed';
  console.log(`\nModal Audit: ${results.modals.status.toUpperCase()}\n`);
} catch (error) {
  console.error('❌ Modal audit failed:', error.message);
  results.modals.status = 'error';
}

// 3. PERFORMANCE AUDIT
console.log('⚡ Priority 3: Performance Optimization Audit');
console.log('--------------------------------------------');
try {
  // Check for lazy loading
  const appFile = fs.readFileSync(
    path.join(__dirname, '../client/src/App.tsx'),
    'utf8'
  );
  
  const performanceChecks = [];
  
  // Check lazy loading
  if (appFile.includes('React.lazy') || appFile.includes('lazy(')) {
    console.log('✅ Lazy loading implemented');
  } else {
    console.log('⚠️  No lazy loading detected');
    results.performance.issues.push('No lazy loading implemented');
  }
  
  // Check for service worker
  if (fs.existsSync(path.join(__dirname, '../client/public/service-worker.js'))) {
    console.log('✅ Service worker present');
  } else {
    console.log('⚠️  Service worker not found');
    results.performance.issues.push('Service worker missing');
  }
  
  // Check for debouncing
  const hasDebounce = execSync('grep -r "debounce\\|throttle" client/src --include="*.tsx" --include="*.ts" | wc -l', { encoding: 'utf8' }).trim();
  if (parseInt(hasDebounce) > 0) {
    console.log('✅ Debouncing/throttling found');
  } else {
    console.log('⚠️  No debouncing detected');
    results.performance.issues.push('No debouncing implemented');
  }
  
  // Check bundle size
  console.log('\nChecking dependencies...');
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
  const deps = Object.keys(packageJson.dependencies || {});
  console.log(`Total dependencies: ${deps.length}`);
  
  // Check for unused large deps
  const largeDeps = ['moment', 'lodash', 'jquery'];
  largeDeps.forEach(dep => {
    if (deps.includes(dep)) {
      console.log(`⚠️  Large dependency found: ${dep}`);
      results.performance.issues.push(`Large dependency: ${dep}`);
    }
  });
  
  results.performance.status = results.performance.issues.length === 0 ? 'passed' : 'warning';
  console.log(`\nPerformance Audit: ${results.performance.status.toUpperCase()}\n`);
} catch (error) {
  console.error('❌ Performance audit failed:', error.message);
  results.performance.status = 'error';
}

// 4. BUILD & TYPE CHECK
console.log('🔨 Build & Type Verification');
console.log('---------------------------');
try {
  console.log('Running TypeScript check...');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript check passed');
  
  console.log('Testing build...');
  // Just check if build command exists, don't run full build
  const scripts = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')).scripts;
  if (scripts.build) {
    console.log('✅ Build script available');
    results.build.status = 'passed';
  } else {
    console.log('❌ Build script not found');
    results.build.status = 'failed';
  }
} catch (error) {
  console.error('❌ Type check failed');
  results.build.status = 'failed';
  results.build.issues.push(error.message);
}

// FINAL REPORT
console.log('\n' + '='.repeat(50));
console.log('📊 LAUNCH READINESS REPORT');
console.log('='.repeat(50));

const allPassed = Object.values(results)
  .filter(r => typeof r === 'object' && r.status)
  .every(r => r.status === 'passed' || r.status === 'warning');

results.overall = allPassed ? 'READY' : 'NOT READY';

console.log(`
Priority 1 - Compass:     ${results.compass.status.toUpperCase()} ${results.compass.issues.length > 0 ? '(' + results.compass.issues.length + ' issues)' : '✓'}
Priority 2 - Modals:      ${results.modals.status.toUpperCase()} ${results.modals.issues.length > 0 ? '(' + results.modals.issues.length + ' issues)' : '✓'}
Priority 3 - Performance: ${results.performance.status.toUpperCase()} ${results.performance.issues.length > 0 ? '(' + results.performance.issues.length + ' warnings)' : '✓'}
Build & Types:            ${results.build.status.toUpperCase()} ${results.build.issues.length > 0 ? '(' + results.build.issues.length + ' issues)' : '✓'}

OVERALL STATUS: ${results.overall}
`);

if (results.overall === 'NOT READY') {
  console.log('Issues to address:');
  Object.entries(results).forEach(([key, value]) => {
    if (value.issues && value.issues.length > 0) {
      console.log(`\n${key}:`);
      value.issues.forEach(issue => console.log(`  - ${issue}`));
    }
  });
}

// Write report to file
fs.writeFileSync(
  path.join(__dirname, '../launch-audit-report.json'),
  JSON.stringify(results, null, 2)
);

console.log('\nDetailed report saved to: launch-audit-report.json');
console.log('\n🚀 Launch audit complete!');

process.exit(results.overall === 'READY' ? 0 : 1);