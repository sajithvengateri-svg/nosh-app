import { useEffect } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator } from "react-native";
import { UtensilsCrossed, PartyPopper, CookingPot } from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import { useSocialCookingStore } from "../../lib/stores/socialCookingStore";
import type { SocialEvent, SocialEventType } from "../../lib/stores/socialCookingStore";
import {
  getEventTypeLabel,
  formatEventDate,
} from "../../lib/utils/socialCookingUtils";
import { StatusBadge } from "./components/StatusBadge";
import { SundayRoastFlow } from "./SundayRoastFlow";
import { PartyModeFlow } from "./PartyModeFlow";
import { DutchNoshFlow } from "./DutchNoshFlow";

const EVENT_TYPE_OPTIONS: {
  type: SocialEventType;
  icon: React.ComponentType<any>;
  label: string;
  description: string;
}[] = [
  {
    type: "sunday_roast",
    icon: UtensilsCrossed,
    label: "Sunday Roast",
    description: "Family dinner, everyone votes",
  },
  {
    type: "party",
    icon: PartyPopper,
    label: "Party Mode",
    description: "Big group, assign cooking roles",
  },
  {
    type: "dutch_nosh",
    icon: CookingPot,
    label: "Dutch Prep",
    description: "Potluck -- everyone brings a dish",
  },
];

export function SocialCookingOverlay({ onClose }: { onClose: () => void }) {
  const currentView = useSocialCookingStore((s) => s.currentView);
  const activeEvent = useSocialCookingStore((s) => s.activeEvent);
  const myEvents = useSocialCookingStore((s) => s.myEvents);
  const isLoading = useSocialCookingStore((s) => s.isLoading);
  const fetchMyEvents = useSocialCookingStore((s) => s.fetchMyEvents);
  const createEvent = useSocialCookingStore((s) => s.createEvent);
  const loadEvent = useSocialCookingStore((s) => s.loadEvent);
  const reset = useSocialCookingStore((s) => s.reset);

  useEffect(() => {
    fetchMyEvents();
    return () => reset();
  }, []);

  // Route to flow based on active event type
  if (activeEvent || currentView !== "picker") {
    if (activeEvent?.event_type === "sunday_roast" || currentView === "setup") {
      // Check draft event type for new events still in setup
      const draftType = useSocialCookingStore.getState().draft.event_type;
      if (activeEvent?.event_type === "party" || draftType === "party") {
        return <PartyModeFlow />;
      }
      if (activeEvent?.event_type === "dutch_nosh" || draftType === "dutch_nosh") {
        return <DutchNoshFlow />;
      }
      return <SundayRoastFlow />;
    }
    if (activeEvent?.event_type === "party") return <PartyModeFlow />;
    if (activeEvent?.event_type === "dutch_nosh") return <DutchNoshFlow />;

    // Fallback: check draft type for events not yet saved
    const draftType = useSocialCookingStore.getState().draft.event_type;
    if (draftType === "party") return <PartyModeFlow />;
    if (draftType === "dutch_nosh") return <DutchNoshFlow />;
    if (draftType === "sunday_roast") return <SundayRoastFlow />;
  }

  // Picker view
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const handleCreateEvent = (type: SocialEventType) => {
    lightTap();
    createEvent(type);
  };

  const handleOpenEvent = (event: SocialEvent) => {
    lightTap();
    loadEvent(event.id);
  };

  const renderEvent = ({ item }: { item: SocialEvent }) => (
    <Pressable
      onPress={() => handleOpenEvent(item)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        backgroundColor: Glass.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Glass.borderLight,
        shadowColor: Glass.shadowLight.color,
        shadowOffset: Glass.shadowLight.offset,
        shadowRadius: Glass.shadowLight.radius,
        shadowOpacity: 1,
      }}
    >
      <View style={{ marginRight: 12 }}>
        {(() => {
          const EventIcon = EVENT_TYPE_OPTIONS.find((o) => o.type === item.event_type)?.icon ?? UtensilsCrossed;
          return <EventIcon size={28} color={Colors.text.muted} strokeWidth={1.5} />;
        })()}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.text.primary }}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 13, color: Colors.text.secondary, marginTop: 2 }}>
          {getEventTypeLabel(item.event_type)} · {formatEventDate(item.date_time)}
        </Text>
      </View>
      <StatusBadge status={item.status} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Existing events */}
      {myEvents.length > 0 && (
        <>
          <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.secondary, marginBottom: 12 }}>
            Your Events
          </Text>
          <FlatList
            data={myEvents}
            keyExtractor={(item) => item.id}
            renderItem={renderEvent}
            contentContainerStyle={{ gap: 10 }}
            style={{ maxHeight: 240, marginBottom: 20 }}
          />
        </>
      )}

      {/* Create new */}
      <Text style={{ fontSize: 15, fontWeight: "600", color: Colors.secondary, marginBottom: 12 }}>
        {myEvents.length > 0 ? "Create New" : "What are you planning?"}
      </Text>
      <View style={{ gap: 12 }}>
        {EVENT_TYPE_OPTIONS.map((opt) => (
          <Pressable
            key={opt.type}
            onPress={() => handleCreateEvent(opt.type)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 16,
              backgroundColor: Glass.surface,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: Glass.borderLight,
              shadowColor: Glass.shadowLight.color,
              shadowOffset: Glass.shadowLight.offset,
              shadowRadius: Glass.shadowLight.radius,
              shadowOpacity: 1,
            }}
          >
            <View style={{ marginRight: 14 }}>
              <opt.icon size={36} color={Colors.text.muted} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: "600", color: Colors.text.primary }}>
                {opt.label}
              </Text>
              <Text style={{ fontSize: 14, color: Colors.text.secondary, marginTop: 2 }}>
                {opt.description}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: Colors.text.muted }}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
