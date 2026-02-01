import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust proxy for accurate IP addresses in Replit environment
// Use hop count instead of 'true' to prevent IP spoofing and rate limit bypass
const trustProxyHops = process.env.TRUST_PROXY_HOPS 
  ? parseInt(process.env.TRUST_PROXY_HOPS, 10) 
  : (process.env.NODE_ENV === 'production' ? 2 : 1);
app.set('trust proxy', trustProxyHops);

// Redirect .repl.co to .replit.dev to match Vite's allowedHosts configuration
app.use((req, res, next) => {
  const host = req.headers.host ?? "";
  if (host.endsWith('.repl.co')) {
    const target = 'https://' + host.replace('.repl.co', '.replit.dev') + req.url;
    return res.redirect(307, target);
  }
  next();
});

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

// Rate limiting configuration
// Production app needs to handle many concurrent users
// Each page load makes ~30-40 API calls for content
const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 2000, // Allow 2000 requests per minute (supports ~50+ concurrent users)
  message: { message: "Too many API requests, please try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  // Skip rate limiting for health checks and read-only content
  skip: (req) => {
    return req.path === '/api/version' || 
           req.path === '/api/health' ||
           req.path.startsWith('/api/sponsors') ||
           req.path.includes('/hebrew-date') || // Date conversions are cached
           req.method === 'OPTIONS'; // Don't rate limit preflight requests
  }
});

// Stricter limit for auth endpoints (per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 10, // Allow 10 auth attempts per 15 minutes per IP
  message: { message: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate limit for expensive write operations (per IP)
const expensiveLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute per IP for expensive operations
  message: { message: "Too many requests to this resource, please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting with different tiers
app.use('/api/auth/', authLimiter);
app.use('/api/admin/login', authLimiter); // Strict limit for admin login (brute-force protection)
app.use('/api/tehillim/complete', expensiveLimiter);
app.use('/api/analytics/track', expensiveLimiter);
app.use('/api/', generalApiLimiter);

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
  
  // CRITICAL: Service worker must NEVER be cached - always fetch fresh for PWA updates
  if (req.url === '/sw.js' || req.url.startsWith('/sw.js?')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  // Unversioned assets (manifest, icons) - allow revalidation for updates
  else if (req.url === '/manifest.json' || 
           req.url.startsWith('/icon-') ||
           req.url === '/apple-touch-icon.png' ||
           req.url === '/favicon.ico') {
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400'); // 1 hour + 24 hour stale
  }
  // Performance headers for versioned static assets (fingerprinted by Vite)
  else if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  
  // API responses get appropriate cache based on endpoint
  if (req.url.startsWith('/api/')) {
    // Long cache for content that rarely changes (reduces API calls significantly)
    if (req.url.includes('/torah/') || 
        req.url.includes('/tefilla/') || 
        req.url.includes('/pirkei-avot/') ||
        req.url.includes('/brochas/') ||
        req.url.includes('/morning/prayers') ||
        req.url.includes('/mincha/prayer') ||
        req.url.includes('/maariv/prayer') ||
        req.url.includes('/nishmas/') ||
        req.url.includes('/birkat-hamazon/')) {
      res.setHeader('Cache-Control', 'public, max-age=7200, stale-while-revalidate=3600'); // 2 hours + 1 hour stale
    }
    // Medium cache for semi-static content
    else if (req.url.includes('/hebrew-date/') || 
             req.url.includes('/sponsors/') ||
             req.url.includes('/messages/')) {
      res.setHeader('Cache-Control', 'public, max-age=1800, stale-while-revalidate=900'); // 30 min + 15 min stale
    }
    // No cache for real-time data
    else if (req.url.includes('/tehillim/progress') || 
             req.url.includes('/current-name') ||
             req.url.includes('/analytics/')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }
    // Default moderate cache for other endpoints
    else {
      res.setHeader('Cache-Control', 'public, max-age=600, stale-while-revalidate=300'); // 10 min + 5 min stale
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
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        /\.replit\.dev$/,
        /\.replit\.app$/,
        /\.repl\.co$/,
        'https://api.ezrasnashim.app',
        'https://api.staging.ezrasnashim.app',
        'https://staging.ezrasnashim.app',
        'https://ezrasnashim.app',
        'https://www.ezrasnashim.app'
      ];
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          return origin === allowed;
        }
        return allowed.test(origin);
      });
      
      if (isAllowed) {
        return callback(null, true);
      }
      
      // In production/staging, be strict; in development, allow any origin
      const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging';
      if (isProduction) {
        console.error(`CORS rejection: Origin ${origin} not in allowed list`);
        return callback(new Error('Not allowed by CORS'), false);
      } else {
        return callback(null, true);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400, // Cache preflight response for 1 day
    preflightContinue: false,
    optionsSuccessStatus: 204
  }),
);

// Raw body for Stripe webhooks (must come before JSON parsing)
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Increase JSON limit for large payloads (for all other routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());



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

// Environment validation
function validateEnvironment() {
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Critical required variables
  const required = ['DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ CRITICAL: Missing required environment variables:', missing.join(', '));
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Important optional variables - warn if missing in production
  if (isProduction) {
    if (!process.env.STRIPE_SECRET_KEY) {
      warnings.push('STRIPE_SECRET_KEY - Donations will not work');
    }
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      warnings.push('VAPID keys - Push notifications will not work');
    }
    if (!process.env.ADMIN_PASSWORD) {
      warnings.push('ADMIN_PASSWORD - Admin panel will be disabled');
    }
  }
  
  // Log warnings
  if (warnings.length > 0) {
    console.warn('⚠️  Missing optional configuration (some features may be unavailable):');
    warnings.forEach(w => console.warn(`   - ${w}`));
  } else {
    console.log('✅ All critical environment variables configured');
  }
  
  return {
    valid: missing.length === 0,
    warnings: warnings.length,
    missing
  };
}

// Initialize server configuration
async function initializeServer() {
  // Validate environment before starting
  validateEnvironment();
  
  const server = await registerRoutes(app);

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    const publicPath = path.join(__dirname, 'public');
    
    // Serve static files BUT exclude API routes
    app.use((req, res, next) => {
      // Let API routes pass through to route handlers
      if (req.path.startsWith('/api')) {
        return next();
      }
      // Serve static files for everything else
      express.static(publicPath)(req, res, next);
    });
    
    // Serve React app for any non-API routes (SPA fallback)
    app.get('*', (req: Request, res: Response) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(publicPath, 'index.html'));
      }
    });
  } else {
    // In development, proxy to Vite dev server instead of redirecting
    // This allows the Replit webview to work properly
    const viteUrl = process.env.VITE_DEV_URL || 'http://localhost:5173';
    
    // Create proxy middleware for Vite dev server
    const viteProxy = createProxyMiddleware({
      target: viteUrl,
      changeOrigin: true,
      ws: true, // Enable WebSocket proxying for HMR
    });
    
    // Mount proxy for specific Vite paths (not API routes)
    app.use('/@vite', viteProxy); // Vite client
    app.use('/@fs', viteProxy);   // Vite file system
    app.use('/@id', viteProxy);   // Vite module resolution
    app.use('/src', viteProxy);   // Source files
    app.use('/node_modules', viteProxy); // Dependencies
    app.use('/client', viteProxy); // Client directory
    
    // Helper to check if URL should bypass proxy (API routes and static assets)
    const shouldBypassProxy = (url: string) => {
      return url.startsWith('/api') || url.startsWith('/attached_assets') || url.startsWith('/objects');
    };
    
    // Fallback: proxy ONLY frontend GET requests to Vite for SPA routing
    // Use req.originalUrl (not req.path) to properly detect API routes
    // This runs AFTER all route handlers, so API routes are processed first
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      // Check originalUrl to bypass API and asset routes
      if (shouldBypassProxy(req.originalUrl ?? '')) {
        return next();
      }
      // Proxy only frontend navigation to Vite
      viteProxy(req, res, next);
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
