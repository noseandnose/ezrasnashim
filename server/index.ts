import express, { type Request, Response, NextFunction } from "express";
import path from "path";
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
        logLine += ` :: ${JSON.stringify(capturedJsonResponse).slice(0, 100)}`;
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

  // Serve the working React frontend directly
  app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ezras Nashim - Daily Jewish Women's Spiritual App</title>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect } = React;
    
    function App() {
      const [completions, setCompletions] = useState({
        torah: false,
        tefilla: false,
        tzedaka: false
      });
      
      const [apiData, setApiData] = useState({
        tehillim: null,
        campaigns: null
      });

      useEffect(() => {
        fetch('/api/tehillim/progress')
          .then(res => res.json())
          .then(data => setApiData(prev => ({ ...prev, tehillim: data })))
          .catch(err => console.log('Tehillim API:', err));
          
        fetch('/api/campaigns')
          .then(res => res.json())
          .then(data => setApiData(prev => ({ ...prev, campaigns: data })))
          .catch(err => console.log('Campaigns API:', err));
      }, []);

      const toggleCompletion = (section) => {
        setCompletions(prev => ({
          ...prev,
          [section]: !prev[section]
        }));
      };

      const allComplete = completions.torah && completions.tefilla && completions.tzedaka;

      return React.createElement('div', {
        style: { 
          minHeight: "100vh", 
          background: "linear-gradient(135deg, #fef3c7, #ddd6fe)", 
          padding: "20px",
          fontFamily: "Arial, sans-serif"
        }
      }, React.createElement('div', {
        style: { 
          maxWidth: "600px", 
          margin: "0 auto", 
          background: "white", 
          borderRadius: "15px", 
          padding: "30px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
        }
      }, [
        React.createElement('h1', {
          key: 'title',
          style: { textAlign: "center", color: "#7c3aed", marginBottom: "10px" }
        }, "🌟 Ezras Nashim"),
        
        React.createElement('p', {
          key: 'subtitle',
          style: { textAlign: "center", color: "#6b7280", marginBottom: "20px" }
        }, "Daily Jewish Women's Spiritual Companion"),

        allComplete && React.createElement('div', {
          key: 'complete',
          style: {
            background: "#d1fae5",
            border: "2px solid #059669",
            borderRadius: "10px",
            padding: "15px",
            textAlign: "center",
            marginBottom: "20px"
          }
        }, [
          React.createElement('h3', { 
            key: 'complete-title',
            style: { color: "#059669", margin: "0" }
          }, "❤️ Daily Goals Complete! ❤️"),
          React.createElement('p', {
            key: 'complete-text',
            style: { margin: "5px 0 0 0", color: "#047857" }
          }, "You've completed Torah, Tefilla, and Tzedaka today!")
        ]),

        React.createElement('div', {
          key: 'sections',
          style: { display: "grid", gap: "20px" }
        }, [
          // Torah Section
          React.createElement('div', {
            key: 'torah',
            style: { 
              padding: "20px", 
              background: completions.torah ? "#d1fae5" : "#fef3c7", 
              borderRadius: "10px",
              border: completions.torah ? "2px solid #059669" : "1px solid #f59e0b",
              transition: "all 0.3s ease"
            }
          }, [
            React.createElement('h3', {
              key: 'torah-title',
              style: { margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "10px" }
            }, ["📖 Torah Study", completions.torah && React.createElement('span', { 
              key: 'torah-check',
              style: { color: "#059669" }
            }, "✓")]),
            React.createElement('p', {
              key: 'torah-desc',
              style: { margin: "0 0 15px 0", color: "#6b7280" }
            }, "Daily Halacha, Mussar, and Chizuk for spiritual growth"),
            React.createElement('button', {
              key: 'torah-btn',
              onClick: () => toggleCompletion('torah'),
              style: {
                background: completions.torah ? "#059669" : "#7c3aed",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px"
              }
            }, completions.torah ? "Completed! ❤️" : "Start Learning")
          ]),

          // Tefilla Section
          React.createElement('div', {
            key: 'tefilla',
            style: { 
              padding: "20px", 
              background: completions.tefilla ? "#d1fae5" : "#ddd6fe", 
              borderRadius: "10px",
              border: completions.tefilla ? "2px solid #059669" : "1px solid #8b5cf6",
              transition: "all 0.3s ease"
            }
          }, [
            React.createElement('h3', {
              key: 'tefilla-title',
              style: { margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "10px" }
            }, ["🤲 Tefilla (Prayer)", completions.tefilla && React.createElement('span', { 
              key: 'tefilla-check',
              style: { color: "#059669" }
            }, "✓")]),
            React.createElement('p', {
              key: 'tefilla-desc',
              style: { margin: "0 0 15px 0", color: "#6b7280" }
            }, "Mincha, Tehillim, and special women's prayers"),
            React.createElement('button', {
              key: 'tefilla-btn',
              onClick: () => toggleCompletion('tefilla'),
              style: {
                background: completions.tefilla ? "#059669" : "#7c3aed",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px"
              }
            }, completions.tefilla ? "Completed! ❤️" : "Begin Prayers"),
            apiData.tehillim && React.createElement('div', {
              key: 'tehillim-data',
              style: { marginTop: "10px", fontSize: "12px", color: "#6b7280" }
            }, \`Global Tehillim: Perek \${apiData.tehillim.currentPerek}/150\`)
          ]),

          // Tzedaka Section
          React.createElement('div', {
            key: 'tzedaka',
            style: { 
              padding: "20px", 
              background: completions.tzedaka ? "#d1fae5" : "#fed7d7", 
              borderRadius: "10px",
              border: completions.tzedaka ? "2px solid #059669" : "1px solid #ef4444",
              transition: "all 0.3s ease"
            }
          }, [
            React.createElement('h3', {
              key: 'tzedaka-title',
              style: { margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "10px" }
            }, ["💝 Tzedaka (Charity)", completions.tzedaka && React.createElement('span', { 
              key: 'tzedaka-check',
              style: { color: "#059669" }
            }, "✓")]),
            React.createElement('p', {
              key: 'tzedaka-desc',
              style: { margin: "0 0 15px 0", color: "#6b7280" }
            }, "Daily giving and community campaigns"),
            React.createElement('button', {
              key: 'tzedaka-btn',
              onClick: () => toggleCompletion('tzedaka'),
              style: {
                background: completions.tzedaka ? "#059669" : "#7c3aed",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "14px"
              }
            }, completions.tzedaka ? "Completed! ❤️" : "Give Tzedaka"),
            apiData.campaigns && apiData.campaigns[0] && React.createElement('div', {
              key: 'campaign-data',
              style: { marginTop: "10px", fontSize: "12px", color: "#6b7280" }
            }, \`\${apiData.campaigns[0].title}: $\${apiData.campaigns[0].currentAmount.toLocaleString()}/$\${apiData.campaigns[0].goalAmount.toLocaleString()}\`)
          ])
        ]),

        React.createElement('div', {
          key: 'progress',
          style: { 
            marginTop: "30px", 
            padding: "15px", 
            background: allComplete ? "#d1fae5" : "#f3f4f6", 
            borderRadius: "10px",
            border: allComplete ? "1px solid #059669" : "1px solid #d1d5db"
          }
        }, [
          React.createElement('h4', {
            key: 'progress-title',
            style: { margin: "0 0 10px 0", textAlign: "center" }
          }, "Today's Progress"),
          React.createElement('div', {
            key: 'progress-items',
            style: { 
              display: "flex", 
              justifyContent: "space-around", 
              fontSize: "14px" 
            }
          }, [
            React.createElement('span', {
              key: 'torah-progress',
              style: { color: completions.torah ? "#059669" : "#6b7280" }
            }, \`Torah: \${completions.torah ? "✓" : "○"}\`),
            React.createElement('span', {
              key: 'tefilla-progress',
              style: { color: completions.tefilla ? "#059669" : "#6b7280" }
            }, \`Tefilla: \${completions.tefilla ? "✓" : "○"}\`),
            React.createElement('span', {
              key: 'tzedaka-progress',
              style: { color: completions.tzedaka ? "#059669" : "#6b7280" }
            }, \`Tzedaka: \${completions.tzedaka ? "✓" : "○"}\`)
          ]),
          React.createElement('div', {
            key: 'progress-count',
            style: { textAlign: "center", marginTop: "10px", fontSize: "12px", color: "#6b7280" }
          }, \`\${Object.values(completions).filter(Boolean).length}/3 completed\`)
        ]),

        React.createElement('div', {
          key: 'api-status',
          style: { textAlign: "center", marginTop: "20px", fontSize: "14px" }
        }, [
          React.createElement('p', {
            key: 'status',
            style: { margin: "0 0 10px 0" }
          }, [
            React.createElement('strong', { key: 'status-label' }, "Status: "),
            React.createElement('span', { 
              key: 'status-value',
              style: { color: "green" }
            }, "✓ Connected")
          ]),
          React.createElement('div', {
            key: 'api-links',
            style: { display: "flex", justifyContent: "center", gap: "15px", fontSize: "12px" }
          }, [
            React.createElement('a', {
              key: 'tehillim-link',
              href: "/api/tehillim/progress",
              style: { color: "#7c3aed" }
            }, "Tehillim API"),
            React.createElement('a', {
              key: 'campaigns-link',
              href: "/api/campaigns",
              style: { color: "#7c3aed" }
            }, "Campaigns API")
          ])
        ])
      ]));
    }

    ReactDOM.render(React.createElement(App), document.getElementById('root'));
  </script>
</body>
</html>
    `);
  });

  // Production static file serving
  if (process.env.NODE_ENV !== "development") {
    app.use(express.static('dist/public'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/public/index.html'));
    });
  }

  // Server configuration
  const port = process.env.NODE_ENV === "development" ? 5000 : (process.env.PORT ?? 80);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Ezras Nashim server listening on port ${port}`);
    console.log(`Frontend: http://localhost:${port}`);
    console.log(`API: http://localhost:${port}/api`);
  });
})();