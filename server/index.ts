import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Enhanced security headers with Helmet
const isProduction = process.env.NODE_ENV === 'production';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: isProduction 
        ? ["'self'", "https://www.hebcal.com", "https://www.googletagmanager.com", "https://www.google-analytics.com", "https://js.stripe.com"]
        : ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.hebcal.com", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: isProduction
        ? ["'self'", "https://www.hebcal.com", "https://nominatim.openstreetmap.org", "https://www.google-analytics.com", "https://api.stripe.com", "https://ezrasnashim.app", "https://api.ezrasnashim.app"]
        : ["'self'", "https://www.hebcal.com", "https://nominatim.openstreetmap.org", "https://www.google-analytics.com", "https://api.stripe.com", "https://*.replit.dev", "https://*.replit.app", "https://*.repl.co"],
      mediaSrc: ["'self'", "https:", "blob:"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow iframe embedding for mobile apps
  frameguard: false, // Explicitly disable to allow iframe embedding
}));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for API routes
  message: { message: "Too many API requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 5, // Limit auth attempts
  message: { message: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Enable compression for all responses
app.use(compression({
  threshold: 1024, // Only compress responses larger than 1KB
  level: 6, // Compression level (1-9, 6 is good balance)
  filter: (req, res) => {
    // Don't compress if the request includes a Cache-Control: no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Security and performance headers
app.use((req, res, next) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Skip X-Frame-Options completely to allow iframe embedding
  // res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Performance headers for static assets
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // API responses get appropriate cache based on endpoint
  if (req.url.startsWith('/api/')) {
    // Long cache for content that rarely changes
    if (req.url.includes('/torah/') || req.url.includes('/tefilla/') || req.url.includes('/pirkei-avot/')) {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    } 
    // Short cache for frequently changing data
    else if (req.url.includes('/tehillim/progress') || req.url.includes('/current-name')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
    // Default moderate cache for other endpoints
    else {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
    }
  }
  
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5000', // Add backend origin
        'http://127.0.0.1:5000',
        /\.replit\.dev$/,
        /\.replit\.app$/,
        /\.repl\.co$/,
        'https://api.ezrasnashim.app',
        'https://staging.ezrasnashim.app',
        'https://ezrasnashim.app'
      ];
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return origin === allowed;
        }
        return allowed.test(origin);
      });
      
      if (isAllowed || !origin) {
        return callback(null, true);
      }
      
      // In production, be strict; in development, allow any origin
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error('Not allowed by CORS'), false);
      } else {
        return callback(null, true);
      }
    },
    credentials: true,
  }),
);

// Raw body for Stripe webhooks (must come before JSON parsing)
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Increase JSON limit for large payloads (for all other routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));



app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Initialize server configuration
async function initializeServer() {
  const server = await registerRoutes(app);

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(__dirname, 'public');
    app.use(express.static(publicPath));
    
    // Serve React app for any non-API routes
    app.get('*', (req: Request, res: Response) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(publicPath, 'index.html'));
      }
    });
  } else {
    // Handle client-side routing
    app.get('*', (req: Request, res: Response) => {
      if (!req.path.startsWith('/api') && !req.path.startsWith('/attached_assets')) {
        // Redirect to the frontend dev server for client-side routing
        const frontendUrl = process.env.VITE_DEV_URL || 'http://localhost:5173';
        res.redirect(301, `${frontendUrl}${req.path}`);
      }
    });
  }

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const status = (err as any)?.status || (err as any)?.statusCode || 500;
    const message = (err as any)?.message || "Internal Server Error";

    // Log error for debugging (include request info for tracing)
    console.error('Express Error Handler:', {
      error: err,
      status,
      message,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Send error response (only if not already sent)
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
    
    // DO NOT rethrow - this prevents server crashes
  });

  return server;
}

// Start server for both production and development
initializeServer().then((server) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const defaultPort = isProduction ? '80' : '5000';
  const port = parseInt(process.env.PORT ?? defaultPort);
  
  server.listen(port, '0.0.0.0', () => {
    const environment = process.env.NODE_ENV || 'development';
    const emoji = isProduction ? '🚀' : '⚡';
    console.log(`${emoji} Ezras Nashim server running on port ${port}`);
    console.log(`📍 Environment: ${environment}`);
  });
}).catch(console.error);

// Export the configured app for external use
export { app };
