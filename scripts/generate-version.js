#!/usr/bin/env node
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const version = {
  version: '1.0.0',
  buildTime: new Date().toISOString(),
  buildTimestamp: Date.now()
};

// Write version.json for backend
const versionPath = join(__dirname, '../server/version.json');
writeFileSync(versionPath, JSON.stringify(version, null, 2));

console.log('✓ Generated version.json:', version);

// Update service worker CACHE_VERSION
const swPath = join(__dirname, '../client/public/sw.js');
const swContent = `// Enhanced Service Worker for Offline Capabilities & Push Notifications - Version ${version.version}
// Updated: ${new Date().toISOString().split('T')[0]} - Auto-generated cache version

// Cache configuration with timestamp for guaranteed cache busting
const CACHE_VERSION = 'v${version.version}-${version.buildTimestamp}';`;

// Read existing sw.js
import { readFileSync } from 'fs';
const existingSw = readFileSync(swPath, 'utf-8');

// Replace the first 5 lines (header + CACHE_VERSION)
const swLines = existingSw.split('\n');
const newSwContent = [
  ...swContent.split('\n'),
  ...swLines.slice(5)
].join('\n');

writeFileSync(swPath, newSwContent);

console.log('✓ Updated sw.js CACHE_VERSION to:', `v${version.version}-${version.buildTimestamp}`);
