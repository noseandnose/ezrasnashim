import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic CORS configuration
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    message: 'Server is running'
  });
});

// Basic API endpoint
app.get('/api/test', (req: Request, res: Response) => {
  res.json({ message: 'API is working' });
});

// Error handling
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', err);
  const status = (err as any)?.status || 500;
  const message = (err as any)?.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Start server
const port = parseInt(process.env.PORT || '5000');

app.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`🌐 Server accessible at http://0.0.0.0:${port}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { app };