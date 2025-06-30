#!/bin/bash

echo "Building Ezras Nashim for production..."

# Set production environment
export NODE_ENV=production

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist

# Install dependencies
echo "Installing dependencies..."
npm ci --omit=dev

# Build frontend
echo "Building frontend..."
npm run build

# Ensure the dist directory has the correct structure
echo "Verifying build output..."
ls -la dist/

echo "Production build complete!"
echo "Built files:"
echo "- Frontend: dist/public/"
echo "- Backend: dist/index.js"