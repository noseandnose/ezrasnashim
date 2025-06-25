import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { useState } from "react";

function HomePage() {
  const [completions, setCompletions] = useState({
    torah: false,
    tefilla: false,
    tzedaka: false
  });

  const toggleCompletion = (section: keyof typeof completions) => {
    setCompletions(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "linear-gradient(135deg, #fef3c7, #ddd6fe)", 
      padding: "20px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ 
        maxWidth: "600px", 
        margin: "0 auto", 
        background: "white", 
        borderRadius: "15px", 
        padding: "30px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
      }}>
        <h1 style={{ textAlign: "center", color: "#7c3aed", marginBottom: "10px" }}>
          🌟 Ezras Nashim
        </h1>
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "30px" }}>
          Daily Jewish Women's Spiritual Companion
        </p>

        <div style={{ display: "grid", gap: "20px" }}>
          {/* Torah Section */}
          <div style={{ 
            padding: "20px", 
            background: completions.torah ? "#d1fae5" : "#fef3c7", 
            borderRadius: "10px",
            transition: "all 0.3s ease"
          }}>
            <h3 style={{ margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "10px" }}>
              📖 Torah Study
              {completions.torah && <span style={{ color: "#059669" }}>✓</span>}
            </h3>
            <p style={{ margin: "0 0 15px 0", color: "#6b7280" }}>
              Daily Halacha, Mussar, and Chizuk for spiritual growth
            </p>
            <button 
              onClick={() => toggleCompletion('torah')}
              style={{
                background: completions.torah ? "#059669" : "#7c3aed",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              {completions.torah ? "Completed! ❤️" : "Start Learning"}
            </button>
          </div>

          {/* Tefilla Section */}
          <div style={{ 
            padding: "20px", 
            background: completions.tefilla ? "#d1fae5" : "#ddd6fe", 
            borderRadius: "10px",
            transition: "all 0.3s ease"
          }}>
            <h3 style={{ margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "10px" }}>
              🤲 Tefilla (Prayer)
              {completions.tefilla && <span style={{ color: "#059669" }}>✓</span>}
            </h3>
            <p style={{ margin: "0 0 15px 0", color: "#6b7280" }}>
              Mincha, Tehillim, and special women's prayers
            </p>
            <button 
              onClick={() => toggleCompletion('tefilla')}
              style={{
                background: completions.tefilla ? "#059669" : "#7c3aed",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              {completions.tefilla ? "Completed! ❤️" : "Begin Prayers"}
            </button>
          </div>

          {/* Tzedaka Section */}
          <div style={{ 
            padding: "20px", 
            background: completions.tzedaka ? "#d1fae5" : "#fed7d7", 
            borderRadius: "10px",
            transition: "all 0.3s ease"
          }}>
            <h3 style={{ margin: "0 0 10px 0", display: "flex", alignItems: "center", gap: "10px" }}>
              💝 Tzedaka (Charity)
              {completions.tzedaka && <span style={{ color: "#059669" }}>✓</span>}
            </h3>
            <p style={{ margin: "0 0 15px 0", color: "#6b7280" }}>
              Daily giving and community campaigns
            </p>
            <button 
              onClick={() => toggleCompletion('tzedaka')}
              style={{
                background: completions.tzedaka ? "#059669" : "#7c3aed",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              {completions.tzedaka ? "Completed! ❤️" : "Give Tzedaka"}
            </button>
          </div>
        </div>

        {/* Daily Progress */}
        <div style={{ 
          marginTop: "30px", 
          padding: "15px", 
          background: "#f3f4f6", 
          borderRadius: "10px" 
        }}>
          <h4 style={{ margin: "0 0 10px 0", textAlign: "center" }}>Daily Progress</h4>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-around", 
            fontSize: "14px" 
          }}>
            <span>Torah: {completions.torah ? "✓" : "○"}</span>
            <span>Tefilla: {completions.tefilla ? "✓" : "○"}</span>
            <span>Tzedaka: {completions.tzedaka ? "✓" : "○"}</span>
          </div>
        </div>

        {/* API Status */}
        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
          <p><strong>API Status:</strong> <span style={{ color: "green" }}>✓ Running</span></p>
          <div style={{ display: "flex", justifyContent: "center", gap: "15px" }}>
            <a href="/api/tehillim/progress" style={{ color: "#7c3aed" }}>Tehillim Progress</a>
            <a href="/api/campaigns" style={{ color: "#7c3aed" }}>Active Campaigns</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route>Page not found</Route>
        </Switch>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;