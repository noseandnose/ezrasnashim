import { forwardRef, useRef, useCallback } from 'react';

const SCROLL_THRESHOLD = 10; // pixels of movement before we consider it a scroll
const TAP_DEBOUNCE_MS = 300; // minimum time between taps to prevent double-firing

interface TapButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onTap: () => void;
  children: React.ReactNode;
}

export const TapButton = forwardRef<HTMLButtonElement, TapButtonProps>(
  ({ onTap, children, disabled, ...props }, ref) => {
    const pointerStartPos = useRef<{ x: number; y: number } | null>(null);
    const isScrolling = useRef(false);
    const lastTapTime = useRef(0);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
      pointerStartPos.current = { x: e.clientX, y: e.clientY };
      isScrolling.current = false;
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
      if (!pointerStartPos.current) return;
      const deltaX = Math.abs(e.clientX - pointerStartPos.current.x);
      const deltaY = Math.abs(e.clientY - pointerStartPos.current.y);
      if (deltaX > SCROLL_THRESHOLD || deltaY > SCROLL_THRESHOLD) {
        isScrolling.current = true;
      }
    }, []);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
      if (disabled) {
        pointerStartPos.current = null;
        return;
      }
      
      const now = Date.now();
      if (!isScrolling.current && pointerStartPos.current) {
        // Debounce rapid taps
        if (now - lastTapTime.current > TAP_DEBOUNCE_MS) {
          lastTapTime.current = now;
          e.preventDefault();
          e.stopPropagation();
          onTap();
        }
      }
      pointerStartPos.current = null;
      isScrolling.current = false;
    }, [onTap, disabled]);

    const handlePointerCancel = useCallback(() => {
      pointerStartPos.current = null;
      isScrolling.current = false;
    }, []);

    return (
      <button
        ref={ref}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
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
    const pointerStartPos = useRef<{ x: number; y: number } | null>(null);
    const isScrolling = useRef(false);
    const lastTapTime = useRef(0);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
      pointerStartPos.current = { x: e.clientX, y: e.clientY };
      isScrolling.current = false;
    }, []);

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
      if (!pointerStartPos.current) return;
      const deltaX = Math.abs(e.clientX - pointerStartPos.current.x);
      const deltaY = Math.abs(e.clientY - pointerStartPos.current.y);
      if (deltaX > SCROLL_THRESHOLD || deltaY > SCROLL_THRESHOLD) {
        isScrolling.current = true;
      }
    }, []);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
      if (disabled) {
        pointerStartPos.current = null;
        return;
      }
      
      const now = Date.now();
      if (!isScrolling.current && pointerStartPos.current) {
        // Debounce rapid taps
        if (now - lastTapTime.current > TAP_DEBOUNCE_MS) {
          lastTapTime.current = now;
          e.preventDefault();
          e.stopPropagation();
          onTap();
        }
      }
      pointerStartPos.current = null;
      isScrolling.current = false;
    }, [onTap, disabled]);

    const handlePointerCancel = useCallback(() => {
      pointerStartPos.current = null;
      isScrolling.current = false;
    }, []);

    return (
      <div
        ref={ref}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
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
