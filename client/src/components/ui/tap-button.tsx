import { forwardRef, useRef, useCallback } from 'react';

const SCROLL_THRESHOLD = 10;
const TAP_DEBOUNCE_MS = 300;

interface TapButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onTap: () => void;
  children: React.ReactNode;
}

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
