#!/bin/bash

# Production build script for Ezras Nashim
echo "🏗️  Building Ezras Nashim for production..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Build frontend with Vite
echo "⚛️  Building frontend..."
npm run build:frontend || {
    echo "❌ Frontend build failed"
    exit 1
}

# Build backend with proper path resolution
echo "🚀 Building backend..."
npm run build:backend || {
    echo "❌ Backend build failed"
    exit 1
}

echo "✅ Production build completed successfully!"
echo "📁 Built files:"
echo "   - Frontend: dist/public/"
echo "   - Backend: dist/index.js"