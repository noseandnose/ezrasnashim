import { useCallback, useRef } from 'react';

const TAP_THRESHOLD = 10;
const TAP_TIMEOUT = 300;

interface TapHandlerResult {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: () => void;
}

export function useTapHandler(callback: () => void): TapHandlerResult {
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const startTime = useRef<number>(0);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    startTime.current = Date.now();
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!startPos.current) return;

    const dx = Math.abs(e.clientX - startPos.current.x);
    const dy = Math.abs(e.clientY - startPos.current.y);
    const elapsed = Date.now() - startTime.current;

    if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD && elapsed < TAP_TIMEOUT) {
      callback();
    }

    startPos.current = null;
  }, [callback]);

  const onPointerCancel = useCallback(() => {
    startPos.current = null;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}

export function getTapHandlers(callback: () => void) {
  let startPos: { x: number; y: number } | null = null;
  let startTime = 0;

  return {
    onPointerDown: (e: React.PointerEvent) => {
      startPos = { x: e.clientX, y: e.clientY };
      startTime = Date.now();
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (!startPos) return;

      const dx = Math.abs(e.clientX - startPos.x);
      const dy = Math.abs(e.clientY - startPos.y);
      const elapsed = Date.now() - startTime;

      if (dx < TAP_THRESHOLD && dy < TAP_THRESHOLD && elapsed < TAP_TIMEOUT) {
        callback();
      }

      startPos = null;
    },
    onPointerCancel: () => {
      startPos = null;
    }
  };
}
