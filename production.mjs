#!/usr/bin/env node

// Standalone production entry point - completely independent of .replit configurations
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Ezras Nashim production server...');

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

// Basic logging
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

// Try to load API routes from built server
let apiLoaded = false;
try {
  const { registerRoutes } = await import('./dist/routes.js');
  if (registerRoutes) {
    await registerRoutes(app);
    apiLoaded = true;
    console.log('API routes loaded successfully');
  }
} catch (error) {
  console.log('Loading API routes from built server...');
  try {
    // Alternative: try to import the entire built server
    const serverModule = await import('./dist/index.js');
    if (serverModule.app) {
      // Mount the entire app
      app.use('/', serverModule.app);
      apiLoaded = true;
      console.log('Server module loaded successfully');
    }
  } catch (secondError) {
    console.warn('Could not load API routes, continuing with static serving only');
  }
}

// Serve static files
const publicPath = path.join(__dirname, 'dist', 'public');
if (existsSync(publicPath)) {
  app.use(express.static(publicPath));
  console.log('Static files configured');
  
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
  console.log('Static files directory not found');
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: 'production',
    apiLoaded: apiLoaded
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
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: production`);
  console.log(`Health check: http://localhost:${PORT}/health`);
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