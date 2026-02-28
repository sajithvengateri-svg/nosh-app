import { useRef, useCallback, useEffect } from "react";

interface GameLoopCallbacks {
  update: (deltaTime: number) => void;
  render: () => void;
}

/**
 * requestAnimationFrame-based game loop with stable delta time.
 * Returns start/stop/pause controls.
 */
export function useGameLoop({ update, render }: GameLoopCallbacks) {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);

  const loop = useCallback(
    (timestamp: number) => {
      if (!runningRef.current) return;

      if (pausedRef.current) {
        lastTimeRef.current = timestamp;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const delta = lastTimeRef.current
        ? Math.min((timestamp - lastTimeRef.current) / 1000, 0.05) // cap at 50ms
        : 0;
      lastTimeRef.current = timestamp;

      update(delta);
      render();

      rafRef.current = requestAnimationFrame(loop);
    },
    [update, render]
  );

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    pausedRef.current = false;
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const stop = useCallback(() => {
    runningRef.current = false;
    pausedRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const pause = useCallback(() => {
    pausedRef.current = true;
  }, []);

  const resume = useCallback(() => {
    pausedRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { start, stop, pause, resume, isRunning: runningRef };
}
