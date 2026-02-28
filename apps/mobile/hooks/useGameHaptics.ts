import * as Haptics from "expo-haptics";

export function useGameHaptics() {
  const purr = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const tap = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  const error = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  const impact = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  const selection = () => Haptics.selectionAsync();

  return { purr, tap, error, success, impact, selection };
}
