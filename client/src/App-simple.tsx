import { useState } from "react";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Ezras Nashim - Jewish Women's Spiritual App</h1>
      <p>Welcome to your daily spiritual companion</p>
      
      <div style={{ margin: "20px 0" }}>
        <button 
          onClick={() => setCount(count + 1)}
          style={{ 
            padding: "10px 20px", 
            backgroundColor: "#d1fae5", 
            border: "1px solid #065f46",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Count: {count}
        </button>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h2>Daily Spiritual Practice</h2>
        <div style={{ display: "grid", gap: "10px", maxWidth: "400px" }}>
          <div style={{ padding: "15px", backgroundColor: "#fef3c7", borderRadius: "8px" }}>
            <h3>📖 Torah Study</h3>
            <p>Daily Halacha, Mussar, and Chizuk</p>
          </div>
          <div style={{ padding: "15px", backgroundColor: "#ddd6fe", borderRadius: "8px" }}>
            <h3>🤲 Tefilla (Prayer)</h3>
            <p>Mincha, Tehillim, and Women's Prayers</p>
          </div>
          <div style={{ padding: "15px", backgroundColor: "#fed7d7", borderRadius: "8px" }}>
            <h3>💝 Tzedaka (Charity)</h3>
            <p>Daily giving and community campaigns</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;