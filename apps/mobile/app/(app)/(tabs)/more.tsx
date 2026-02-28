import { View, Text, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { useOrg } from "../../../contexts/OrgProvider";
import { useAuth } from "../../../contexts/AuthProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import {
  Carrot, ClipboardList, Factory, Tag, BarChart3, Calculator, Receipt, Store, Trash2,
  Users, CalendarClock, GraduationCap, CalendarDays, ShieldCheck, TriangleAlert, Home,
  Bot, FileText, Wrench, ScanLine, Settings, Gift, MessageCircle, Lock, Wallet,
  ChevronRight, Gamepad2,
} from "lucide-react-native";
import { type LucideIcon } from "lucide-react-native";

import { isHomeCook } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOMECHEF = isHomeCook(APP_VARIANT);

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <Text
      style={{
        fontSize: 12, fontWeight: "700", color,
        textTransform: "uppercase", letterSpacing: 1,
        paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
      }}
    >
      {title}
    </Text>
  );
}

function MenuItem({ icon: IconComponent, label, onPress, badge }: { icon: LucideIcon; label: string; onPress: () => void; badge?: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row", alignItems: "center",
        paddingVertical: 14, paddingHorizontal: 20,
        backgroundColor: pressed ? colors.surface : "transparent",
        borderBottomWidth: 1, borderBottomColor: colors.border,
      })}
    >
      <View style={{ width: 32, alignItems: "center", marginRight: 14 }}>
        <IconComponent size={20} color={colors.textSecondary} strokeWidth={1.5} />
      </View>
      <Text style={{ fontSize: 16, fontWeight: "500", color: colors.text, flex: 1 }}>{label}</Text>
      {badge && (
        <View style={{ backgroundColor: colors.accentBg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginRight: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: colors.accent }}>{badge}</Text>
        </View>
      )}
      <ChevronRight size={16} color={colors.textMuted} strokeWidth={1.5} />
    </Pressable>
  );
}

interface NavItem {
  icon: LucideIcon;
  label: string;
  route: string;
  module?: string;
  badge?: string;
}

export default function More() {
  const router = useRouter();
  const { currentOrg } = useOrg();
  const { canView } = useAuth();
  const { colors } = useTheme();

  const filterByPermission = (items: NavItem[]) =>
    items.filter((item) => !item.module || canView(item.module));

  const kitchenOps: NavItem[] = [
    { icon: Carrot, label: "Ingredients", route: "/(app)/ingredients", module: "ingredients" },
    { icon: ClipboardList, label: "Prep Lists", route: "/(app)/prep-lists", module: "prep" },
    { icon: Factory, label: "Production", route: "/(app)/production", module: "production" },
    { icon: Tag, label: "Kitchen Sections", route: "/(app)/kitchen-sections", module: "kitchen-sections" },
  ];

  const business: NavItem[] = [
    { icon: BarChart3, label: "Menu Engineering", route: "/(app)/menu-engineering", module: "menu-engineering" },
    { icon: Calculator, label: "Food Cost Calculator", route: "/(app)/costing" },
    { icon: Receipt, label: "Invoices", route: "/(app)/invoices", module: "invoices", badge: "Scan" },
    { icon: Store, label: "Marketplace", route: "/(app)/marketplace", module: "marketplace" },
    { icon: Trash2, label: "Waste Log", route: "/(app)/waste-log", module: "waste-log" },
  ];

  const teamScheduling: NavItem[] = [
    { icon: Users, label: "Team", route: "/(app)/team", module: "team" },
    { icon: CalendarClock, label: "Roster", route: "/(app)/roster", module: "roster" },
    { icon: GraduationCap, label: "Training", route: "/(app)/training", module: "training" },
    { icon: CalendarDays, label: "Calendar", route: "/(app)/calendar", module: "calendar" },
  ];

  const safety: NavItem[] = [
    { icon: ShieldCheck, label: "Food Safety", route: "/(app)/food-safety", module: "food-safety", badge: "4 tabs" },
    { icon: TriangleAlert, label: "Allergens", route: "/(app)/allergens", module: "allergens" },
    { icon: Home, label: "Housekeeping", route: "/(app)/housekeeping" },
  ];

  const games: NavItem[] = [
    { icon: Gamepad2, label: "Mastery Suite", route: "/(app)/games", badge: "Play" },
  ];

  const tools: NavItem[] = [
    { icon: Bot, label: "AI Chef Assistant", route: "/(app)/ai-chat" },
    { icon: FileText, label: "Cheatsheets", route: "/(app)/cheatsheets", module: "cheatsheets" },
    { icon: Wrench, label: "Equipment", route: "/(app)/equipment", module: "equipment", badge: "Scan" },
    { icon: ScanLine, label: "Scan Ingredient", route: "/(app)/ingredients/scan" },
    { icon: ScanLine, label: "Scan Invoice", route: "/(app)/invoices/scan" },
  ];

  const homechefFeatures: NavItem[] = [
    { icon: ShieldCheck, label: "Food Safety", route: "/(app)/food-safety", module: "food-safety" },
    { icon: FileText, label: "Cheatsheets", route: "/(app)/cheatsheets", module: "cheatsheets" },
    { icon: Wallet, label: "Money Lite", route: "/(app)/money-lite" },
    { icon: Carrot, label: "Ingredients", route: "/(app)/ingredients", module: "ingredients" },
  ];

  const renderSection = (title: string, items: NavItem[]) => {
    const visible = filterByPermission(items);
    if (visible.length === 0) return null;
    return (
      <>
        <SectionHeader title={title} color={colors.textMuted} />
        <View style={{ marginHorizontal: 16, borderRadius: 16, overflow: "hidden", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}>
          {visible.map((item) => (
            <MenuItem key={item.route} icon={item.icon} label={item.label} onPress={() => router.push(item.route as any)} badge={item.badge} />
          ))}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ padding: 24, paddingBottom: 8 }}>
          <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text }}>More</Text>
          {currentOrg?.name && (
            <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 4 }}>{currentOrg.name}</Text>
          )}
        </View>

        {/* Games — available in ALL variants */}
        {renderSection("Games", games)}

        {!IS_HOMECHEF && (
          <>
            {renderSection("Kitchen Operations", kitchenOps)}
            {renderSection("Business", business)}
            {renderSection("Team & Scheduling", teamScheduling)}
            {renderSection("Safety & Compliance", safety)}
            {renderSection("Tools & Scanners", tools)}
          </>
        )}

        {IS_HOMECHEF && renderSection("Features", homechefFeatures)}

        <SectionHeader title="Account" color={colors.textMuted} />
        <View style={{ marginHorizontal: 16, borderRadius: 16, overflow: "hidden", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }}>
          <MenuItem icon={Settings} label="Settings" onPress={() => router.push("/(app)/(tabs)/settings")} />
          <MenuItem icon={Gift} label="Refer & Save" onPress={() => router.push("/(app)/refer")} />
          <MenuItem icon={MessageCircle} label="Send Feedback" onPress={() => router.push("/(app)/feedback")} />
          <MenuItem icon={Lock} label="Privacy Policy" onPress={() => router.push("/(app)/privacy-policy")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
