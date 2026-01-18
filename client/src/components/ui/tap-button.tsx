import { forwardRef, useRef, useCallback } from 'react';

const SCROLL_THRESHOLD = 10; // pixels of movement before we consider it a scroll

interface TapButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onTap: () => void;
  children: React.ReactNode;
}

export const TapButton = forwardRef<HTMLButtonElement, TapButtonProps>(
  ({ onTap, children, ...props }, ref) => {
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const isScrolling = useRef(false);

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
      if (!isScrolling.current && touchStartPos.current) {
        e.preventDefault();
        onTap();
      }
      touchStartPos.current = null;
      isScrolling.current = false;
    }, [onTap]);

    const handleClick = useCallback(() => {
      // For non-touch devices (desktop), use click directly
      if (!('ontouchstart' in window)) {
        onTap();
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
      if (!isScrolling.current && touchStartPos.current) {
        e.preventDefault();
        onTap();
      }
      touchStartPos.current = null;
      isScrolling.current = false;
    }, [onTap]);

    const handleClick = useCallback(() => {
      // For non-touch devices (desktop), use click directly
      if (!('ontouchstart' in window)) {
        onTap();
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
