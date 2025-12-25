import type { Express, Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface UtilityRouteDeps {
  requireAdminAuth: (req: any, res: any, next: any) => void;
}

const SERVER_START_TIME = Date.now();

const generateAutoVersion = (): string => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}.${month}.${day}.${hour}${minute}`;
};

const APP_VERSION = process.env.APP_VERSION || generateAutoVersion();

const getVersionTimestamp = (): number => {
  return SERVER_START_TIME;
};

export function registerUtilityRoutes(app: Express, deps: UtilityRouteDeps) {
  const { requireAdminAuth } = deps;

  app.get("/healthcheck", (_req: Request, res: Response) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const health: {
      status: string;
      timestamp: string;
      environment: string;
      services: {
        database: boolean;
        stripe: boolean;
        pushNotifications: boolean;
        admin: boolean;
      };
      warnings?: string[];
    } = {
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: !!process.env.DATABASE_URL,
        stripe: !!process.env.STRIPE_SECRET_KEY,
        pushNotifications: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
        admin: !!process.env.ADMIN_PASSWORD
      }
    };
    
    if (isProduction) {
      const warnings: string[] = [];
      if (!health.services.stripe) warnings.push('Stripe not configured - donations disabled');
      if (!health.services.pushNotifications) warnings.push('Push notifications not configured');
      if (!health.services.admin) warnings.push('Admin panel not configured');
      
      if (warnings.length > 0) {
        health.warnings = warnings;
      }
    }
    
    return res.json(health);
  });

  if (process.env.NODE_ENV === 'development') {
    app.get("/", (req: Request, res: Response) => {
      res.send(`
        <html>
          <head>
            <title>Ezras Nashim API Server</title>
            <style>
              body { font-family: Platypi, serif; text-align: center; padding: 50px; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #333; margin-bottom: 20px; }
              p { color: #666; line-height: 1.6; margin-bottom: 15px; }
              .frontend-link { display: inline-block; padding: 12px 24px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .frontend-link:hover { background: #0056b3; }
              .api-status { color: #28a745; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🌺 Ezras Nashim API Server</h1>
              <p class="api-status">✅ API Server Running (Port 5000)</p>
              <p>This is the backend API server. To access the Ezras Nashim application interface, please use:</p>
              <a href="https://${req.get('host')?.replace(':5000', ':5173')}" class="frontend-link">
                Access Frontend Application (Port 5173)
              </a>
              <p><small>The frontend runs on port 5173 during development.</small></p>
            </div>
          </body>
        </html>
      `);
    });
  } else {
    app.get("/", (_req: Request, res: Response) => {
      return res.json({ status: "OK" });
    });
  }

  app.get("/api/version", (_req: Request, res: Response) => {
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    
    const versionTimestamp = getVersionTimestamp();
    const version = {
      timestamp: versionTimestamp,
      version: APP_VERSION,
      buildDate: new Date(versionTimestamp).toISOString(),
      serverUptime: Date.now() - SERVER_START_TIME,
      isCritical: process.env.CRITICAL_UPDATE === 'true',
      releaseNotes: process.env.RELEASE_NOTES || undefined
    };
    return res.json(version);
  });

  app.post("/api/regenerate-cache-version", requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const { execSync } = await import('child_process');
      const scriptPath = path.join(__dirname, '../../scripts/generate-version.js');
      
      const output = execSync(`node ${scriptPath}`, { encoding: 'utf-8' });
      
      console.log('[Admin] Cache version regenerated:', output);
      
      res.status(200).json({
        success: true,
        message: 'Cache version regenerated successfully',
        output: output.trim(),
        newVersion: `v1.0.0-${Date.now()}`,
        note: 'Users will receive update prompt on next app focus'
      });
    } catch (error: any) {
      console.error('[Admin] Failed to regenerate cache version:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to regenerate cache version',
        error: error.message
      });
    }
  });
}
