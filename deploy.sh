#!/bin/bash

# Production deployment script for Ezras Nashim
echo "🚀 Starting production deployment for Ezras Nashim..."

# Set production environment
export NODE_ENV=production
export PORT=5000

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Build frontend and backend
echo "🔨 Building application..."
vite build && node build.mjs

# Verify build artifacts
if [ ! -f "dist/index.js" ]; then
    echo "❌ Backend build failed - dist/index.js not found"
    exit 1
fi

if [ ! -f "dist/public/index.html" ]; then
    echo "❌ Frontend build failed - dist/public/index.html not found"
    exit 1
fi

echo "✅ Build completed successfully"
echo "📦 Frontend: dist/public/"
echo "📦 Backend: dist/index.js"

# Start production server
echo "🌐 Starting production server..."
node start.js