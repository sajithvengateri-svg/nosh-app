import { View, Text, Pressable } from "react-native";
import { Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Colors, Glass } from "../../../constants/colors";
import { lightTap, successNotification } from "../../../lib/haptics";
import type { SocialEvent } from "../../../lib/stores/socialCookingStore";
import {
  buildShareMessage,
  buildDeepLink,
  buildPublicUrl,
  getEventTypeLabel,
} from "../../../lib/utils/socialCookingUtils";

export function ShareSheet({ event }: { event: SocialEvent }) {
  const handleShare = async () => {
    lightTap();
    try {
      const { message, url } = buildShareMessage(event);
      await Share.share({
        message,
        url,
        title: `${getEventTypeLabel(event.event_type)}: ${event.title}`,
      });
    } catch {
      // User cancelled
    }
  };

  const handleCopyLink = async () => {
    lightTap();
    const link =
      event.event_type === "dutch_nosh"
        ? buildPublicUrl(event.id)
        : buildDeepLink(event.id);
    await Clipboard.setStringAsync(link);
    successNotification();
  };

  return (
    <View style={{ flexDirection: "row", gap: 10 }}>
      <Pressable
        onPress={handleShare}
        style={{
          flex: 1,
          backgroundColor: Colors.primary,
          paddingVertical: 12,
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            color: "#FFF",
            fontSize: 15,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          Share Invite
        </Text>
      </Pressable>
      <Pressable
        onPress={handleCopyLink}
        style={{
          flex: 1,
          borderWidth: 1.5,
          borderColor: Glass.borderLight,
          paddingVertical: 12,
          borderRadius: 12,
        }}
      >
        <Text
          style={{
            color: Colors.primary,
            fontSize: 15,
            fontWeight: "600",
            textAlign: "center",
          }}
        >
          Copy Link
        </Text>
      </Pressable>
    </View>
  );
}
