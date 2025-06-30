#!/usr/bin/env node

// Production server entry point - completely clean
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || '5000';

import('./dist/index.js').catch(err => {
  console.error('Server failed to start:', err);
  process.exit(1);
});