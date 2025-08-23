import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeOptimizations } from "./lib/optimization";

// Fix for Safari mobile viewport height issues
function setViewportHeight() {
  // Set the actual viewport height as a CSS custom property
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function setupSafariViewportFix() {
  // Only run on mobile Safari
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isSafari && isMobile) {
    // Set initial value
    setViewportHeight();

    // Update on resize (when URL bar shows/hides)
    let resizeTimer: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setViewportHeight, 100);
    });

    // Also listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 500); // Delay to ensure orientation change is complete
    });
  }
}

// Initialize performance optimizations
initializeOptimizations();

// Setup Safari viewport fix
setupSafariViewportFix();

createRoot(document.getElementById("root")!).render(<App />);
