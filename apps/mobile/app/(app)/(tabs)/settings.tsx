import { useState, useMemo } from "react";
import { View, Text, Pressable, Alert, ScrollView, Switch, ActivityIndicator, TextInput, FlatList, Platform } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useAuth } from "../../../contexts/AuthProvider";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme, THEMES, type ThemeId } from "../../../contexts/ThemeProvider";
import { FormSheet } from "../../../components/ui/FormSheet";
import { Input } from "../../../components/ui/Input";
import { Select } from "../../../components/ui/Select";
import { DatePicker } from "../../../components/ui/DatePicker";
import { supabase } from "../../../lib/supabase";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { useAppSettings } from "../../../hooks/useAppSettings";
import { useOrgSettings } from "../../../hooks/useOrgSettings";

import { ChevronRight } from "lucide-react-native";
import { isHomeCook, isCompliance, isVendor } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
import { VendorSettings } from "../../../components/features/vendor/VendorSettings";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOMECHEF = isHomeCook(APP_VARIANT);
const IS_EATSAFE = isCompliance(APP_VARIANT);

const BASE_SETTINGS_TABS = [
  { key: "general", label: "General" },
  { key: "profile", label: "Profile" },
  ...(!IS_EATSAFE ? [{ key: "ai", label: "AI" }] : []),
  { key: "units", label: "Units" },
  ...(!IS_HOMECHEF && !IS_EATSAFE ? [{ key: "integrations", label: "Widgets" }] : []),
  ...(!IS_EATSAFE ? [{ key: "command", label: "To Do" }] : []),
  ...(!IS_HOMECHEF && !IS_EATSAFE ? [{ key: "training", label: "Training" }] : []),
  { key: "privacy", label: "Privacy" },
  { key: "help", label: "Help" },
];

const HEAD_CHEF_TABS = [
  { key: "audit", label: "Audit Log" },
  { key: "service", label: "Service Desk" },
  { key: "storage", label: "Storage" },
  { key: "calendar", label: "Calendar" },
];

const HOMECHEF_SOCIAL_TAB = { key: "social", label: "Social" };

type SettingsTab = "general" | "profile" | "ai" | "units" | "integrations" | "command" | "training" | "privacy" | "help" | "audit" | "service" | "storage" | "social" | "calendar";

function getSettingsTabs(isHeadChef: boolean): { key: string; label: string }[] {
  const tabs = [...BASE_SETTINGS_TABS];
  if (isHeadChef && !IS_HOMECHEF && !IS_EATSAFE) {
    tabs.push(...HEAD_CHEF_TABS);
  }
  if (IS_HOMECHEF) {
    tabs.push(HOMECHEF_SOCIAL_TAB);
  }
  return tabs;
}

function SectionHeader({ title }: { title: string }) {
  const { colors } = useTheme();
  return (
    <Text style={{ fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 20, paddingBottom: 8, paddingTop: 16 }}>
      {title}
    </Text>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginHorizontal: 16, borderRadius: 16, overflow: "hidden", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 16 }}>
      {children}
    </View>
  );
}

function ToggleRow({ label, value, onToggle, description }: { label: string; value: boolean; onToggle: (v: boolean) => void; description?: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text }}>{label}</Text>
        {description && <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{description}</Text>}
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: colors.accent }} />
    </View>
  );
}

function SelectRow({ label, value, onValueChange, options }: { label: string; value: string; onValueChange: (v: string) => void; options: { label: string; value: string }[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
      <Select label={label} value={value} onValueChange={onValueChange} options={options} />
    </View>
  );
}

function ActionRow({ label, onPress, color, description }: { label: string; onPress: () => void; color?: string; description?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 14, paddingHorizontal: 16,
        backgroundColor: pressed ? colors.surface : "transparent",
        borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
      })}
    >
      <Text style={{ fontSize: 16, fontWeight: "500", color: color || colors.accent }}>{label}</Text>
      {description && <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{description}</Text>}
    </Pressable>
  );
}

// ─── General Tab ──────────────────────────────────────────────
function GeneralTab({ settings, updateSetting, router }: { settings: ReturnType<typeof useAppSettings>["settings"]; updateSetting: ReturnType<typeof useAppSettings>["updateSetting"]; router: ReturnType<typeof useRouter> }) {
  const { colors } = useTheme();
  return (
    <>
      <SectionHeader title="Theme" />
      <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {THEMES.map((t) => {
            const isActive = settings.theme === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => updateSetting("theme", t.id as any)}
                style={{
                  width: "47%",
                  flexGrow: 1,
                  padding: 12,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: isActive ? colors.accent : colors.cardBorder,
                  backgroundColor: isActive ? colors.accent + "10" : colors.card,
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {t.swatches.map((c, i) => (
                    <View key={i} style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" }} />
                  ))}
                </View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? colors.accent : colors.text }}>{t.label}</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted, textAlign: "center" }}>{t.desc}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <SectionHeader title="Appearance" />
      <Card>
        <ToggleRow label="Compact Mode" value={settings.compactMode} onToggle={(v) => updateSetting("compactMode", v)} />
        <ToggleRow label="Animations" value={settings.animations} onToggle={(v) => updateSetting("animations", v)} />
      </Card>

      <SectionHeader title="Image Optimization" />
      <Card>
        <ToggleRow label="Auto-compress Images" value={settings.autoCompress} onToggle={(v) => updateSetting("autoCompress", v)} description="Reduce image size before upload" />
        <SelectRow
          label="Image Quality"
          value={settings.imageQuality}
          onValueChange={(v) => updateSetting("imageQuality", v as "low" | "medium" | "high")}
          options={[
            { label: "Low (50%)", value: "low" },
            { label: "Medium (70%)", value: "medium" },
            { label: "High (90%)", value: "high" },
          ]}
        />
        <SelectRow
          label="Max Image Size"
          value={settings.maxImageSize}
          onValueChange={(v) => updateSetting("maxImageSize", v as "1024" | "1600" | "2048")}
          options={[
            { label: "1024px", value: "1024" },
            { label: "1600px", value: "1600" },
            { label: "2048px", value: "2048" },
          ]}
        />
      </Card>

      <SectionHeader title="Notifications" />
      <Card>
        <ToggleRow label="Push Notifications" value={settings.pushNotifications} onToggle={(v) => updateSetting("pushNotifications", v)} />
        <ToggleRow label="Email Notifications" value={settings.emailNotifications} onToggle={(v) => updateSetting("emailNotifications", v)} />
        <ToggleRow label="Prep Reminders" value={settings.prepReminders} onToggle={(v) => updateSetting("prepReminders", v)} />
        <ToggleRow label="Expiry Alerts" value={settings.expiryAlerts} onToggle={(v) => updateSetting("expiryAlerts", v)} />
      </Card>

      <SectionHeader title="Links" />
      <Card>
        <ActionRow label="Refer & Save" onPress={() => router.push("/(app)/refer")} description="Earn credits by referring friends" />
        <ActionRow label="Send Feedback" onPress={() => router.push("/(app)/feedback")} description="Help us improve ChefOS" />
      </Card>
    </>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────
function ProfileTab({ router }: { router: ReturnType<typeof useRouter> }) {
  const { profile, signOut } = useAuth();
  const { currentOrg } = useOrg();
  const { colors } = useTheme();
  const [editProfile, setEditProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState((profile as any)?.phone || "");
  const [birthday, setBirthday] = useState((profile as any)?.birthday || "");

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone, birthday: birthday || null })
        .eq("id", profile.id);
      if (error) throw error;
      setEditProfile(false);
      Alert.alert("Saved", "Profile updated successfully");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    if (!profile?.email) return;
    Alert.alert(
      "Change Password",
      `We'll send a password reset email to ${profile.email}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send Email",
          onPress: async () => {
            try {
              const { error } = await supabase.auth.resetPasswordForEmail(profile.email!);
              if (error) throw error;
              Alert.alert("Sent", "Check your email for the password reset link");
            } catch (e: any) {
              Alert.alert("Error", e.message || "Failed to send reset email");
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <SectionHeader title="Profile Information" />
      <Card>
        <Pressable
          onPress={() => {
            setFullName(profile?.full_name || "");
            setPhone((profile as any)?.phone || "");
            setBirthday((profile as any)?.birthday || "");
            setEditProfile(true);
          }}
          style={({ pressed }) => ({
            padding: 16,
            backgroundColor: pressed ? colors.surface : IS_HOMECHEF ? colors.warningBg : colors.accentBg,
            borderBottomWidth: 1, borderBottomColor: colors.cardBorder,
          })}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text }}>{profile?.full_name || "Your Name"}</Text>
              <Text style={{ fontSize: 14, color: colors.textSecondary, marginTop: 2 }}>{profile?.email}</Text>
              {(profile as any)?.role && (
                <View style={{ backgroundColor: colors.accent + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start", marginTop: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: colors.accent }}>{(profile as any).role === "head_chef" ? "Head Chef" : "Line Chef"}</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 14, color: colors.accent, fontWeight: "600" }}>Edit</Text>
          </View>
        </Pressable>
        {currentOrg?.name && (
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
            <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text }}>Organization</Text>
            <Text style={{ fontSize: 15, color: colors.textMuted }}>{currentOrg.name}</Text>
          </View>
        )}
      </Card>

      <SectionHeader title="Security" />
      <Card>
        <ActionRow label="Change Password" onPress={handleChangePassword} description="Send a password reset email" />
      </Card>

      <FormSheet visible={editProfile} onClose={() => setEditProfile(false)} onSave={handleSaveProfile} title="Edit Profile" saving={saving}>
        <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your name" />
        <Input label="Phone" value={phone} onChangeText={setPhone} placeholder="+61 400 000 000" keyboardType="phone-pad" />
        <Input label="Birthday" value={birthday} onChangeText={setBirthday} placeholder="YYYY-MM-DD" />
        <View style={{ backgroundColor: colors.surface, borderRadius: 12, padding: 14 }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>Email</Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary, marginTop: 2 }}>{profile?.email}</Text>
        </View>
      </FormSheet>
    </>
  );
}

// ─── AI Tab ───────────────────────────────────────────────────
function AITab({ settings, updateSetting }: { settings: ReturnType<typeof useAppSettings>["settings"]; updateSetting: ReturnType<typeof useAppSettings>["updateSetting"] }) {
  const { colors } = useTheme();
  const enabledCount = [settings.aiChat, settings.aiVoice, settings.aiOcr].filter(Boolean).length;
  const isHomeCookVariant = isHomeCook(APP_VARIANT);

  return (
    <>
      {/* Info banner */}
      <View style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 8, backgroundColor: colors.warningBg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.warning + "40" }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.warning }}>AI features consume credits</Text>
        <Text style={{ fontSize: 12, color: colors.warning, marginTop: 2 }}>Enable only the features you need. All features are opt-in.</Text>
      </View>

      {/* Companion section (homecook only) */}
      {isHomeCookVariant && (
        <>
          <SectionHeader title="AI Companion" />
          <Card>
            <ToggleRow
              label="Enable Cooking Companion"
              value={settings.companionEnabled}
              onToggle={(v) => updateSetting("companionEnabled", v)}
              description="Your personal AI kitchen buddy that learns your preferences"
            />
            <ToggleRow
              label="Voice"
              value={settings.companionVoiceEnabled}
              onToggle={(v) => updateSetting("companionVoiceEnabled", v)}
              description="Talk to your companion using voice"
            />
          </Card>
          {settings.companionVoiceEnabled && (
            <>
              <SectionHeader title="Voice Provider" />
              <Card>
                <Pressable
                  onPress={() => updateSetting("companionVoiceProvider", "elevenlabs")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      borderColor: settings.companionVoiceProvider === "elevenlabs" ? colors.accent : colors.border,
                      backgroundColor: settings.companionVoiceProvider === "elevenlabs" ? colors.accent : "transparent",
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>ElevenLabs</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>High quality text-to-speech + device mic for input</Text>
                  </View>
                </Pressable>
                <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 14 }} />
                <Pressable
                  onPress={() => updateSetting("companionVoiceProvider", "vapi")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 14,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 2,
                      borderColor: settings.companionVoiceProvider === "vapi" ? colors.accent : colors.border,
                      backgroundColor: settings.companionVoiceProvider === "vapi" ? colors.accent : "transparent",
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>Vapi</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>Full voice agent — talk naturally like a phone call</Text>
                  </View>
                </Pressable>
              </Card>
            </>
          )}
        </>
      )}

      <SectionHeader title="Chef AI Assistant" />
      <Card>
        <ToggleRow label="Enable AI Chat" value={settings.aiChat} onToggle={(v) => updateSetting("aiChat", v)} description="Recipe substitutions, HACCP help, inventory optimization" />
      </Card>

      <SectionHeader title="Voice Commands" />
      <Card>
        <ToggleRow label="Enable Voice Control" value={settings.aiVoice} onToggle={(v) => updateSetting("aiVoice", v)} description="Hands-free navigation and commands" />
      </Card>

      <SectionHeader title="Smart Scanning (OCR)" />
      <Card>
        <ToggleRow label="Enable OCR Scanning" value={settings.aiOcr} onToggle={(v) => updateSetting("aiOcr", v)} description="Scan invoices, recipe cards, equipment labels" />
      </Card>

      <View style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 16 }}>
        <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>{enabledCount} of 3 AI features enabled</Text>
      </View>
    </>
  );
}

// ─── Units Tab ────────────────────────────────────────────────
function UnitsTab({ settings, updateSetting }: { settings: ReturnType<typeof useAppSettings>["settings"]; updateSetting: ReturnType<typeof useAppSettings>["updateSetting"] }) {
  return (
    <>
      <SectionHeader title="Measurement Units" />
      <Card>
        <SelectRow
          label="Weight & Volume"
          value={settings.units}
          onValueChange={(v) => updateSetting("units", v)}
          options={[
            { label: "Metric (kg, L, °C)", value: "metric" },
            { label: "Imperial (lb, gal, °F)", value: "imperial" },
          ]}
        />
        <SelectRow
          label="Temperature"
          value={settings.tempUnit}
          onValueChange={(v) => updateSetting("tempUnit", v)}
          options={[
            { label: "Celsius (°C)", value: "celsius" },
            { label: "Fahrenheit (°F)", value: "fahrenheit" },
          ]}
        />
        <SelectRow
          label="Currency"
          value={settings.currency}
          onValueChange={(v) => updateSetting("currency", v)}
          options={[
            { label: "$ (AUD)", value: "$" },
            { label: "$ (USD)", value: "USD" },
            { label: "€ (EUR)", value: "€" },
            { label: "£ (GBP)", value: "£" },
            { label: "$ (NZD)", value: "NZ$" },
          ]}
        />
        <SelectRow
          label="Date Format"
          value={settings.dateFormat}
          onValueChange={(v) => updateSetting("dateFormat", v)}
          options={[
            { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
            { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
            { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
          ]}
        />
        <SelectRow
          label="Time Format"
          value={settings.timeFormat}
          onValueChange={(v) => updateSetting("timeFormat", v)}
          options={[
            { label: "12-hour (1:30 PM)", value: "12" },
            { label: "24-hour (13:30)", value: "24" },
          ]}
        />
      </Card>

      {!IS_HOMECHEF && (
        <>
          <SectionHeader title="Tax & Costing" />
          <Card>
            <SelectRow
              label="Default Tax Rate"
              value={settings.taxRate}
              onValueChange={(v) => updateSetting("taxRate", v)}
              options={[
                { label: "0%", value: "0" },
                { label: "5%", value: "5" },
                { label: "10%", value: "10" },
                { label: "15%", value: "15" },
                { label: "20%", value: "20" },
              ]}
            />
            <SelectRow
              label="Target Food Cost %"
              value={settings.targetFoodCost}
              onValueChange={(v) => updateSetting("targetFoodCost", v)}
              options={[
                { label: "25%", value: "25" },
                { label: "28%", value: "28" },
                { label: "30%", value: "30" },
                { label: "32%", value: "32" },
                { label: "35%", value: "35" },
              ]}
            />
          </Card>
        </>
      )}
    </>
  );
}

// ─── Privacy Tab ──────────────────────────────────────────────
function PrivacyTab({ settings, updateSetting, resetSettings, router }: {
  settings: ReturnType<typeof useAppSettings>["settings"];
  updateSetting: ReturnType<typeof useAppSettings>["updateSetting"];
  resetSettings: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const { signOut } = useAuth();
  const { colors } = useTheme();

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          try { await signOut(); router.replace("/(auth)/landing"); }
          catch (e: any) { Alert.alert("Error", e.message || "Failed to sign out"); }
        },
      },
    ]);
  };

  const handleClearCache = () => {
    Alert.alert("Clear Cache", "This will remove locally stored data. Your account data is safe.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        onPress: async () => {
          try {
            const keys = await (await import("@react-native-async-storage/async-storage")).default.getAllKeys();
            const cacheKeys = keys.filter((k) => k.startsWith("chefos_"));
            await (await import("@react-native-async-storage/async-storage")).default.multiRemove(cacheKeys);
            Alert.alert("Done", "Cache cleared successfully");
          } catch {
            Alert.alert("Error", "Failed to clear cache");
          }
        },
      },
    ]);
  };

  const handleResetAll = () => {
    Alert.alert("Reset Settings", "This will reset all settings to their default values.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: () => { resetSettings(); Alert.alert("Done", "All settings reset to defaults"); } },
    ]);
  };

  return (
    <>
      <SectionHeader title="Privacy & Security" />
      <Card>
        <ToggleRow label="Show Profile to Team" value={settings.showProfileToTeam} onToggle={(v) => updateSetting("showProfileToTeam", v)} />
        <ToggleRow label="Show Activity Status" value={settings.showActivityStatus} onToggle={(v) => updateSetting("showActivityStatus", v)} />
        <ToggleRow label="Share Analytics" value={settings.shareAnalytics} onToggle={(v) => updateSetting("shareAnalytics", v)} />
        <SelectRow
          label="Session Timeout"
          value={settings.sessionTimeout}
          onValueChange={(v) => updateSetting("sessionTimeout", v)}
          options={[
            { label: "30 minutes", value: "30m" },
            { label: "1 hour", value: "1h" },
            { label: "4 hours", value: "4h" },
            { label: "24 hours", value: "24h" },
            { label: "Never", value: "never" },
          ]}
        />
      </Card>

      <SectionHeader title="Data" />
      <Card>
        <ActionRow label="Clear Local Cache" onPress={handleClearCache} color={colors.textSecondary} description="Remove locally stored data" />
        <ActionRow label="Delete Account" onPress={() => router.push("/(app)/delete-account")} color={colors.destructive} description="Permanently delete your account" />
      </Card>

      <SectionHeader title="Reset" />
      <Card>
        <ActionRow label="Reset All Settings to Defaults" onPress={handleResetAll} color={colors.textSecondary} />
      </Card>

      {/* Sign out */}
      <Pressable
        onPress={handleSignOut}
        style={{ marginHorizontal: 16, backgroundColor: colors.destructiveBg, paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 8 }}
      >
        <Text style={{ color: colors.destructive, fontWeight: "700", fontSize: 16 }}>Sign Out</Text>
      </Pressable>
    </>
  );
}

// ─── Integrations / Widgets Tab ───────────────────────────────
function IntegrationsTab() {
  const { colors } = useTheme();
  const { showReservations, showPosSales, updateSetting, updating } = useOrgSettings();

  return (
    <>
      <SectionHeader title="Dashboard Widgets" />
      <Card>
        <ToggleRow
          label="Show Reservations"
          value={showReservations}
          onToggle={(v) => updateSetting("show_reservations", v)}
          description="Display tonight's covers, bookings, and VIP guests"
        />
        <ToggleRow
          label="Show POS Sales"
          value={showPosSales}
          onToggle={(v) => updateSetting("show_pos_sales", v)}
          description="Display revenue, orders, and top-selling items"
        />
      </Card>

      <View style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 16, backgroundColor: colors.accentBg, borderRadius: 12, padding: 14 }}>
        <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
          Widgets pull data from your reservation system and POS. Connect external systems via API in your web dashboard to sync data automatically.
        </Text>
      </View>
    </>
  );
}

// ─── To Do Tab ───────────────────────────────────────────────
const ALL_TODO_TOGGLES: { key: keyof ReturnType<typeof useAppSettings>["settings"]; label: string; description: string; businessOnly?: boolean }[] = [
  { key: "todoKanbanEnabled", label: "Kanban Board", description: "Drag & drop task board view" },
  { key: "todoDayCarouselEnabled", label: "Day Carousel", description: "Mon–Sun navigation strip" },
  { key: "todoProgressBarEnabled", label: "Progress Bar", description: "Show completion progress" },
  { key: "todoShoppingTabEnabled", label: "Shopping Tab", description: "Separate shopping list tab" },
  { key: "todoChefOrdersEnabled", label: "Chef Orders", description: "Review incoming task requests", businessOnly: true },
  { key: "todoHandwriteEnabled", label: "Handwriting Input", description: "Finger-write tasks with AI recognition" },
  { key: "todoScanEnabled", label: "Photo Scan", description: "Scan photos to extract tasks" },
  { key: "todoTemplatesEnabled", label: "Templates", description: "Save & reuse task templates" },
  { key: "todoDelegateEnabled", label: "Task Delegation", description: "Send tasks to team members", businessOnly: true },
  { key: "todoVoiceEnabled", label: "Voice Commands", description: "Control the portal with your voice" },
  { key: "todoWorkflowsEnabled", label: IS_HOMECHEF ? "Routines" : "Workflows", description: "Recurring task automation" },
  { key: "todoAiSuggestEnabled", label: "AI Suggest", description: "Smart task suggestions powered by AI" },
  { key: "todoSearchEnabled", label: "Search", description: "Search tasks across all dates" },
  { key: "todoArchiveEnabled", label: "Archive", description: "Browse and restore archived tasks" },
  { key: "thoughtOfDayEnabled", label: "Thought of the Day", description: "Daily motivational message" },
];

const TODO_TOGGLES = IS_HOMECHEF ? ALL_TODO_TOGGLES.filter((t) => !t.businessOnly) : ALL_TODO_TOGGLES;

function CommandCentreTab({ settings, updateSetting }: {
  settings: ReturnType<typeof useAppSettings>["settings"];
  updateSetting: ReturnType<typeof useAppSettings>["updateSetting"];
}) {
  const { colors } = useTheme();
  const enabledCount = TODO_TOGGLES.filter((t) => settings[t.key]).length;

  return (
    <>
      <SectionHeader title="To Do Features" />
      <Card>
        {TODO_TOGGLES.map((toggle) => (
          <ToggleRow
            key={toggle.key}
            label={toggle.label}
            value={settings[toggle.key] as boolean}
            onToggle={(v) => updateSetting(toggle.key, v as any)}
            description={toggle.description}
          />
        ))}
      </Card>
      <View style={{ marginHorizontal: 16, marginTop: 4, marginBottom: 16 }}>
        <Text style={{ fontSize: 13, color: colors.textMuted, textAlign: "center" }}>
          {enabledCount} of {TODO_TOGGLES.length} features enabled
        </Text>
      </View>
    </>
  );
}

// ─── Training Tab ─────────────────────────────────────────────
function TrainingTab() {
  const { colors } = useTheme();
  const { settings, showDishPar, enableChefNudges, autoAudit2hr, autoAudit30min, updateSetting } = useOrgSettings();
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [retraining, setRetraining] = useState(false);

  const handleUploadCSV = async () => {
    try {
      const DocumentPicker = await import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({ type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"] });
      if (result.canceled || !result.assets?.[0]) return;

      setUploading(true);
      const file = result.assets[0];
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const reader = new FileReader();

      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1] || result);
        };
        reader.readAsDataURL(blob);
      });

      const { data, error } = await supabase.functions.invoke("import-sales-history", {
        body: { orgId: currentOrg?.id, fileBase64: base64, fileName: file.name },
      });
      if (error) throw error;
      setUploadStatus(`Imported ${data.rows_imported} rows (${data.unique_items} items, ${data.date_range?.start} to ${data.date_range?.end})`);
      Alert.alert("Import Complete", `${data.rows_imported} sales records imported`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to import");
    } finally {
      setUploading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      const { data, error } = await supabase.functions.invoke("predict-dish-par", {
        body: { orgId: currentOrg?.id, date: new Date().toISOString().split("T")[0] },
      });
      if (error) throw error;
      Alert.alert("Model Retrained", `${data.predictions?.length || 0} dishes analyzed`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to retrain");
    } finally {
      setRetraining(false);
    }
  };

  const { currentOrg } = useOrg();

  return (
    <>
      <SectionHeader title="Historical Sales Data" />
      <Card>
        <ActionRow
          label={uploading ? "Uploading..." : "Upload Sales CSV"}
          onPress={handleUploadCSV}
          description="CSV with columns: date, item_name, quantity_sold"
        />
        {uploadStatus && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
            <Text style={{ fontSize: 13, color: colors.success, fontWeight: "600" }}>{uploadStatus}</Text>
          </View>
        )}
      </Card>

      <SectionHeader title="Dish Par Model" />
      <Card>
        <ActionRow
          label={retraining ? "Retraining..." : "Retrain Model"}
          onPress={handleRetrain}
          description="Recalculate dish predictions from all data"
        />
      </Card>

      <SectionHeader title="Feature Toggles" />
      <Card>
        <ToggleRow label="Dish Par Predictions" value={showDishPar} onToggle={(v) => updateSetting("show_dish_par", v)} description="Predict prep quantities from POS + cover data" />
        <ToggleRow label="Chef Nudges" value={enableChefNudges} onToggle={(v) => updateSetting("enable_chef_nudges", v)} description="Evening and morning prep reminders" />
        <ToggleRow label="Pre-Service Audit (2hr)" value={autoAudit2hr} onToggle={(v) => updateSetting("auto_audit_2hr", v)} description="Auto-audit 2 hours before service" />
        <ToggleRow label="Pre-Service Audit (30min)" value={autoAudit30min} onToggle={(v) => updateSetting("auto_audit_30min", v)} description="Quick check 30 minutes before service" />
      </Card>
    </>
  );
}

// ─── Audit Log Tab (Head Chef only) ──────────────────────────

const ACTION_ICONS: Record<string, { icon: string; color: string }> = {
  create: { icon: "+", color: "#10B981" },
  update: { icon: "~", color: "#3B82F6" },
  delete: { icon: "x", color: "#EF4444" },
  complete: { icon: "\u2713", color: "#22C55E" },
  assign: { icon: "\u2192", color: "#8B5CF6" },
  import: { icon: "\u2193", color: "#F59E0B" },
};

interface ActivityEntry {
  id: string;
  user_name: string | null;
  action_type: string;
  entity_type: string;
  entity_name: string | null;
  created_at: string;
}

function AuditLogTab() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-log", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data, error } = await supabase
        .from("activity_log")
        .select("id, user_name, action_type, entity_type, entity_name, created_at")
        .eq("org_id", currentOrg.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as ActivityEntry[];
    },
    enabled: !!currentOrg?.id,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        (l.user_name || "").toLowerCase().includes(q) ||
        (l.entity_name || "").toLowerCase().includes(q) ||
        l.action_type.toLowerCase().includes(q) ||
        l.entity_type.toLowerCase().includes(q)
    );
  }, [logs, search]);

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const mon = months[d.getMonth()];
    const hr = d.getHours().toString().padStart(2, "0");
    const min = d.getMinutes().toString().padStart(2, "0");
    return `${day} ${mon} ${hr}:${min}`;
  };

  return (
    <>
      <SectionHeader title="Activity Trail" />

      {/* Search */}
      <View style={{ marginHorizontal: 16, marginBottom: 12 }}>
        <TextInput
          placeholder="Search by user, entity, action..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 14,
            color: colors.text,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
        />
      </View>

      {isLoading ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} />
          <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>Loading audit log...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>No activity logged yet</Text>
        </View>
      ) : (
        <Card>
          {filtered.map((entry, idx) => {
            const actionInfo = ACTION_ICONS[entry.action_type] || { icon: "?", color: colors.textMuted };
            return (
              <View
                key={entry.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderBottomWidth: idx < filtered.length - 1 ? 1 : 0,
                  borderBottomColor: colors.cardBorder,
                  gap: 10,
                }}
              >
                {/* Action icon */}
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: actionInfo.color + "20",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "800", color: actionInfo.color }}>{actionInfo.icon}</Text>
                </View>

                {/* Details */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text }} numberOfLines={1}>
                    {entry.user_name || "System"}{" "}
                    <Text style={{ color: actionInfo.color, fontWeight: "700" }}>{entry.action_type}</Text>{" "}
                    <Text style={{ color: colors.textSecondary }}>{entry.entity_type}</Text>
                  </Text>
                  {entry.entity_name && (
                    <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }} numberOfLines={1}>
                      {entry.entity_name}
                    </Text>
                  )}
                </View>

                {/* Timestamp */}
                <Text style={{ fontSize: 11, color: colors.textMuted }}>{formatTimestamp(entry.created_at)}</Text>
              </View>
            );
          })}
        </Card>
      )}

      <View style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 16 }}>
        <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center" }}>
          Showing {filtered.length} of {logs.length} events
        </Text>
      </View>
    </>
  );
}

// ─── Service Desk Tab (Head Chef only) ───────────────────────

const TICKET_CATEGORIES = [
  { label: "Bug", value: "bug" },
  { label: "Feature Request", value: "feature_request" },
  { label: "Feedback", value: "feedback" },
  { label: "Billing", value: "billing" },
  { label: "Data Issue", value: "data_issue" },
  { label: "Other", value: "other" },
];

const TICKET_PRIORITIES = ["low", "medium", "high", "critical"] as const;

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  low: { bg: "#6B728020", text: "#6B7280" },
  medium: { bg: "#3B82F620", text: "#3B82F6" },
  high: { bg: "#F59E0B20", text: "#F59E0B" },
  critical: { bg: "#EF444420", text: "#EF4444" },
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: "#F59E0B20", text: "#F59E0B" },
  in_progress: { bg: "#3B82F620", text: "#3B82F6" },
  resolved: { bg: "#10B98120", text: "#10B981" },
  closed: { bg: "#6B728020", text: "#6B7280" },
};

function ServiceDeskTab() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("bug");
  const [priority, setPriority] = useState("medium");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("org_id", currentOrg.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrg?.id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!currentOrg?.id || !profile?.id) throw new Error("Missing context");
      if (!subject.trim() || !description.trim()) throw new Error("Subject and description are required");

      const { error } = await supabase.from("support_tickets").insert({
        org_id: currentOrg.id,
        created_by: profile.id,
        created_by_name: profile.full_name,
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        status: "open",
        attachment_urls: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      Alert.alert("Submitted", "Your ticket has been submitted successfully");
      setSubject("");
      setDescription("");
      setCategory("bug");
      setPriority("medium");
      queryClient.invalidateQueries({ queryKey: ["support-tickets", currentOrg?.id] });
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message || "Failed to submit ticket");
    },
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  };

  return (
    <>
      <SectionHeader title="Raise a Ticket" />
      <Card>
        {/* Subject */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 4 }}>Subject</Text>
          <TextInput
            placeholder="Brief summary of the issue"
            placeholderTextColor={colors.textMuted}
            value={subject}
            onChangeText={setSubject}
            style={{ fontSize: 15, color: colors.text, padding: 0 }}
          />
        </View>

        {/* Category */}
        <SelectRow
          label="Category"
          value={category}
          onValueChange={setCategory}
          options={TICKET_CATEGORIES}
        />

        {/* Priority */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 8 }}>Priority</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {TICKET_PRIORITIES.map((p) => {
              const isActive = priority === p;
              const pColor = PRIORITY_COLORS[p];
              return (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: isActive ? pColor.bg : colors.surface,
                    borderWidth: isActive ? 2 : 1,
                    borderColor: isActive ? pColor.text : colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: isActive ? pColor.text : colors.textSecondary,
                      textTransform: "capitalize",
                    }}
                  >
                    {p}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Description */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 4 }}>Description</Text>
          <TextInput
            placeholder="Describe the issue, include steps to reproduce if it's a bug..."
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ fontSize: 15, color: colors.text, padding: 0, minHeight: 80 }}
          />
        </View>

        {/* Submit */}
        <Pressable
          onPress={() => submitMutation.mutate()}
          disabled={submitMutation.isPending || !subject.trim() || !description.trim()}
          style={({ pressed }) => ({
            margin: 16,
            paddingVertical: 14,
            borderRadius: 12,
            backgroundColor: submitMutation.isPending || !subject.trim() || !description.trim() ? colors.surface : colors.accent,
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
          })}
        >
          {submitMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={{ color: !subject.trim() || !description.trim() ? colors.textMuted : "#FFFFFF", fontWeight: "700", fontSize: 15 }}>
              Submit Ticket
            </Text>
          )}
        </Pressable>
      </Card>

      {/* Existing Tickets */}
      <SectionHeader title="My Tickets" />
      {isLoading ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : tickets.length === 0 ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <Text style={{ fontSize: 14, color: colors.textMuted }}>No tickets yet</Text>
        </View>
      ) : (
        <Card>
          {tickets.map((ticket: any, idx: number) => {
            const statusStyle = STATUS_COLORS[ticket.status] || STATUS_COLORS.open;
            const prioStyle = PRIORITY_COLORS[ticket.priority] || PRIORITY_COLORS.medium;
            return (
              <View
                key={ticket.id}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: idx < tickets.length - 1 ? 1 : 0,
                  borderBottomColor: colors.cardBorder,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text, flex: 1, marginRight: 8 }} numberOfLines={1}>
                    {ticket.subject}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>{formatDate(ticket.created_at)}</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {/* Status badge */}
                  <View style={{ backgroundColor: statusStyle.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: statusStyle.text, textTransform: "capitalize" }}>
                      {(ticket.status || "open").replace("_", " ")}
                    </Text>
                  </View>
                  {/* Priority badge */}
                  <View style={{ backgroundColor: prioStyle.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: prioStyle.text, textTransform: "capitalize" }}>
                      {ticket.priority}
                    </Text>
                  </View>
                  {/* Category badge */}
                  <View style={{ backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSecondary, textTransform: "capitalize" }}>
                      {(ticket.category || "other").replace("_", " ")}
                    </Text>
                  </View>
                </View>
                {ticket.admin_response && (
                  <View style={{ marginTop: 8, backgroundColor: colors.accent + "10", borderRadius: 8, padding: 10, borderWidth: 1, borderColor: colors.accent + "30" }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: colors.accent, marginBottom: 2 }}>Response</Text>
                    <Text style={{ fontSize: 13, color: colors.text }}>{ticket.admin_response}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </Card>
      )}
    </>
  );
}

// ─── Storage Tab (Head Chef only) ────────────────────────────

const STORAGE_CATEGORIES = [
  { key: "recipe-images", label: "Recipe Images", description: "Recipe and plating reference photos" },
  { key: "invoices", label: "Invoice Scans", description: "Scanned and uploaded invoices" },
  { key: "cleaning-photos", label: "Safety Photos", description: "Food safety cleaning evidence" },
];

const RETENTION_OPTIONS = [
  { label: "7 days", value: "7" },
  { label: "14 days", value: "14" },
  { label: "30 days", value: "30" },
  { label: "60 days", value: "60" },
  { label: "90 days", value: "90" },
  { label: "6 months", value: "180" },
  { label: "1 year", value: "365" },
  { label: "Forever", value: "-1" },
];

interface StorageSetting {
  id: string;
  bucket_name: string;
  retention_days: number;
}

function StorageTab() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();

  const { data: storageSettings = [], isLoading, refetch } = useQuery({
    queryKey: ["org-storage-settings", currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return [];
      const { data, error } = await supabase
        .from("org_storage_settings")
        .select("id, bucket_name, retention_days")
        .eq("org_id", currentOrg.id)
        .order("bucket_name");
      if (error) throw error;
      return (data || []) as StorageSetting[];
    },
    enabled: !!currentOrg?.id,
  });

  const updateRetention = useMutation({
    mutationFn: async ({ id, retention_days }: { id: string; retention_days: number }) => {
      const { error } = await supabase
        .from("org_storage_settings")
        .update({ retention_days })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      refetch();
      Alert.alert("Saved", "Retention setting updated");
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message || "Failed to update setting");
    },
  });

  const getSettingForBucket = (bucketName: string) =>
    storageSettings.find((s) => s.bucket_name === bucketName);

  return (
    <>
      <SectionHeader title="File Retention Policies" />

      <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.warningBg, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: colors.warning + "40" }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.warning }}>Retention policies</Text>
        <Text style={{ fontSize: 12, color: colors.warning, marginTop: 2 }}>Files older than the retention period are automatically cleaned up. Data extracted to the database is always kept.</Text>
      </View>

      {isLoading ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <Card>
          {STORAGE_CATEGORIES.map((cat, idx) => {
            const setting = getSettingForBucket(cat.key);
            const currentValue = setting ? String(setting.retention_days) : "-1";
            return (
              <View
                key={cat.key}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderBottomWidth: idx < STORAGE_CATEGORIES.length - 1 ? 1 : 0,
                  borderBottomColor: colors.cardBorder,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{cat.label}</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 8 }}>{cat.description}</Text>
                {setting ? (
                  <Select
                    label="Retention Period"
                    value={currentValue}
                    onValueChange={(v) =>
                      updateRetention.mutate({ id: setting.id, retention_days: parseInt(v, 10) })
                    }
                    options={RETENTION_OPTIONS}
                  />
                ) : (
                  <Text style={{ fontSize: 12, color: colors.textMuted, fontStyle: "italic" }}>No setting configured</Text>
                )}
              </View>
            );
          })}
        </Card>
      )}
    </>
  );
}

// ─── Calendar Admin Tab ──────────────────────────────────────

const CAL_EVENT_TYPES = [
  { label: "Meeting", value: "meeting" }, { label: "Inspection", value: "inspection" },
  { label: "Training", value: "training" }, { label: "Delivery", value: "delivery" },
  { label: "Maintenance", value: "maintenance" }, { label: "License Renewal", value: "license" },
  { label: "Interview", value: "interview" }, { label: "Fetch Call", value: "fetch_call" },
  { label: "Event", value: "event" }, { label: "Other", value: "other" },
];

const CAL_TYPE_COLORS: Record<string, string> = {
  meeting: "#6366F1", inspection: "#DC2626", training: "#F59E0B",
  delivery: "#10B981", maintenance: "#0EA5E9", license: "#F97316",
  interview: "#EC4899", fetch_call: "#14B8A6", event: "#8B5CF6", other: "#6B7280",
};

const CAL_RECURRING_OPTIONS = [
  { label: "None", value: "none" }, { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" }, { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const CAL_STATUS_OPTIONS = [
  { label: "Upcoming", value: "upcoming" }, { label: "Due", value: "due" },
  { label: "Overdue", value: "overdue" }, { label: "Completed", value: "completed" },
];

const CAL_MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface CalEvent {
  id: string; title: string; event_type: string | null; date: string;
  time: string | null; end_time: string | null; description: string | null;
  location: string | null; recurring: string | null; status: string | null;
  org_id: string | null;
}

function CalendarTab() {
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const queryClient = useQueryClient();

  const { data: events = [], isLoading, refetch } = useQuery<CalEvent[]>({
    queryKey: ["calendar-admin", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase.from("calendar_events").select("*").eq("org_id", orgId).order("date", { ascending: true }).order("time", { ascending: true }).limit(500);
      if (error) throw error;
      return (data as CalEvent[]) || [];
    },
    enabled: !!orgId,
  });

  const createEvent = useMutation({
    mutationFn: async (evt: Partial<CalEvent>) => {
      const { error } = await supabase.from("calendar_events").insert({ ...evt, org_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["calendar-admin"] }); queryClient.invalidateQueries({ queryKey: ["calendar"] }); },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CalEvent> & { id: string }) => {
      const { error } = await supabase.from("calendar_events").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["calendar-admin"] }); queryClient.invalidateQueries({ queryKey: ["calendar"] }); },
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("calendar_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["calendar-admin"] }); queryClient.invalidateQueries({ queryKey: ["calendar"] }); },
  });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [eventTime, setEventTime] = useState<Date>(new Date(2000, 0, 1, 9, 0));
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [recurring, setRecurring] = useState("none");
  const [status, setStatus] = useState("upcoming");

  const parseTime = (t: string | null) => { if (!t) return new Date(2000, 0, 1, 9, 0); const [h, m] = t.split(":").map(Number); return new Date(2000, 0, 1, h || 0, m || 0); };
  const fmtTime = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  const fmtDisplayTime = (t: string | null) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };

  const resetForm = () => { setTitle(""); setEventType("meeting"); setEventDate(new Date()); setEventTime(new Date(2000, 0, 1, 9, 0)); setDescription(""); setLocation(""); setRecurring("none"); setStatus("upcoming"); setEditing(null); };

  const openCreate = () => { resetForm(); setShowForm(true); };
  const openEdit = (evt: CalEvent) => {
    setEditing(evt); setTitle(evt.title || ""); setEventType(evt.event_type || "meeting");
    setEventDate(new Date(evt.date + "T00:00:00")); setEventTime(parseTime(evt.time));
    setDescription(evt.description || ""); setLocation(evt.location || "");
    setRecurring(evt.recurring || "none"); setStatus(evt.status || "upcoming");
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert("Error", "Title is required"); return; }
    setSaving(true);
    try {
      const data: any = {
        title: title.trim(), event_type: eventType, date: eventDate.toISOString().split("T")[0],
        time: fmtTime(eventTime), description: description.trim() || null,
        location: location.trim() || null, recurring, status,
      };
      if (editing) await updateEvent.mutateAsync({ id: editing.id, ...data });
      else await createEvent.mutateAsync(data);
      setShowForm(false); resetForm();
    } catch (e: any) { Alert.alert("Error", e.message || "Failed to save"); }
    finally { setSaving(false); }
  };

  const handleLongPress = (item: CalEvent) => {
    Alert.alert(item.title, "What would you like to do?", [
      { text: "Edit", onPress: () => openEdit(item) },
      { text: "Delete", style: "destructive", onPress: () => Alert.alert("Delete", "Delete this event?", [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteEvent.mutate(item.id) }]) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <>
      <SectionHeader title="Calendar Events" />
      <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
        <Pressable
          onPress={openCreate}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.accent, paddingVertical: 10, borderRadius: 10 }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>+ Add Event</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ paddingVertical: 20 }} />
      ) : events.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 30 }}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>No calendar events yet</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, gap: 6 }}>
          {events.map((evt) => {
            const typeColor = CAL_TYPE_COLORS[evt.event_type || "other"] || "#6B7280";
            const typeLabel = CAL_EVENT_TYPES.find((t) => t.value === evt.event_type)?.label || evt.event_type || "Other";
            const d = new Date(evt.date + "T00:00:00");
            return (
              <Pressable
                key={evt.id}
                onPress={() => openEdit(evt)}
                onLongPress={() => handleLongPress(evt)}
                style={{
                  flexDirection: "row", alignItems: "center",
                  backgroundColor: colors.card, borderRadius: 10, borderLeftWidth: 4, borderLeftColor: typeColor,
                  padding: 12, gap: 10,
                }}
              >
                <View style={{ alignItems: "center", width: 36 }}>
                  <Text style={{ fontSize: 9, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase" }}>
                    {CAL_MONTH_NAMES[d.getMonth()]}
                  </Text>
                  <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>{d.getDate()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }} numberOfLines={1}>{evt.title}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: typeColor }}>{typeLabel}</Text>
                    {evt.time && <Text style={{ fontSize: 10, color: colors.textMuted }}>{fmtDisplayTime(evt.time)}</Text>}
                    {evt.recurring && evt.recurring !== "none" && (
                      <View style={{ backgroundColor: colors.accent + "20", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, fontWeight: "600", color: colors.accent }}>{evt.recurring}</Text>
                      </View>
                    )}
                    {evt.status && evt.status !== "upcoming" && (
                      <View style={{ backgroundColor: evt.status === "completed" ? "#10B98120" : evt.status === "overdue" ? "#DC262620" : "#F59E0B20", paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, fontWeight: "600", color: evt.status === "completed" ? "#10B981" : evt.status === "overdue" ? "#DC2626" : "#F59E0B" }}>{evt.status}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <ChevronRight size={14} color={colors.textMuted} strokeWidth={1.5} />
              </Pressable>
            );
          })}
        </View>
      )}

      <FormSheet visible={showForm} onClose={() => { setShowForm(false); resetForm(); }} onSave={handleSave} title={editing ? "Edit Event" : "New Event"} saving={saving}>
        <Input label="Title" value={title} onChangeText={setTitle} placeholder="Event title" />
        <Select label="Type" value={eventType} onValueChange={setEventType} options={CAL_EVENT_TYPES} />
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flex: 1 }}><DatePicker label="Date" value={eventDate} onChange={setEventDate} mode="date" /></View>
          <View style={{ flex: 1 }}><DatePicker label="Time" value={eventTime} onChange={setEventTime} mode="time" /></View>
        </View>
        <Select label="Recurring" value={recurring} onValueChange={setRecurring} options={CAL_RECURRING_OPTIONS} />
        <Select label="Status" value={status} onValueChange={setStatus} options={CAL_STATUS_OPTIONS} />
        <Input label="Location" value={location} onChangeText={setLocation} placeholder="Location (optional)" />
        <Input label="Description" value={description} onChangeText={setDescription} placeholder="Event details" multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: "top" }} />
      </FormSheet>
    </>
  );
}

// ─── Help Tab ────────────────────────────────────────────────

function HelpTab({ settings, updateSetting, router }: { settings: ReturnType<typeof useAppSettings>["settings"]; updateSetting: ReturnType<typeof useAppSettings>["updateSetting"]; router: any }) {
  const { colors } = useTheme();
  const isHomeCookVariant = isHomeCook(APP_VARIANT);

  const NavRow = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.cardBorder,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ fontSize: 15, color: colors.text }}>{label}</Text>
      <ChevronRight size={18} color={colors.textMuted} strokeWidth={2} />
    </Pressable>
  );

  return (
    <>
      <SectionHeader title="App Guide" />
      <Card>
        <NavRow label="View Feature Guide" onPress={() => router.push("/(app)/help")} />
      </Card>

      <SectionHeader title="Replay" />
      <Card>
        <NavRow
          label="Replay Feature Walkthrough"
          onPress={() => {
            updateSetting("hasSeenWalkthrough", false);
            router.push("/(app)/feature-walkthrough");
          }}
        />
        {isHomeCookVariant && (
          <NavRow
            label="Replay Companion Setup"
            onPress={() => {
              supabase
                .from("companion_profiles")
                .delete()
                .neq("id", "00000000-0000-0000-0000-000000000000")
                .then(() => {
                  updateSetting("companionName", null);
                  updateSetting("companionEnabled", true);
                  router.push("/(app)/companion-onboarding");
                });
            }}
          />
        )}
      </Card>

      <SectionHeader title="Support" />
      <Card>
        <NavRow label="Send Feedback" onPress={() => router.push("/(app)/feedback")} />
        <NavRow label="Privacy Policy" onPress={() => router.push("/(app)/privacy-policy")} />
      </Card>

      <View style={{ paddingHorizontal: 20, paddingTop: 24, alignItems: "center" }}>
        <Text style={{ fontSize: 12, color: colors.textMuted }}>
          {IS_HOMECHEF ? "HomeChef" : "ChefOS"} v1.0.0
        </Text>
      </View>
    </>
  );
}

// ─── Social Tab (HomeChef only) ──────────────────────────────

function SocialTab({ settings, updateSetting }: { settings: ReturnType<typeof useAppSettings>["settings"]; updateSetting: ReturnType<typeof useAppSettings>["updateSetting"] }) {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
      <View style={{
        width: 64, height: 64, borderRadius: 20,
        backgroundColor: colors.accent + "12",
        alignItems: "center", justifyContent: "center", marginBottom: 16,
      }}>
        <Text style={{ fontSize: 28 }}>{"💬"}</Text>
      </View>
      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 6 }}>
        Social
      </Text>
      <Text style={{
        fontSize: 14, fontWeight: "600", color: colors.accent,
        backgroundColor: colors.accent + "12",
        paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginBottom: 12,
      }}>
        Coming Soon
      </Text>
      <Text style={{ fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20, maxWidth: 280 }}>
        Share recipes, connect with other home cooks, and see what others are cooking. Stay tuned!
      </Text>
    </View>
  );
}

// ─── Main Settings Screen ─────────────────────────────────────
export default function SettingsRoute() {
  if (isVendor(APP_VARIANT)) return <VendorSettings />;
  return <Settings />;
}

function Settings() {
  const router = useRouter();
  const { settings, updateSetting, resetSettings } = useAppSettings();
  const { colors } = useTheme();
  const { isHeadChef, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  const tabs = useMemo(() => getSettingsTabs(isHeadChef), [isHeadChef]);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          try { await signOut(); router.replace("/(auth)/landing"); }
          catch (e: any) { Alert.alert("Error", e.message || "Failed to sign out"); }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 24, paddingBottom: 0 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>Settings</Text>
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => ({
            paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
            backgroundColor: colors.destructiveBg,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.destructive }}>Sign Out</Text>
        </Pressable>
      </View>

      {/* Tab bar — always visible, pinned above scroll content */}
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, gap: 6 }}>
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key as SettingsTab)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  backgroundColor: active ? colors.accent : colors.card,
                  borderWidth: 1.5,
                  borderColor: active ? colors.accent : colors.border,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "700", color: active ? "#FFFFFF" : colors.text }}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab content */}
      <KeyboardAwareScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 20 : 80}
        enableAutomaticScroll
        enableResetScrollToCoords={false}
      >
        {activeTab === "general" && <GeneralTab settings={settings} updateSetting={updateSetting} router={router} />}
        {activeTab === "profile" && <ProfileTab router={router} />}
        {activeTab === "ai" && <AITab settings={settings} updateSetting={updateSetting} />}
        {activeTab === "units" && <UnitsTab settings={settings} updateSetting={updateSetting} />}
        {activeTab === "integrations" && <IntegrationsTab />}
        {activeTab === "command" && <CommandCentreTab settings={settings} updateSetting={updateSetting} />}
        {activeTab === "training" && <TrainingTab />}
        {activeTab === "privacy" && <PrivacyTab settings={settings} updateSetting={updateSetting} resetSettings={resetSettings} router={router} />}
        {activeTab === "help" && <HelpTab settings={settings} updateSetting={updateSetting} router={router} />}
        {activeTab === "audit" && isHeadChef && <AuditLogTab />}
        {activeTab === "service" && isHeadChef && <ServiceDeskTab />}
        {activeTab === "storage" && isHeadChef && <StorageTab />}
        {activeTab === "calendar" && isHeadChef && <CalendarTab />}
        {activeTab === "social" && IS_HOMECHEF && <SocialTab settings={settings} updateSetting={updateSetting} />}
      </KeyboardAwareScrollView>

      {/* App info footer */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center" }}>
          {IS_HOMECHEF ? "HomeChef" : "ChefOS"} v1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}
