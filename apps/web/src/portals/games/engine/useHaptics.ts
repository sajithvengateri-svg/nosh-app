import { useCallback, useRef } from "react";

/**
 * Wrapper for Navigator.vibrate with pattern presets.
 * Fails silently on unsupported devices.
 */
export function useHaptics() {
  const enabledRef = useRef(typeof navigator !== "undefined" && "vibrate" in navigator);

  const vibrate = useCallback((pattern: number | number[]) => {
    if (!enabledRef.current) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Silently fail
    }
  }, []);

  /** Gentle purr-like pulse for ASMR moments */
  const purr = useCallback(() => vibrate([10, 5, 10]), [vibrate]);

  /** Quick tap confirmation */
  const tap = useCallback(() => vibrate(15), [vibrate]);

  /** Sharp error buzz */
  const error = useCallback(() => vibrate(50), [vibrate]);

  /** Success pattern */
  const success = useCallback(() => vibrate([20, 10, 20, 10, 40]), [vibrate]);

  /** Heavy impact (miss, failure) */
  const impact = useCallback(() => vibrate([30, 15, 60]), [vibrate]);

  /** Stop all vibration */
  const stop = useCallback(() => vibrate(0), [vibrate]);

  return { vibrate, purr, tap, error, success, impact, stop, isSupported: enabledRef.current };
}
