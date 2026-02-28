import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../contexts/AuthProvider";
import { VARIANT_REGISTRY } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;

const VARIANTS = (Object.entries(VARIANT_REGISTRY) as [AppVariant, typeof VARIANT_REGISTRY[AppVariant]][]).map(
  ([key, v]) => ({ key, name: v.brand.name, accent: v.brand.accent, bg: v.brand.bg })
);

interface NavItem {
  label: string;
  route: string;
  requiresAuth?: boolean;
}

const AUTH_SCREENS: NavItem[] = [
  { label: "Landing", route: "/(auth)/landing" },
  { label: "Login", route: "/(auth)/login" },
  { label: "Signup", route: "/(auth)/signup" },
];

const TAB_SCREENS: NavItem[] = [
  { label: "Dashboard", route: "/(app)/(tabs)/dashboard", requiresAuth: true },
  { label: "Recipes", route: "/(app)/(tabs)/recipes", requiresAuth: true },
  { label: "Kitchen", route: "/(app)/(tabs)/kitchen", requiresAuth: true },
  { label: "Safety", route: "/(app)/(tabs)/safety", requiresAuth: true },
  { label: "Settings", route: "/(app)/(tabs)/settings", requiresAuth: true },
  { label: "Todo", route: "/(app)/(tabs)/todo", requiresAuth: true },
  { label: "Scanner", route: "/(app)/(tabs)/scanner", requiresAuth: true },
  { label: "Reports", route: "/(app)/(tabs)/reports", requiresAuth: true },
  { label: "Games", route: "/(app)/(tabs)/games", requiresAuth: true },
];

const FEATURE_SCREENS: NavItem[] = [
  { label: "AI Chat", route: "/(app)/ai-chat", requiresAuth: true },
  { label: "Food Safety", route: "/(app)/food-safety", requiresAuth: true },
  { label: "Scan Docket", route: "/(app)/food-safety/scan-docket", requiresAuth: true },
  { label: "Costing", route: "/(app)/costing", requiresAuth: true },
  { label: "Feedback", route: "/(app)/feedback", requiresAuth: true },
  { label: "Team", route: "/(app)/team", requiresAuth: true },
  { label: "Ingredients", route: "/(app)/ingredients", requiresAuth: true },
  { label: "Equipment", route: "/(app)/equipment", requiresAuth: true },
  { label: "Invoices", route: "/(app)/invoices", requiresAuth: true },
  { label: "Prep Lists", route: "/(app)/prep-lists", requiresAuth: true },
  { label: "Waste Log", route: "/(app)/waste-log", requiresAuth: true },
  { label: "Training", route: "/(app)/training", requiresAuth: true },
  { label: "Allergens", route: "/(app)/allergens", requiresAuth: true },
  { label: "Cheatsheets", route: "/(app)/cheatsheets", requiresAuth: true },
  { label: "Calendar", route: "/(app)/calendar", requiresAuth: true },
  { label: "Roster", route: "/(app)/roster", requiresAuth: true },
  { label: "Marketplace", route: "/(app)/marketplace", requiresAuth: true },
  { label: "Money Lite", route: "/(app)/money-lite", requiresAuth: true },
  { label: "Housekeeping", route: "/(app)/housekeeping", requiresAuth: true },
  { label: "Kitchen Sections", route: "/(app)/kitchen-sections", requiresAuth: true },
  { label: "Menu Engineering", route: "/(app)/menu-engineering", requiresAuth: true },
  { label: "Production", route: "/(app)/production", requiresAuth: true },
  { label: "Refer", route: "/(app)/refer", requiresAuth: true },
];

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ fontSize: 11, fontWeight: "700", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1.5, marginTop: 20, marginBottom: 8, paddingHorizontal: 4 }}>
      {title}
    </Text>
  );
}

function NavButton({ item, onPress }: { item: NavItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? "#F3F4F6" : "#FFFFFF",
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        marginBottom: 6,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      })}
    >
      <Text style={{ fontSize: 14, fontWeight: "600", color: "#111827" }}>{item.label}</Text>
      {item.requiresAuth && (
        <Text style={{ fontSize: 10, color: "#9CA3AF" }}>auth</Text>
      )}
    </Pressable>
  );
}

export default function DevNavigator() {
  const router = useRouter();
  const { user, signOut, devEnter, isDevBypass } = useAuth();

  const handleNav = (item: NavItem) => {
    if (item.requiresAuth && !user) {
      // Auto dev-enter when navigating to auth-required screens
      devEnter();
    }
    router.push(item.route as any);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/landing");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontSize: 14, color: "#6366F1" }}>{"← Back"}</Text>
        </Pressable>
        <Text style={{ fontSize: 17, fontWeight: "800", color: "#111827" }}>Dev Navigator</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }}>
        {/* Variant Info */}
        <View style={{ backgroundColor: "#111827", borderRadius: 12, padding: 16, marginBottom: 8 }}>
          <Text style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>CURRENT VARIANT</Text>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#FFFFFF" }}>{APP_VARIANT}</Text>
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
            {user ? (isDevBypass ? "DEV BYPASS (no real auth)" : `Signed in as ${user.email}`) : "Not signed in"}
          </Text>
          {!user && (
            <Pressable onPress={() => { devEnter(); }} style={{ marginTop: 10, backgroundColor: "#10B98130", paddingVertical: 8, borderRadius: 8, alignItems: "center" }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#10B981" }}>Skip Auth → Enter App</Text>
            </Pressable>
          )}
          {user && (
            <Pressable onPress={handleSignOut} style={{ marginTop: 10, backgroundColor: "#EF444420", paddingVertical: 8, borderRadius: 8, alignItems: "center" }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#EF4444" }}>Sign Out</Text>
            </Pressable>
          )}
        </View>

        {/* Variant Previews */}
        <SectionHeader title="App Variants" />
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
          {VARIANTS.map((v) => (
            <View
              key={v.key}
              style={{
                backgroundColor: v.bg,
                borderRadius: 10,
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderWidth: v.key === APP_VARIANT ? 2 : 1,
                borderColor: v.key === APP_VARIANT ? v.accent : "#E5E7EB",
                minWidth: "30%",
                flex: 1,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "800", color: v.accent }}>{v.name}</Text>
              <Text style={{ fontSize: 9, color: "#9CA3AF", marginTop: 2 }}>{v.key}</Text>
              {v.key === APP_VARIANT && (
                <Text style={{ fontSize: 8, color: v.accent, fontWeight: "700", marginTop: 2 }}>ACTIVE</Text>
              )}
            </View>
          ))}
        </View>
        <Text style={{ fontSize: 10, color: "#9CA3AF", marginBottom: 4, paddingHorizontal: 4 }}>
          Switch variants: APP_VARIANT=homechef expo start --port 8082
        </Text>

        {/* Auth Screens */}
        <SectionHeader title="Auth Screens" />
        {AUTH_SCREENS.map((item) => (
          <NavButton key={item.route} item={item} onPress={() => handleNav(item)} />
        ))}

        {/* Tab Screens */}
        <SectionHeader title="Tab Screens" />
        {TAB_SCREENS.map((item) => (
          <NavButton key={item.route} item={item} onPress={() => handleNav(item)} />
        ))}

        {/* Feature Screens */}
        <SectionHeader title="Feature Screens" />
        {FEATURE_SCREENS.map((item) => (
          <NavButton key={item.route} item={item} onPress={() => handleNav(item)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
