import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

export function lightTap() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export function mediumTap() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
}

export function heavyTap() {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
}

export function successNotification() {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

export function errorNotification() {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

export function selectionTap() {
  if (Platform.OS !== "web") {
    Haptics.selectionAsync();
  }
}
