import { forwardRef, useRef, useCallback } from 'react';

const SCROLL_THRESHOLD = 10;
const TAP_DEBOUNCE_MS = 300;
const BACKGROUND_THRESHOLD_MS = 5000; // Refresh if in background for more than 5 seconds

interface TapButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onTap: () => void;
  children: React.ReactNode;
}

// Global background time tracking
let lastHiddenTime = 0;

function setupGlobalResumeHandler() {
  if (typeof window === 'undefined') return;
  
  // Only set up once
  if ((window as any).__resumeHandlerSetup) return;
  (window as any).__resumeHandlerSetup = true;

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      lastHiddenTime = Date.now();
    } else if (document.visibilityState === 'visible') {
      const timeInBackground = Date.now() - lastHiddenTime;
      if (lastHiddenTime > 0 && timeInBackground > BACKGROUND_THRESHOLD_MS) {
        console.log('[TapButton] App resumed after', Math.round(timeInBackground / 1000), 'seconds - refreshing page');
        window.location.reload();
      }
    }
  };

  const handlePageShow = (e: PageTransitionEvent) => {
    if (e.persisted) {
      console.log('[TapButton] Page restored from bfcache - refreshing');
      window.location.reload();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pageshow', handlePageShow);
}

// Initialize global handler
setupGlobalResumeHandler();

export const TapButton = forwardRef<HTMLButtonElement, TapButtonProps>(
  ({ onTap, children, disabled, ...props }, ref) => {
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const isScrolling = useRef(false);
    const lastTapTime = useRef(0);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      isScrolling.current = false;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
      if (!touchStartPos.current) return;
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
      if (deltaX > SCROLL_THRESHOLD || deltaY > SCROLL_THRESHOLD) {
        isScrolling.current = true;
      }
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      if (disabled) {
        touchStartPos.current = null;
        return;
      }
      
      const now = Date.now();
      if (!isScrolling.current && touchStartPos.current) {
        if (now - lastTapTime.current > TAP_DEBOUNCE_MS) {
          lastTapTime.current = now;
          e.preventDefault();
          onTap();
        }
      }
      touchStartPos.current = null;
      isScrolling.current = false;
    }, [onTap, disabled]);

    const handleClick = useCallback(() => {
      if (disabled) return;
      const now = Date.now();
      if (now - lastTapTime.current > TAP_DEBOUNCE_MS) {
        lastTapTime.current = now;
        onTap();
      }
    }, [onTap, disabled]);

    return (
      <button
        ref={ref}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        disabled={disabled}
        style={{ touchAction: 'manipulation', ...props.style }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

TapButton.displayName = 'TapButton';

interface TapDivProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'> {
  onTap: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export const TapDiv = forwardRef<HTMLDivElement, TapDivProps>(
  ({ onTap, children, disabled, ...props }, ref) => {
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const isScrolling = useRef(false);
    const lastTapTime = useRef(0);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      const touch = e.touches[0];
      touchStartPos.current = { x: touch.clientX, y: touch.clientY };
      isScrolling.current = false;
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
      if (!touchStartPos.current) return;
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
      if (deltaX > SCROLL_THRESHOLD || deltaY > SCROLL_THRESHOLD) {
        isScrolling.current = true;
      }
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      if (disabled) {
        touchStartPos.current = null;
        return;
      }
      
      const now = Date.now();
      if (!isScrolling.current && touchStartPos.current) {
        if (now - lastTapTime.current > TAP_DEBOUNCE_MS) {
          lastTapTime.current = now;
          e.preventDefault();
          onTap();
        }
      }
      touchStartPos.current = null;
      isScrolling.current = false;
    }, [onTap, disabled]);

    const handleClick = useCallback(() => {
      if (disabled) return;
      const now = Date.now();
      if (now - lastTapTime.current > TAP_DEBOUNCE_MS) {
        lastTapTime.current = now;
        onTap();
      }
    }, [onTap, disabled]);

    return (
      <div
        ref={ref}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={disabled ? -1 : 0}
        style={{ touchAction: 'manipulation', ...props.style }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TapDiv.displayName = 'TapDiv';
