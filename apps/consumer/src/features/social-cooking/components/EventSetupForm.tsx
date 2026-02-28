import { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, Switch, Platform } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors, Glass } from "../../../constants/colors";
import { lightTap, selectionTap } from "../../../lib/haptics";
import { useSocialCookingStore } from "../../../lib/stores/socialCookingStore";
import type { SocialEventType } from "../../../lib/stores/socialCookingStore";

const OCCASION_OPTIONS = ["Regular Sunday", "Birthday", "Holiday", "Just Because"];

const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Nut-free",
  "Halal",
  "Kosher",
];

export function EventSetupForm({ eventType }: { eventType: SocialEventType }) {
  const draft = useSocialCookingStore((s) => s.draft);
  const updateDraft = useSocialCookingStore((s) => s.updateDraft);
  const saveEvent = useSocialCookingStore((s) => s.saveEvent);
  const activeEvent = useSocialCookingStore((s) => s.activeEvent);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedDate = draft.date_time ? new Date(draft.date_time) : new Date();
  const selectedDietary = (draft.dietary_requirements ?? []) as string[];

  const toggleDietary = (item: string) => {
    selectionTap();
    const current = [...selectedDietary];
    const idx = current.indexOf(item);
    if (idx >= 0) current.splice(idx, 1);
    else current.push(item);
    updateDraft({ dietary_requirements: current });
  };

  const handleNext = async () => {
    lightTap();
    if (!draft.title || !draft.date_time) return;

    setIsSaving(true);
    if (activeEvent) {
      // Already saved — just advance
      const nextView =
        eventType === "sunday_roast" ? "invite" :
        eventType === "party" ? "invite" :
        "invite";
      useSocialCookingStore.getState().setView(nextView);
    } else {
      await saveEvent();
    }
    setIsSaving(false);
  };

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 20 }}>
      {/* Title */}
      <View>
        <Text style={styles.label}>Event Name</Text>
        <TextInput
          style={styles.input}
          placeholder={
            eventType === "sunday_roast" ? "Sunday Roast" :
            eventType === "party" ? "Weekend BBQ" :
            "Potluck Dinner"
          }
          placeholderTextColor={Colors.text.muted}
          value={draft.title ?? ""}
          onChangeText={(title) => updateDraft({ title })}
        />
      </View>

      {/* Date & Time */}
      <View>
        <Text style={styles.label}>Date & Time</Text>
        <Pressable
          onPress={() => setShowDatePicker(true)}
          style={[styles.input, { justifyContent: "center" }]}
        >
          <Text style={{ color: draft.date_time ? Colors.text.primary : Colors.text.muted, fontSize: 16 }}>
            {draft.date_time
              ? new Date(draft.date_time).toLocaleString(undefined, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "Pick a date"}
          </Text>
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="datetime"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()}
            onChange={(_event, date) => {
              setShowDatePicker(Platform.OS === "ios");
              if (date) updateDraft({ date_time: date.toISOString() });
            }}
          />
        )}
      </View>

      {/* Location */}
      <View>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          placeholder="Home, a mate's place..."
          placeholderTextColor={Colors.text.muted}
          value={draft.location ?? ""}
          onChangeText={(location) => updateDraft({ location })}
        />
      </View>

      {/* Expected Guests */}
      <View>
        <Text style={styles.label}>Expected Guests</Text>
        <TextInput
          style={styles.input}
          placeholder="4"
          placeholderTextColor={Colors.text.muted}
          keyboardType="number-pad"
          value={draft.expected_guests?.toString() ?? ""}
          onChangeText={(v) => updateDraft({ expected_guests: parseInt(v) || null })}
        />
      </View>

      {/* Sunday Roast: Occasion */}
      {eventType === "sunday_roast" && (
        <View>
          <Text style={styles.label}>Occasion</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {OCCASION_OPTIONS.map((occ) => (
              <Pressable
                key={occ}
                onPress={() => {
                  selectionTap();
                  updateDraft({ occasion: occ });
                }}
                style={[
                  styles.chip,
                  draft.occasion === occ && styles.chipActive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    draft.occasion === occ && styles.chipTextActive,
                  ]}
                >
                  {occ}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Party Mode: Vibe + Cuisine */}
      {eventType === "party" && (
        <>
          <View>
            <Text style={styles.label}>Vibe</Text>
            <TextInput
              style={styles.input}
              placeholder="Casual, fancy, tropical..."
              placeholderTextColor={Colors.text.muted}
              value={draft.vibe ?? ""}
              onChangeText={(vibe) => updateDraft({ vibe })}
            />
          </View>
          <View>
            <Text style={styles.label}>Cuisine Preference</Text>
            <TextInput
              style={styles.input}
              placeholder="Italian, Mexican, anything..."
              placeholderTextColor={Colors.text.muted}
              value={draft.cuisine ?? ""}
              onChangeText={(cuisine) => updateDraft({ cuisine })}
            />
          </View>
        </>
      )}

      {/* Sunday Roast + Party: Boss Decides toggle */}
      {(eventType === "sunday_roast" || eventType === "party") && (
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={styles.label}>Boss Decides</Text>
          <Switch
            value={!!draft.boss_user_id}
            onValueChange={(v) =>
              updateDraft({ boss_user_id: v ? "self" : null })
            }
            trackColor={{ true: Colors.primary }}
          />
        </View>
      )}

      {/* Dietary Requirements */}
      <View>
        <Text style={styles.label}>Dietary Requirements</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {DIETARY_OPTIONS.map((item) => (
            <Pressable
              key={item}
              onPress={() => toggleDietary(item)}
              style={[
                styles.chip,
                selectedDietary.includes(item) && styles.chipActive,
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedDietary.includes(item) && styles.chipTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Next CTA */}
      <Pressable
        onPress={handleNext}
        disabled={!draft.title || !draft.date_time || isSaving}
        style={{
          backgroundColor: draft.title && draft.date_time ? Colors.primary : Colors.border,
          paddingVertical: 14,
          borderRadius: 12,
          marginTop: 8,
        }}
      >
        <Text
          style={{
            color: "#FFF",
            fontSize: 16,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          {isSaving ? "Saving..." : "Next — Add Guests"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = {
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.text.primary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text.primary,
    backgroundColor: Glass.surface,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary + "15",
    borderColor: Glass.borderLight,
  },
  chipText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  chipTextActive: {
    color: Colors.primary,
    fontWeight: "600" as const,
  },
};
