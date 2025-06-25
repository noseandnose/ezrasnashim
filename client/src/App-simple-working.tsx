import { useState, useEffect } from "react";

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
    // Fetch API data
    fetch('/api/tehillim/progress')
      .then(res => res.json())
      .then(data => setApiData(prev => ({ ...prev, tehillim: data })))
      .catch(err => console.log('Tehillim API:', err));
      
    fetch('/api/campaigns')
      .then(res => res.json())
      .then(data => setApiData(prev => ({ ...prev, campaigns: data })))
      .catch(err => console.log('Campaigns API:', err));
  }, []);

  const toggleCompletion = (section: keyof typeof completions) => {
    setCompletions(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const allComplete = completions.torah && completions.tefilla && completions.tzedaka;

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
        <p style={{ textAlign: "center", color: "#6b7280", marginBottom: "20px" }}>
          Daily Jewish Women's Spiritual Companion
        </p>

        {allComplete && (
          <div style={{
            background: "#d1fae5",
            border: "2px solid #059669",
            borderRadius: "10px",
            padding: "15px",
            textAlign: "center",
            marginBottom: "20px",
            animation: "pulse 2s infinite"
          }}>
            <h3 style={{ color: "#059669", margin: "0" }}>
              ❤️ Daily Goals Complete! ❤️
            </h3>
            <p style={{ margin: "5px 0 0 0", color: "#047857" }}>
              You've completed Torah, Tefilla, and Tzedaka today!
            </p>
          </div>
        )}

        <div style={{ display: "grid", gap: "20px" }}>
          {/* Torah Section */}
          <div style={{ 
            padding: "20px", 
            background: completions.torah ? "#d1fae5" : "#fef3c7", 
            borderRadius: "10px",
            border: completions.torah ? "2px solid #059669" : "1px solid #f59e0b",
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
                cursor: "pointer",
                fontSize: "14px"
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
            border: completions.tefilla ? "2px solid #059669" : "1px solid #8b5cf6",
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
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              {completions.tefilla ? "Completed! ❤️" : "Begin Prayers"}
            </button>
            {apiData.tehillim && (
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>
                Global Tehillim: Perek {apiData.tehillim.currentPerek}/150
              </div>
            )}
          </div>

          {/* Tzedaka Section */}
          <div style={{ 
            padding: "20px", 
            background: completions.tzedaka ? "#d1fae5" : "#fed7d7", 
            borderRadius: "10px",
            border: completions.tzedaka ? "2px solid #059669" : "1px solid #ef4444",
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
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              {completions.tzedaka ? "Completed! ❤️" : "Give Tzedaka"}
            </button>
            {apiData.campaigns && apiData.campaigns[0] && (
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>
                {apiData.campaigns[0].title}: ${apiData.campaigns[0].currentAmount.toLocaleString()}/${apiData.campaigns[0].goalAmount.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Daily Progress Summary */}
        <div style={{ 
          marginTop: "30px", 
          padding: "15px", 
          background: allComplete ? "#d1fae5" : "#f3f4f6", 
          borderRadius: "10px",
          border: allComplete ? "1px solid #059669" : "1px solid #d1d5db"
        }}>
          <h4 style={{ margin: "0 0 10px 0", textAlign: "center" }}>Today's Progress</h4>
          <div style={{ 
            display: "flex", 
            justifyContent: "space-around", 
            fontSize: "14px" 
          }}>
            <span style={{ color: completions.torah ? "#059669" : "#6b7280" }}>
              Torah: {completions.torah ? "✓" : "○"}
            </span>
            <span style={{ color: completions.tefilla ? "#059669" : "#6b7280" }}>
              Tefilla: {completions.tefilla ? "✓" : "○"}
            </span>
            <span style={{ color: completions.tzedaka ? "#059669" : "#6b7280" }}>
              Tzedaka: {completions.tzedaka ? "✓" : "○"}
            </span>
          </div>
          <div style={{ textAlign: "center", marginTop: "10px", fontSize: "12px", color: "#6b7280" }}>
            {Object.values(completions).filter(Boolean).length}/3 completed
          </div>
        </div>

        {/* API Status */}
        <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
          <p><strong>Status:</strong> <span style={{ color: "green" }}>✓ Connected</span></p>
          <div style={{ display: "flex", justifyContent: "center", gap: "15px", fontSize: "12px" }}>
            <a href="/api/tehillim/progress" style={{ color: "#7c3aed" }}>Tehillim API</a>
            <a href="/api/campaigns" style={{ color: "#7c3aed" }}>Campaigns API</a>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}

export default App;