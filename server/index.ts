import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";

console.log("starting server...");
console.log('Hello ECS');

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

  // API-only server - frontend will be served separately by Vite on different port

  // API server on port 5000
  const port = process.env.PORT ?? 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Backend API server listening on port ${port}`);
  });
})();
