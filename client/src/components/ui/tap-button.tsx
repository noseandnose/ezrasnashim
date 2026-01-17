import { useRef, useCallback, forwardRef } from 'react';

const TAP_THRESHOLD = 10;
const TAP_TIMEOUT = 300;

interface TapButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onTap: () => void;
  children: React.ReactNode;
}

export const TapButton = forwardRef<HTMLButtonElement, TapButtonProps>(
  ({ onTap, children, ...props }, ref) => {
    const startPos = useRef<{ x: number; y: number } | null>(null);
    const startTime = useRef<number>(0);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
      startPos.current = { x: e.clientX, y: e.clientY };
      startTime.current = Date.now();
    }, []);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
      if (!startPos.current) return;

      const dx = Math.abs(e.clientX - startPos.current.x);
      const dy = Math.abs(e.clientY - startPos.current.y);
      const elapsed = Date.now() - startTime.current;

      if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD && elapsed < TAP_TIMEOUT) {
        onTap();
      }

      startPos.current = null;
    }, [onTap]);

    const handlePointerCancel = useCallback(() => {
      startPos.current = null;
    }, []);

    return (
      <button
        ref={ref}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
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
    const startPos = useRef<{ x: number; y: number } | null>(null);
    const startTime = useRef<number>(0);

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
      startPos.current = { x: e.clientX, y: e.clientY };
      startTime.current = Date.now();
    }, []);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
      if (!startPos.current) return;

      const dx = Math.abs(e.clientX - startPos.current.x);
      const dy = Math.abs(e.clientY - startPos.current.y);
      const elapsed = Date.now() - startTime.current;

      if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD && elapsed < TAP_TIMEOUT) {
        onTap();
      }

      startPos.current = null;
    }, [onTap]);

    const handlePointerCancel = useCallback(() => {
      startPos.current = null;
    }, []);

    return (
      <div
        ref={ref}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
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
