#!/bin/bash

echo "🔧 Starting production build process..."

# Clean previous build
rm -rf dist

# Build frontend
echo "📦 Building frontend..."
npx vite build

# Build backend with proper module resolution
echo "🚀 Building backend..."
npx esbuild server/index.ts \
  --platform=node \
  --target=node20 \
  --format=esm \
  --bundle \
  --outdir=dist \
  --packages=external \
  --alias:@shared=./shared \
  --external:express \
  --external:cors \
  --external:pg \
  --external:drizzle-orm \
  --external:axios \
  --external:@neondatabase/serverless \
  --external:express-session \
  --external:connect-pg-simple \
  --external:memorystore \
  --external:passport \
  --external:passport-local \
  --external:stripe \
  --external:ws

echo "✅ Production build completed successfully"