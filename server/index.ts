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

// Mock API endpoints for the frontend
app.get('/api/version', (req: Request, res: Response) => {
  res.json({ 
    version: '1.0.0',
    timestamp: Date.now(),
    buildDate: new Date().toISOString()
  });
});

app.get('/api/sponsors/daily/:date', (req: Request, res: Response) => {
  res.json(null); // No sponsor for today
});

app.get('/api/hebrew-date/:date', (req: Request, res: Response) => {
  res.json({ hebrew: 'Loading Hebrew date...' });
});

app.get('/api/campaigns/active', (req: Request, res: Response) => {
  res.json({
    id: 1,
    title: 'Sample Campaign',
    description: 'Sample campaign description',
    goalAmount: 10000,
    currentAmount: 2500
  });
});

// Torah endpoints
app.get('/api/torah/pirkei-avot/:date', (req: Request, res: Response) => {
  res.json({
    title: 'Pirkei Avot',
    content: 'Sample Pirkei Avot content for ' + req.params.date,
    date: req.params.date
  });
});

app.get('/api/torah/featured/:date', (req: Request, res: Response) => {
  res.json({
    title: 'Featured Torah',
    content: 'Sample featured Torah content for ' + req.params.date,
    date: req.params.date
  });
});

app.get('/api/torah/halacha/:date', (req: Request, res: Response) => {
  res.json({
    title: 'Halacha',
    content: 'Sample halacha content for ' + req.params.date,
    date: req.params.date
  });
});

// Table endpoints
app.get('/api/table/vort', (req: Request, res: Response) => {
  res.json({
    title: 'Table Vort',
    content: 'Sample table vort content'
  });
});

// Sponsor endpoints
app.get('/api/sponsors/:id', (req: Request, res: Response) => {
  res.json({
    id: req.params.id,
    name: 'Sample Sponsor',
    description: 'Sample sponsor description'
  });
});

// Serve static files from client/dist if it exists
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
const publicPath = path.join(__dirname, '..', 'dist', 'public');

// Try to serve from built assets first, then fallback to development
try {
  const fs = await import('fs');
  if (fs.existsSync(publicPath)) {
    console.log('Serving from built assets:', publicPath);
    app.use(express.static(publicPath));
  } else if (fs.existsSync(clientDistPath)) {
    console.log('Serving from client dist:', clientDistPath);
    app.use(express.static(clientDistPath));
  } else {
    console.log('No built assets found, serving basic response');
  }
} catch (error) {
  console.log('Could not check for static files');
}

// Fallback route for React app (SPA routing)
app.get('*', (req: Request, res: Response) => {
  // For non-API routes, serve a basic HTML page that loads the React app
  if (!req.path.startsWith('/api')) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Ezras Nashim</title>
          <script type="module" crossorigin src="/assets/index.js"></script>
          <link rel="stylesheet" crossorigin href="/assets/index.css">
        </head>
        <body>
          <div id="root">
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui;">
              <div style="text-align: center;">
                <h1>Ezras Nashim</h1>
                <p>Loading application...</p>
                <div style="margin-top: 20px;">
                  <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #E8ADB7; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
              </div>
            </div>
            <style>
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            </style>
          </div>
          <script>
            // If the React app doesn't load, show a message
            setTimeout(() => {
              const root = document.getElementById('root');
              if (root && root.innerHTML.includes('Loading application')) {
                root.innerHTML = \`
                  <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: system-ui; text-align: center;">
                    <div>
                      <h1 style="color: #E8ADB7;">Ezras Nashim</h1>
                      <p>Please run the frontend development server:</p>
                      <code style="background: #f5f5f5; padding: 10px; border-radius: 5px; display: block; margin: 20px 0;">npm run dev:frontend</code>
                      <p style="color: #666; font-size: 14px;">The backend server is running on port 5000</p>
                    </div>
                  </div>
                \`;
              }
            }, 3000);
          </script>
        </body>
      </html>
    `);
  } else {
    res.status(404).json({ message: 'API endpoint not found' });
  }
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
  console.log(`🔗 Frontend should be accessible via the preview`);
});

export { app };