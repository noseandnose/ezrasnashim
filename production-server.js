#!/usr/bin/env node

// Standalone production server for Replit deployment
// This file is completely independent of development configurations

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Ezras Nashim production server...');

// Initialize Express app
const app = express();

// Configure CORS
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    return callback(null, origin);
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      console.log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// Import and register API routes from the built server
let apiRoutes;
try {
  const serverModule = await import('./dist/server.js');
  apiRoutes = serverModule.app;
  console.log('✅ API routes loaded successfully');
} catch (error) {
  console.error('❌ Failed to load API routes:', error.message);
  console.log('Starting server without API routes...');
}

// If we have API routes, use them
if (apiRoutes) {
  // Mount API routes
  app.use('/', apiRoutes);
}

// Serve static files
const publicPath = path.join(__dirname, 'dist', 'public');
if (existsSync(publicPath)) {
  app.use(express.static(publicPath));
  console.log('✅ Static files configured');
  
  // Serve React app for non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      const indexPath = path.join(publicPath, 'index.html');
      if (existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).json({ message: 'Frontend not found' });
      }
    }
  });
} else {
  console.log('⚠️ Static files directory not found');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Start server
const PORT = process.env.PORT || 80;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ezras Nashim server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});