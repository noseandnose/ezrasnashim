#!/bin/bash

echo "🚀 Ezras Nashim Deployment Script"
echo "================================="

# Set production environment
export NODE_ENV=production
export PORT=5000

echo "📦 Building frontend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed"
    exit 1
fi

echo "📦 Building backend..."
node build.mjs

if [ $? -ne 0 ]; then
    echo "❌ Backend build failed"
    exit 1
fi

echo "✅ Build completed successfully"
echo ""
echo "🔍 Verifying deployment configuration..."
node deploy-check.js

echo ""
echo "🎯 Deployment ready!"
echo "The application can now be deployed using:"
echo "  • replit.deployment.toml configuration"
echo "  • Production entry point: node production.js"
echo "  • Environment: NODE_ENV=production"
echo "  • Port: 5000"