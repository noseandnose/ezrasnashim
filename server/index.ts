console.log("starting server...");
console.log('Hello ECS'); setTimeout(() => {}, 60000);
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { createServer as createViteServer } from "vite";
import path from "path";

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

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite in development mode
  if (process.env.NODE_ENV === "development") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.ssrFixStacktrace);
    app.use(vite.middlewares);
  } else {
    // Production static file serving
    app.use(express.static(path.join(process.cwd(), "dist/public")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/public/index.html"));
    });
  }

  // Start server
  const port = process.env.PORT ?? 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Server listening on port ${port}`);
    if (process.env.NODE_ENV === "development") {
      console.log(`Frontend available at http://localhost:${port}`);
    }
  });
})();
