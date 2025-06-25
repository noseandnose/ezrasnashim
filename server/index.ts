import express from "express";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting Ezras Nashim server...");

const app = express();
app.use(express.json());

// Basic API endpoint to test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Ezras Nashim API is running' });
});

// Basic Tehillim progress endpoint
app.get('/api/tehillim/progress', (req, res) => {
  res.json({ 
    currentPerek: 1, 
    completedBy: null,
    totalPerakim: 150,
    message: "Global Tehillim progress tracking"
  });
});

// Serve a simple HTML page for now
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ezras Nashim - Jewish Women's Spiritual App</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: linear-gradient(135deg, #fef3c7, #ddd6fe); }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        h1 { color: #7c3aed; text-align: center; }
        .section { margin: 20px 0; padding: 15px; border-radius: 10px; }
        .torah { background: #fef3c7; }
        .tefilla { background: #ddd6fe; }
        .tzedaka { background: #fed7d7; }
        button { background: #7c3aed; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
        button:hover { background: #5b21b6; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🌟 Ezras Nashim</h1>
        <p style="text-align: center; color: #6b7280;">Daily Jewish Women's Spiritual Companion</p>
        
        <div class="section torah">
          <h3>📖 Torah Study</h3>
          <p>Daily Halacha, Mussar, and Chizuk for spiritual growth</p>
          <button onclick="alert('Torah section coming soon!')">Start Learning</button>
        </div>
        
        <div class="section tefilla">
          <h3>🤲 Tefilla (Prayer)</h3>
          <p>Mincha, Tehillim, and special women's prayers</p>
          <button onclick="alert('Prayer section coming soon!')">Begin Prayers</button>
        </div>
        
        <div class="section tzedaka">
          <h3>💝 Tzedaka (Charity)</h3>
          <p>Daily giving and community campaigns</p>
          <button onclick="alert('Donation section coming soon!')">Give Tzedaka</button>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <p><strong>API Status:</strong> <span style="color: green;">✓ Running</span></p>
          <p><a href="/api/health" style="color: #7c3aed;">Test API Health</a></p>
          <p><a href="/api/tehillim/progress" style="color: #7c3aed;">View Tehillim Progress</a></p>
        </div>
      </div>
    </body>
    </html>
  `);
});

const port = process.env.NODE_ENV === "development" ? 5000 : (process.env.PORT ?? 80);
app.listen(port, "0.0.0.0", () => {
  console.log(`✓ Ezras Nashim server running on port ${port}`);
  console.log(`  Frontend: http://localhost:${port}`);
  console.log(`  API Health: http://localhost:${port}/api/health`);
  console.log(`  Tehillim: http://localhost:${port}/api/tehillim/progress`);
});