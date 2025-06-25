import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting Ezras Nashim server...");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

(async () => {
  const server = await registerRoutes(app);

  // Error handling middleware
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`Error ${status}: ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }

    res.status(status).json({ 
      message: "Something went wrong!",
      ...(process.env.NODE_ENV === "development" ? { error: message, details: err.stack } : {})
    });
  });

  // Setup Vite middleware for development
  if (process.env.NODE_ENV === "development") {
    try {
      const { createServer } = await import('vite');
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: 'spa',
        root: 'client'
      });
      app.use(vite.ssrFixStacktrace);
      app.use(vite.middlewares);
    } catch (error) {
      console.error('Vite setup failed:', error);
      // Fallback to static file serving
      app.use(express.static('client/dist'));
      app.get('*', (req, res) => {
        res.sendFile(path.resolve('client/dist/index.html'));
      });
    }
  } else {
    // Production static file serving
    app.use(express.static('dist/public'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/public/index.html'));
    });
  }

  // Server configuration for Replit
  const port = process.env.NODE_ENV === "development" ? 5000 : (process.env.PORT ?? 80);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Ezras Nashim server listening on port ${port}`);
    console.log(`Frontend: http://localhost:${port}`);
    console.log(`API: http://localhost:${port}/api`);
  });
})();
