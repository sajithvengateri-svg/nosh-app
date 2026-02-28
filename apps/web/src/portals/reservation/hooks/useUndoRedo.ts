import { useRef, useCallback, useState } from 'react';

const MAX_HISTORY = 50;

export interface UndoRedoSnapshot<T> {
  data: T;
}

export function useUndoRedo<T>() {
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);
  const canUndoRef = useRef(false);
  const canRedoRef = useRef(false);

  // Force re-render tracking
  const [, setTick] = useState(0);
  const tick = useCallback(() => setTick(t => t + 1), []);

  const pushSnapshot = useCallback((snapshot: T) => {
    pastRef.current.push(snapshot);
    if (pastRef.current.length > MAX_HISTORY) {
      pastRef.current.shift();
    }
    futureRef.current = []; // Clear redo stack
    canUndoRef.current = true;
    canRedoRef.current = false;
    tick();
  }, [tick]);

  const undo = useCallback((currentState: T): T | null => {
    if (pastRef.current.length === 0) return null;
    const previous = pastRef.current.pop()!;
    futureRef.current.push(currentState);
    canUndoRef.current = pastRef.current.length > 0;
    canRedoRef.current = true;
    tick();
    return previous;
  }, [tick]);

  const redo = useCallback((currentState: T): T | null => {
    if (futureRef.current.length === 0) return null;
    const next = futureRef.current.pop()!;
    pastRef.current.push(currentState);
    canUndoRef.current = true;
    canRedoRef.current = futureRef.current.length > 0;
    tick();
    return next;
  }, [tick]);

  const clear = useCallback(() => {
    pastRef.current = [];
    futureRef.current = [];
    canUndoRef.current = false;
    canRedoRef.current = false;
    tick();
  }, [tick]);

  return {
    pushSnapshot,
    undo,
    redo,
    clear,
    canUndo: canUndoRef.current,
    canRedo: canRedoRef.current,
  };
}
