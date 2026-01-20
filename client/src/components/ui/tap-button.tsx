import { forwardRef, useRef, useCallback, useEffect, useState } from 'react';

const SCROLL_THRESHOLD = 10;
const TAP_DEBOUNCE_MS = 300;

interface TapButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
  onTap: () => void;
  children: React.ReactNode;
}

export const TapButton = forwardRef<HTMLButtonElement, TapButtonProps>(
  ({ onTap, children, disabled, ...props }, ref) => {
    const internalRef = useRef<HTMLButtonElement>(null);
    const buttonRef = (ref as React.RefObject<HTMLButtonElement>) || internalRef;
    
    const pointerStartPos = useRef<{ x: number; y: number } | null>(null);
    const isScrolling = useRef(false);
    const lastTapTime = useRef(0);
    const [, forceUpdate] = useState(0);

    const handleTap = useCallback(() => {
      if (disabled) return;
      const now = Date.now();
      if (now - lastTapTime.current > TAP_DEBOUNCE_MS) {
        lastTapTime.current = now;
        onTap();
      }
    }, [onTap, disabled]);

    useEffect(() => {
      const element = buttonRef.current;
      if (!element) return;

      const onPointerDown = (e: PointerEvent) => {
        pointerStartPos.current = { x: e.clientX, y: e.clientY };
        isScrolling.current = false;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!pointerStartPos.current) return;
        const deltaX = Math.abs(e.clientX - pointerStartPos.current.x);
        const deltaY = Math.abs(e.clientY - pointerStartPos.current.y);
        if (deltaX > SCROLL_THRESHOLD || deltaY > SCROLL_THRESHOLD) {
          isScrolling.current = true;
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!isScrolling.current && pointerStartPos.current) {
          e.preventDefault();
          e.stopPropagation();
          handleTap();
        }
        pointerStartPos.current = null;
        isScrolling.current = false;
      };

      const onPointerCancel = () => {
        pointerStartPos.current = null;
        isScrolling.current = false;
      };

      element.addEventListener('pointerdown', onPointerDown);
      element.addEventListener('pointermove', onPointerMove);
      element.addEventListener('pointerup', onPointerUp);
      element.addEventListener('pointercancel', onPointerCancel);
      element.addEventListener('pointerleave', onPointerCancel);

      return () => {
        element.removeEventListener('pointerdown', onPointerDown);
        element.removeEventListener('pointermove', onPointerMove);
        element.removeEventListener('pointerup', onPointerUp);
        element.removeEventListener('pointercancel', onPointerCancel);
        element.removeEventListener('pointerleave', onPointerCancel);
      };
    }, [buttonRef, handleTap]);

    // Re-attach event listeners when app returns from background
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // Force re-render to re-attach event listeners
          forceUpdate(n => n + 1);
        }
      };

      const handlePageShow = (e: PageTransitionEvent) => {
        if (e.persisted) {
          forceUpdate(n => n + 1);
        }
      };

      const handleFocus = () => {
        forceUpdate(n => n + 1);
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('pageshow', handlePageShow);
      window.addEventListener('focus', handleFocus);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pageshow', handlePageShow);
        window.removeEventListener('focus', handleFocus);
      };
    }, []);

    return (
      <button
        ref={buttonRef}
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
    const internalRef = useRef<HTMLDivElement>(null);
    const divRef = (ref as React.RefObject<HTMLDivElement>) || internalRef;
    
    const pointerStartPos = useRef<{ x: number; y: number } | null>(null);
    const isScrolling = useRef(false);
    const lastTapTime = useRef(0);
    const [, forceUpdate] = useState(0);

    const handleTap = useCallback(() => {
      if (disabled) return;
      const now = Date.now();
      if (now - lastTapTime.current > TAP_DEBOUNCE_MS) {
        lastTapTime.current = now;
        onTap();
      }
    }, [onTap, disabled]);

    useEffect(() => {
      const element = divRef.current;
      if (!element) return;

      const onPointerDown = (e: PointerEvent) => {
        pointerStartPos.current = { x: e.clientX, y: e.clientY };
        isScrolling.current = false;
      };

      const onPointerMove = (e: PointerEvent) => {
        if (!pointerStartPos.current) return;
        const deltaX = Math.abs(e.clientX - pointerStartPos.current.x);
        const deltaY = Math.abs(e.clientY - pointerStartPos.current.y);
        if (deltaX > SCROLL_THRESHOLD || deltaY > SCROLL_THRESHOLD) {
          isScrolling.current = true;
        }
      };

      const onPointerUp = (e: PointerEvent) => {
        if (!isScrolling.current && pointerStartPos.current) {
          e.preventDefault();
          e.stopPropagation();
          handleTap();
        }
        pointerStartPos.current = null;
        isScrolling.current = false;
      };

      const onPointerCancel = () => {
        pointerStartPos.current = null;
        isScrolling.current = false;
      };

      element.addEventListener('pointerdown', onPointerDown);
      element.addEventListener('pointermove', onPointerMove);
      element.addEventListener('pointerup', onPointerUp);
      element.addEventListener('pointercancel', onPointerCancel);
      element.addEventListener('pointerleave', onPointerCancel);

      return () => {
        element.removeEventListener('pointerdown', onPointerDown);
        element.removeEventListener('pointermove', onPointerMove);
        element.removeEventListener('pointerup', onPointerUp);
        element.removeEventListener('pointercancel', onPointerCancel);
        element.removeEventListener('pointerleave', onPointerCancel);
      };
    }, [divRef, handleTap]);

    // Re-attach event listeners when app returns from background
    useEffect(() => {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          forceUpdate(n => n + 1);
        }
      };

      const handlePageShow = (e: PageTransitionEvent) => {
        if (e.persisted) {
          forceUpdate(n => n + 1);
        }
      };

      const handleFocus = () => {
        forceUpdate(n => n + 1);
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('pageshow', handlePageShow);
      window.addEventListener('focus', handleFocus);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pageshow', handlePageShow);
        window.removeEventListener('focus', handleFocus);
      };
    }, []);

    return (
      <div
        ref={divRef}
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
