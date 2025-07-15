import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeCache } from "./lib/cache";
import { initializeOptimizations } from "./lib/optimization";

// Initialize performance optimizations
initializeOptimizations();

// Initialize cache system
initializeCache();

createRoot(document.getElementById("root")!).render(<App />);
