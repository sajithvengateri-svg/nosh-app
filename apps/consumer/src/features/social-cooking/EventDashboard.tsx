import { View, Text, Pressable, ScrollView } from "react-native";
import { MapPin, PartyPopper } from "lucide-react-native";
import { Colors, Glass } from "../../constants/colors";
import { lightTap } from "../../lib/haptics";
import { useSocialCookingStore } from "../../lib/stores/socialCookingStore";
import type { SocialEventStatus } from "../../lib/stores/socialCookingStore";
import { StatusBadge } from "./components/StatusBadge";
import { ShareSheet } from "./components/ShareSheet";
import {
  formatEventDate,
  getEventTypeIcon,
  getEventTypeLabel,
  getDishCategoryIcon,
} from "../../lib/utils/socialCookingUtils";

const STATUS_FLOW: SocialEventStatus[] = [
  "planning",
  "voting",
  "locked",
  "shopping",
  "cooking",
  "done",
];

const NEXT_STATUS_LABEL: Partial<Record<SocialEventStatus, string>> = {
  locked: "Time to Shop!",
  shopping: "Start Cooking!",
  cooking: "Dinner is Served!",
};

export function EventDashboard() {
  const activeEvent = useSocialCookingStore((s) => s.activeEvent);
  const guests = useSocialCookingStore((s) => s.guests);
  const votes = useSocialCookingStore((s) => s.votes);
  const dishes = useSocialCookingStore((s) => s.dishes);
  const roles = useSocialCookingStore((s) => s.roles);
  const updateEventStatus = useSocialCookingStore((s) => s.updateEventStatus);
  const cancelEvent = useSocialCookingStore((s) => s.cancelEvent);

  if (!activeEvent) return null;

  const confirmedCount = guests.filter((g) => g.rsvp_status === "confirmed").length;
  const pendingCount = guests.filter((g) => g.rsvp_status === "invited" || g.rsvp_status === "maybe").length;

  // Next status in flow
  const currentIdx = STATUS_FLOW.indexOf(activeEvent.status);
  const nextStatus = currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
    ? STATUS_FLOW[currentIdx + 1]
    : null;
  const nextLabel = nextStatus ? NEXT_STATUS_LABEL[activeEvent.status] : null;

  const handleAdvance = () => {
    if (!nextStatus) return;
    lightTap();
    updateEventStatus(nextStatus);
  };

  const handleCancel = () => {
    lightTap();
    cancelEvent();
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
      {/* Header */}
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
          {(() => {
            const EventIcon = getEventTypeIcon(activeEvent.event_type);
            return <EventIcon size={24} color={Colors.text.muted} strokeWidth={1.5} />;
          })()}
          <Text style={{ fontSize: 20, fontWeight: "700", color: Colors.secondary, flex: 1 }}>
            {activeEvent.title}
          </Text>
          <StatusBadge status={activeEvent.status} />
        </View>
        <Text style={{ fontSize: 14, color: Colors.text.secondary }}>
          {getEventTypeLabel(activeEvent.event_type)} · {formatEventDate(activeEvent.date_time)}
        </Text>
        {activeEvent.location && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <MapPin size={14} color={Colors.text.secondary} strokeWidth={1.5} />
            <Text style={{ fontSize: 14, color: Colors.text.secondary }}>
              {activeEvent.location}
            </Text>
          </View>
        )}
      </View>

      {/* Share */}
      <ShareSheet event={activeEvent} />

      {/* Guest Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guests</Text>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{confirmedCount}</Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{guests.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Sunday Roast: Vote Results */}
      {activeEvent.event_type === "sunday_roast" && activeEvent.menu_selected && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu Decided</Text>
          {Object.entries(
            (activeEvent.menu_selected as Record<string, unknown>).votes as Record<
              string,
              { winner: string; count: number }
            > ?? {},
          ).map(([category, result]) => (
            <View
              key={category}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: Colors.divider,
              }}
            >
              <Text style={{ fontSize: 14, color: Colors.text.secondary, textTransform: "capitalize" }}>
                {category}
              </Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.text.primary }}>
                {result.winner} ({result.count} votes)
              </Text>
            </View>
          ))}
        </View>
      )}

      {activeEvent.event_type === "sunday_roast" && !activeEvent.menu_selected && votes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Voting in Progress</Text>
          <Text style={{ fontSize: 14, color: Colors.text.secondary }}>
            {votes.length} vote{votes.length !== 1 ? "s" : ""} cast so far
          </Text>
        </View>
      )}

      {/* Party Mode: Menu + Roles */}
      {activeEvent.event_type === "party" && activeEvent.menu_selected && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Menu</Text>
          {((activeEvent.menu_selected as Record<string, unknown>).items as string[] ?? []).map(
            (item: string, i: number) => (
              <Text key={i} style={{ fontSize: 14, color: Colors.text.primary, paddingVertical: 4 }}>
                • {item}
              </Text>
            ),
          )}
        </View>
      )}

      {activeEvent.event_type === "party" && roles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roles ({roles.length})</Text>
          {roles.map((role) => (
            <View
              key={role.id}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: Colors.divider,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "500", color: Colors.text.primary }}>
                {role.role_name}
              </Text>
              <Text style={{ fontSize: 14, color: Colors.text.secondary }}>
                {role.person_name}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Dutch Prep: Dish Board Summary */}
      {activeEvent.event_type === "dutch_nosh" && dishes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Dish Board ({dishes.filter((d) => d.status !== "open").length}/{dishes.length} claimed)
          </Text>
          {dishes.map((dish) => (
            <View
              key={dish.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: Colors.divider,
              }}
            >
              <View style={{ marginRight: 8 }}>
                {(() => {
                  const DishIcon = getDishCategoryIcon(dish.dish_category);
                  return <DishIcon size={18} color={Colors.text.muted} strokeWidth={1.5} />;
                })()}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "500", color: Colors.text.primary }}>
                  {dish.dish_name}
                </Text>
                {dish.assigned_to_name && (
                  <Text style={{ fontSize: 12, color: Colors.text.secondary }}>
                    {dish.assigned_to_name}
                  </Text>
                )}
              </View>
              <View
                style={{
                  backgroundColor:
                    dish.status === "open"
                      ? Colors.alert + "18"
                      : dish.status === "ready"
                        ? Colors.success + "18"
                        : Colors.primary + "18",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "600",
                    color:
                      dish.status === "open"
                        ? Colors.alert
                        : dish.status === "ready"
                          ? Colors.success
                          : Colors.primary,
                    textTransform: "capitalize",
                  }}
                >
                  {dish.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Advance Status CTA */}
      {nextLabel && activeEvent.status !== "done" && (
        <Pressable
          onPress={handleAdvance}
          style={{
            backgroundColor: Colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700", textAlign: "center" }}>
            {nextLabel}
          </Text>
        </Pressable>
      )}

      {activeEvent.status === "done" && (
        <View
          style={{
            backgroundColor: Colors.success + "15",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <View style={{ marginBottom: 8 }}>
            <PartyPopper size={32} color={Colors.success} strokeWidth={1.5} />
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: Colors.success }}>
            Dinner complete!
          </Text>
        </View>
      )}

      {/* Cancel */}
      {activeEvent.status !== "done" && activeEvent.status !== "cancelled" && (
        <Pressable onPress={handleCancel} style={{ paddingVertical: 12 }}>
          <Text style={{ color: Colors.text.muted, textAlign: "center", fontSize: 14 }}>
            Cancel Event
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = {
  section: {
    backgroundColor: Glass.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  } as const,
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.secondary,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    alignItems: "center" as const,
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
};
