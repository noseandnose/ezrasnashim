import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeOptimizations } from "./lib/optimization";

// Comprehensive Safari mobile viewport height fix
function setViewportHeight() {
  // Set the actual viewport height as CSS custom property
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
  
  // Also set visualViewport height if available (iOS Safari 13+)
  if (window.visualViewport) {
    const visualVh = window.visualViewport.height * 0.01;
    document.documentElement.style.setProperty('--visual-vh', `${visualVh}px`);
  }
}

function setupSafariViewportFix() {
  // Detect iOS Safari specifically
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android|crios|fxios|opios).)*safari/i.test(navigator.userAgent);
  const isWebkit = 'WebkitAppearance' in document.documentElement.style;
  
  if ((isIOS || isSafari || isWebkit)) {
    // Set initial value immediately
    setViewportHeight();
    
    // Update on window resize (URL bar show/hide)
    let resizeTimer: number;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setViewportHeight, 50);
    });

    // Update on scroll (URL bar changes during scroll)
    let scrollTimer: number;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(setViewportHeight, 50);
    }, { passive: true });

    // Visual Viewport API support for modern iOS
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', setViewportHeight);
    }

    // Orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 300);
    });

    // Page visibility changes (when returning to app)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        setTimeout(setViewportHeight, 100);
      }
    });

    // Focus events (keyboard show/hide on iOS)
    window.addEventListener('focusin', () => setTimeout(setViewportHeight, 300));
    window.addEventListener('focusout', () => setTimeout(setViewportHeight, 300));
  }
}

// Initialize performance optimizations
initializeOptimizations();

// Setup Safari viewport fix
setupSafariViewportFix();

createRoot(document.getElementById("root")!).render(<App />);
