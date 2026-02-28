import { View, Text, Pressable } from "react-native";
import { Colors } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import { useSocialCookingStore } from "../../lib/stores/socialCookingStore";
import type { SocialEventType, SocialEventStatus } from "../../lib/stores/socialCookingStore";
import {
  getEventTypeIcon,
  getEventTypeLabel,
  formatEventDate,
  getStatusLabel,
  getStatusColor,
} from "../../lib/utils/socialCookingUtils";

export interface SocialEventCardData {
  eventId: string;
  eventType: SocialEventType;
  title: string;
  hostName: string;
  isHost: boolean;
  dateTime: string;
  status: SocialEventStatus;
  guestCount: number;
  actionNeeded?: string;
}

const BORDER_COLORS: Record<SocialEventType, string> = {
  sunday_roast: Colors.alert,
  party: Colors.primary,
  dutch_nosh: Colors.secondary,
};

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function SocialEventCard({
  data,
  onOpenOverlay,
}: {
  data: SocialEventCardData;
  onOpenOverlay?: (key: string) => void;
}) {
  const loadEvent = useSocialCookingStore((s) => s.loadEvent);
  const accentColor = BORDER_COLORS[data.eventType];

  const handleOpen = async () => {
    lightTap();
    await loadEvent(data.eventId);
    onOpenOverlay?.("social_cooking");
  };

  return (
    <View
      style={{
        backgroundColor: Colors.card,
        borderRadius: 24,
        marginHorizontal: 0,
        marginBottom: 0,
        overflow: "hidden",
        borderLeftWidth: 4,
        borderLeftColor: accentColor,
        borderWidth: 1.5,
        borderColor: Colors.border,
        shadowColor: hexToRgba(accentColor, 0.10),
        shadowOpacity: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <View style={{ padding: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              backgroundColor: hexToRgba(accentColor, 0.08),
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: hexToRgba(accentColor, 0.15),
            }}
          >
            {(() => {
              const EventIcon = getEventTypeIcon(data.eventType);
              return <EventIcon size={13} color={accentColor} strokeWidth={1.5} />;
            })()}
            <Text
              style={{
                fontSize: 10,
                fontWeight: "700",
                color: accentColor,
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {getEventTypeLabel(data.eventType)}
            </Text>
          </View>
          <View style={{ flex: 1 }} />
          <View
            style={{
              backgroundColor: hexToRgba(getStatusColor(data.status), 0.08),
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: hexToRgba(getStatusColor(data.status), 0.15),
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: getStatusColor(data.status),
              }}
            >
              {getStatusLabel(data.status)}
            </Text>
          </View>
        </View>

        <Text
          style={{
            fontSize: 20,
            fontWeight: "700",
            color: Colors.text.primary,
            marginBottom: 4,
          }}
        >
          {data.title}
        </Text>

        <Text style={{ fontSize: 13, color: Colors.text.secondary, marginBottom: 12 }}>
          {formatEventDate(data.dateTime)}
          {data.guestCount > 0 ? ` · ${data.guestCount} guests` : ""}
        </Text>

        {data.actionNeeded && (
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: Colors.primary,
              marginBottom: 12,
            }}
          >
            {data.actionNeeded}
          </Text>
        )}

        <Pressable
          onPress={handleOpen}
          style={({ pressed }) => ({
            backgroundColor: pressed ? hexToRgba(accentColor, 0.85) : accentColor,
            paddingVertical: 13,
            borderRadius: 16,
          })}
        >
          <Text
            style={{
              color: "#FFF",
              fontSize: 15,
              fontWeight: "700",
              textAlign: "center",
            }}
          >
            {data.isHost ? "Manage Event" : "Open"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
