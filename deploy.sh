#!/bin/bash

# Deployment script for Ezras Nashim
echo "🕯️ Preparing Ezras Nashim for deployment..."

# Set production environment
export NODE_ENV=production

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist

# Install production dependencies only
echo "📦 Installing production dependencies..."
npm ci --omit=dev --silent

# Run the build process
echo "🔨 Building application..."
npm run build

# Verify build output
if [ -f "dist/index.js" ] && [ -d "dist/public" ]; then
    echo "✅ Build successful!"
    echo "📁 Built files:"
    echo "   - Backend: dist/index.js"
    echo "   - Frontend: dist/public/"
    echo "🚀 Ready for deployment!"
else
    echo "❌ Build failed - missing output files"
    exit 1
fi

echo "💡 To start production server: node start.js"