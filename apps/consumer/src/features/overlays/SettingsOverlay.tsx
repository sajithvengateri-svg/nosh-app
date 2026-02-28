import { useState, useEffect } from "react";
import { View, Text, Pressable, ScrollView, Switch, StyleSheet, Linking, Alert } from "react-native";
import { UserPen, Map, Dna, BookOpen, Wrench, Sparkles, ShoppingCart } from "lucide-react-native";
import { Colors, Glass, AVAILABLE_THEMES, useThemeStore } from "../../constants/colors";
import { useAuth } from "../../contexts/AuthProvider";
import { supabase } from "../../lib/supabase";
import { lightTap, mediumTap } from "../../lib/haptics";
import { useWorkflowStore } from "../../lib/stores/workflowStore";
import { useCompanionStore } from "../../lib/companion/companionStore";
import { useSettingsStore } from "../../lib/stores/settingsStore";
import { useDevAccess } from "../../lib/devAccess";
import { useSmartDefaults } from "../../hooks/useSmartDefaults";
import { resetSmartDefaults } from "../../lib/engines/smartDefaultsEngine";

interface SettingRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
}

function SettingRow({ label, value, onPress }: SettingRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
    </Pressable>
  );
}

function NavModeToggle() {
  const smartNav = useSettingsStore((s) => s.smartNav);
  const setSmartNav = useSettingsStore((s) => s.setSmartNav);

  return (
    <View style={styles.settingRow}>
      <View>
        <Text style={styles.settingLabel}>Smart Navigation</Text>
        <Text style={{ fontSize: 11, color: Colors.text.muted, marginTop: 2 }}>
          {smartNav ? "Time + context aware" : "Gesture-driven"}
        </Text>
      </View>
      <Switch
        value={smartNav}
        onValueChange={(v) => { lightTap(); setSmartNav(v); }}
        trackColor={{ false: Colors.divider, true: Colors.primary + "66" }}
        thumbColor={smartNav ? Colors.primary : "#f4f3f4"}
      />
    </View>
  );
}

export function SettingsOverlay({ onOpenOverlay, onClose }: { onOpenOverlay?: (key: string) => void; onClose?: () => void }) {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { themeKey, setTheme } = useThemeStore();
  const workflowStore = useWorkflowStore();
  const callNosh = useCompanionStore((s) => s.callNosh);
  const homeNudges = useSettingsStore((s) => s.homeNudges);
  const setHomeNudges = useSettingsStore((s) => s.setHomeNudges);
  const devMode = useDevAccess((s) => s.enabled);
  const { defaults, isLoaded } = useSmartDefaults();
  const [isResetting, setIsResetting] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Theme section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {AVAILABLE_THEMES.map((theme) => (
            <Pressable
              key={theme.key}
              onPress={() => { lightTap(); setTheme(theme.key); }}
              style={{
                alignItems: "center",
                gap: 6,
              }}
            >
              <View style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: theme.primary,
                borderWidth: themeKey === theme.key ? 3 : 1,
                borderColor: themeKey === theme.key ? Colors.secondary : Glass.borderLight,
              }} />
              <Text style={{
                fontSize: 10,
                color: themeKey === theme.key ? Colors.secondary : Colors.text.muted,
                fontWeight: themeKey === theme.key ? "700" : "400",
              }}>
                {theme.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Profile section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        <SettingRow
          label="Name"
          value={profile?.display_name ?? "Not set"}
        />
        <SettingRow label="Email" value={user?.email ?? ""} />
        <SettingRow
          label="Subscription"
          value={profile?.subscription_tier === "sorted_plus" ? "Sorted+" : "Free"}
        />
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cooking Preferences</Text>
        <SettingRow label="Cuisine preferences" value="Tap to edit" />
        <SettingRow label="Spice level" value="Medium" />
        <SettingRow label="Adventure level" value="Moderate" />
        <SettingRow label="Weeknight max time" value="30 min" />
        <SettingRow label="Weekend max time" value="60 min" />
        <SettingRow label="Budget" value="Moderate" />
      </View>

      {/* Household */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Household</Text>
        <SettingRow label="Household members" value="Manage" />
        <SettingRow label="Dietary restrictions" value="None set" />
      </View>

      {/* Shopping Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shopping Preferences</Text>
        <View style={styles.settingRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <ShoppingCart size={18} color={Colors.text.secondary} strokeWidth={1.8} />
            <Text style={styles.settingLabel}>Smart defaults</Text>
          </View>
          <Text style={styles.settingValue}>
            {!isLoaded ? "Loading..." : defaults?.hasData ? "Active" : "Learning"}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            mediumTap();
            Alert.alert(
              "Reset Preferences",
              "This will clear all learned shopping preferences. Prep Mi will start learning again from scratch.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Reset",
                  style: "destructive",
                  onPress: async () => {
                    setIsResetting(true);
                    await resetSmartDefaults();
                    setIsResetting(false);
                  },
                },
              ],
            );
          }}
          style={styles.settingRow}
        >
          <Text style={[styles.settingLabel, { color: "#E53935" }]}>
            {isResetting ? "Resetting..." : "Reset my preferences"}
          </Text>
        </Pressable>
      </View>

      {/* Companion */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Companion</Text>
        <SettingRow
          label="Presence level"
          value={profile?.companion_presence ?? "balanced"}
        />
        <NavModeToggle />
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Home Screen Nudges</Text>
          <Switch
            value={homeNudges}
            onValueChange={(v) => { lightTap(); setHomeNudges(v); }}
            trackColor={{ false: Colors.divider, true: Colors.primary + "66" }}
            thumbColor={homeNudges ? Colors.primary : "#f4f3f4"}
          />
        </View>
      </View>

      {/* Call NOSH */}
      <Pressable
        onPress={() => {
          lightTap();
          onClose?.();
          setTimeout(() => callNosh(), 300);
        }}
        style={({ pressed }) => [
          styles.callNoshRow,
          pressed && { opacity: 0.7 },
        ]}
      >
        <Sparkles size={20} color={Colors.primary} strokeWidth={1.8} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: Colors.secondary }}>
            Call NOSH
          </Text>
          <Text style={{ fontSize: 12, color: Colors.text.muted, marginTop: 2 }}>
            Go to companion
          </Text>
        </View>
      </Pressable>

      {/* Workflows */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Workflows</Text>
        {([
          { key: "profile_builder", label: "Rebuild Your Profile", icon: UserPen },
          { key: "walkthrough", label: "App Walkthrough", icon: Map },
          { key: "personality_quiz", label: "Retake Personality Quiz", icon: Dna },
          { key: "recipe_lifecycle", label: "Recipe Lifecycle Guide", icon: BookOpen },
        ] as const).map(({ key, label, icon: Icon }) => {
          const completedAt = workflowStore.getCompletionDate(key);
          return (
            <Pressable
              key={key}
              onPress={() => { lightTap(); onOpenOverlay?.(key); }}
              style={styles.workflowRow}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <Icon size={20} color={Colors.text.secondary} strokeWidth={1.8} />
                <Text style={styles.settingLabel}>{label}</Text>
              </View>
              <Text style={styles.workflowDate}>
                {completedAt
                  ? `Last: ${new Date(completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                  : "Not started"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Sign out */}
      <Pressable
        onPress={() => {
          lightTap();
          signOut();
        }}
        style={styles.signOutButton}
      >
        <Text style={styles.signOutText}>Sign Out</Text>
      </Pressable>

      {/* Admin Panel - dev mode only */}
      {devMode && (
        <>
          <Pressable
            onPress={() => { lightTap(); Linking.openURL("https://nosh-admin-eight.vercel.app"); }}
            style={styles.adminRow}
          >
            <Wrench size={16} color={Colors.text.muted} strokeWidth={1.5} />
            <Text style={styles.adminText}>Admin Panel</Text>
          </Pressable>
          <Pressable
            onPress={() => { lightTap(); onOpenOverlay?.("nudge_config"); }}
            style={styles.adminRow}
          >
            <Wrench size={16} color={Colors.text.muted} strokeWidth={1.5} />
            <Text style={styles.adminText}>Nudge Config</Text>
          </Pressable>
        </>
      )}

      <Text style={styles.version}>NOSH v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: {
    marginBottom: 24,
    backgroundColor: Glass.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  settingLabel: { fontSize: 15, color: Colors.text.primary },
  settingValue: { fontSize: 14, color: Colors.text.secondary },
  signOutButton: {
    backgroundColor: "rgba(229, 57, 53, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(229, 57, 53, 0.25)",
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
  },
  signOutText: { fontSize: 15, fontWeight: "600", color: "#E53935" },
  workflowRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  workflowDate: {
    fontSize: 12,
    color: Colors.text.muted,
  },
  adminRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
  },
  adminText: {
    fontSize: 13,
    color: Colors.text.muted,
  },
  callNoshRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
    backgroundColor: Glass.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
  },
  version: {
    fontSize: 12,
    color: Colors.text.muted,
    textAlign: "center",
    marginTop: 20,
  },
});
