/**
 * Haptic feedback utility using the Vibration API.
 * Falls back silently on devices/browsers that don't support it.
 */

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error" | "select";

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 20],
  error: [30, 50, 30, 50, 30],
  select: 5,
};

export function haptic(type: HapticPattern = "light") {
  try {
    if ("vibrate" in navigator) {
      navigator.vibrate(patterns[type]);
    }
  } catch {
    // Silently fail on unsupported platforms
  }
}
