import { useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { X } from "lucide-react-native";
import { Colors, Glass } from "../../../constants/colors";
import { lightTap } from "../../../lib/haptics";
import { useSocialCookingStore } from "../../../lib/stores/socialCookingStore";
import type { SocialGuest, SocialEventType, SocialView } from "../../../lib/stores/socialCookingStore";
import { ShareSheet } from "./ShareSheet";

const RSVP_COLORS: Record<string, string> = {
  invited: Colors.text.muted,
  confirmed: Colors.success,
  declined: "#E53E3E",
  maybe: Colors.alert,
};

const NEXT_VIEW: Record<SocialEventType, SocialView> = {
  sunday_roast: "voting",
  party: "menu_pick",
  dutch_nosh: "dish_board",
};

export function GuestManager() {
  const activeEvent = useSocialCookingStore((s) => s.activeEvent);
  const guests = useSocialCookingStore((s) => s.guests);
  const addGuest = useSocialCookingStore((s) => s.addGuest);
  const removeGuest = useSocialCookingStore((s) => s.removeGuest);
  const setView = useSocialCookingStore((s) => s.setView);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  if (!activeEvent) return null;

  const handleAdd = async () => {
    if (!name.trim()) return;
    lightTap();
    await addGuest({
      user_id: null,
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      is_nosh_user: false,
      rsvp_status: "invited",
      dietary_requirements: [],
    });
    setName("");
    setPhone("");
    setEmail("");
  };

  const handleNext = () => {
    lightTap();
    const nextView = NEXT_VIEW[activeEvent.event_type];
    // For Sunday Roast, update status to voting
    if (activeEvent.event_type === "sunday_roast") {
      useSocialCookingStore.getState().updateEventStatus("voting");
    }
    setView(nextView);
  };

  const renderGuest = ({ item }: { item: SocialGuest }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.divider,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "500", color: Colors.text.primary }}>
          {item.name}
        </Text>
        {(item.phone || item.email) && (
          <Text style={{ fontSize: 13, color: Colors.text.secondary, marginTop: 2 }}>
            {item.phone || item.email}
          </Text>
        )}
      </View>
      <View
        style={{
          backgroundColor: RSVP_COLORS[item.rsvp_status] + "18",
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 12,
          marginRight: 10,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: "600", color: RSVP_COLORS[item.rsvp_status] }}>
          {item.rsvp_status}
        </Text>
      </View>
      <Pressable onPress={() => removeGuest(item.id)}>
        <X size={18} color={Colors.text.muted} strokeWidth={1.5} />
      </Pressable>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {/* Add Guest Form */}
      <View style={{ gap: 10, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: "600", color: Colors.secondary }}>
          Add Guests
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor={Colors.text.muted}
          value={name}
          onChangeText={setName}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Phone"
            placeholderTextColor={Colors.text.muted}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="Email"
            placeholderTextColor={Colors.text.muted}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        <Pressable
          onPress={handleAdd}
          disabled={!name.trim()}
          style={{
            backgroundColor: name.trim() ? Colors.secondary : Colors.border,
            paddingVertical: 10,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "#FFF", fontWeight: "600", textAlign: "center" }}>
            + Add Guest
          </Text>
        </Pressable>
      </View>

      {/* Guest List */}
      <Text style={{ fontSize: 14, fontWeight: "600", color: Colors.text.secondary, marginBottom: 8 }}>
        {guests.length} guest{guests.length !== 1 ? "s" : ""} added
      </Text>
      <FlatList
        data={guests}
        keyExtractor={(item) => item.id}
        renderItem={renderGuest}
        style={{ flex: 1 }}
        ListEmptyComponent={
          <Text style={{ color: Colors.text.muted, textAlign: "center", paddingVertical: 24 }}>
            No guests yet — add people above or share the invite
          </Text>
        }
      />

      {/* Share + Next */}
      <View style={{ gap: 12, paddingTop: 16 }}>
        <ShareSheet event={activeEvent} />
        <Pressable
          onPress={handleNext}
          style={{
            backgroundColor: Colors.primary,
            paddingVertical: 14,
            borderRadius: 12,
          }}
        >
          <Text style={{ color: "#FFF", fontSize: 16, fontWeight: "700", textAlign: "center" }}>
            {activeEvent.event_type === "sunday_roast"
              ? "Next — Start Voting"
              : activeEvent.event_type === "party"
                ? "Next — Pick Menu"
                : "Next — Set Up Dish Board"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text.primary,
    backgroundColor: Glass.surface,
  },
};
