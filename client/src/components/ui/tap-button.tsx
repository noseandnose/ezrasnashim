import { forwardRef, useRef, useCallback } from 'react';

const SCROLL_THRESHOLD = 10; // pixels of movement before we consider it a scroll
const TAP_DEBOUNCE_MS = 300; // minimum time between taps to prevent double-firing

interface TapButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onTap: () => void;
  children: React.ReactNode;
}

export const TapButton = forwardRef<HTMLButtonElement, TapButtonProps>(
  ({ onTap, children, ...props }, ref) => {
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const isScrolling = useRef(false);
    const lastTapTime = useRef(0);
    const isTouchDevice = useRef(false);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      isTouchDevice.current = true;
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
      const now = Date.now();
      if (!isScrolling.current && touchStartPos.current) {
        // Debounce rapid taps
        if (now - lastTapTime.current > TAP_DEBOUNCE_MS) {
          lastTapTime.current = now;
          e.preventDefault();
          onTap();
        }
      }
      touchStartPos.current = null;
      isScrolling.current = false;
    }, [onTap]);

    const handleClick = useCallback(() => {
      // Only use click for non-touch devices
      if (!isTouchDevice.current) {
        const now = Date.now();
        if (now - lastTapTime.current > TAP_DEBOUNCE_MS) {
          lastTapTime.current = now;
          onTap();
        }
      }
    }, [onTap]);

    return (
      <button
        ref={ref}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
}

export const TapDiv = forwardRef<HTMLDivElement, TapDivProps>(
  ({ onTap, children, ...props }, ref) => {
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const isScrolling = useRef(false);
    const lastTapTime = useRef(0);
    const isTouchDevice = useRef(false);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
      isTouchDevice.current = true;
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
      const now = Date.now();
      if (!isScrolling.current && touchStartPos.current) {
        // Debounce rapid taps
        if (now - lastTapTime.current > TAP_DEBOUNCE_MS) {
          lastTapTime.current = now;
          e.preventDefault();
          onTap();
        }
      }
      touchStartPos.current = null;
      isScrolling.current = false;
    }, [onTap]);

    const handleClick = useCallback(() => {
      // Only use click for non-touch devices
      if (!isTouchDevice.current) {
        const now = Date.now();
        if (now - lastTapTime.current > TAP_DEBOUNCE_MS) {
          lastTapTime.current = now;
          onTap();
        }
      }
    }, [onTap]);

    return (
      <div
        ref={ref}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        {...props}
      >
        {children}
      </div>
    );
  }
);

TapDiv.displayName = 'TapDiv';
