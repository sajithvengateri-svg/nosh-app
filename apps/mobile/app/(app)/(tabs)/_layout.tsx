import { useEffect, useState } from "react";
import { Tabs } from "expo-router";
import Constants from "expo-constants";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useOrg } from "../../../contexts/OrgProvider";
import { supabase } from "../../../lib/supabase";
import {
  LayoutDashboard,
  BookOpen,
  UtensilsCrossed,
  ShieldCheck,
  Settings,
  Camera,
  BarChart3,
  Gamepad2,
  TrendingUp,
  Tag,
  ScanLine,
} from "lucide-react-native";
import { isComplianceVariant, isHomeCook, isVendor, VARIANT_REGISTRY } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const BRAND_ACCENT = VARIANT_REGISTRY[APP_VARIANT].brand.accent;
const IS_VENDOR = isVendor(APP_VARIANT);

function useTabBadges() {
  const { currentOrg } = useOrg();
  const [kitchenBadge, setKitchenBadge] = useState<number | undefined>();
  const [safetyBadge, setSafetyBadge] = useState<number | undefined>();

  useEffect(() => {
    if (!currentOrg?.id) return;

    const fetchBadges = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];
        const { count: prepCount } = await supabase
          .from("kitchen_tasks")
          .select("*", { count: "exact", head: true })
          .eq("org_id", currentOrg.id)
          .eq("status", "pending")
          .gte("due_date", today)
          .lte("due_date", today + "T23:59:59");

        setKitchenBadge(prepCount && prepCount > 0 ? prepCount : undefined);

        const { count: safetyCount } = await supabase
          .from("food_safety_logs")
          .select("*", { count: "exact", head: true })
          .eq("org_id", currentOrg.id)
          .eq("status", "critical")
          .gte("created_at", today);

        setSafetyBadge(safetyCount && safetyCount > 0 ? safetyCount : undefined);
      } catch {
        // Silently fail — badges are non-critical
      }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, [currentOrg?.id]);

  return { kitchenBadge, safetyBadge };
}

function useTabBarOptions() {
  const { colors, isDark } = useTheme();
  const activeColor = (APP_VARIANT === "chefos" || isDark) ? colors.accent : BRAND_ACCENT;
  return {
    colors,
    activeColor,
    options: {
      headerShown: false,
      tabBarActiveTintColor: activeColor,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: {
        borderTopWidth: 1,
        borderTopColor: colors.tabBarBorder,
        backgroundColor: colors.tabBar,
        paddingTop: 8,
        paddingBottom: 8,
        height: 80,
      },
      tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: "600" as const,
      },
      tabBarBadgeStyle: {
        fontSize: 10,
        fontWeight: "700" as const,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        lineHeight: 16,
      },
    },
  };
}

function VendorTabLayout() {
  const { options } = useTabBarOptions();
  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="demands"
        options={{
          title: "Demands",
          tabBarIcon: ({ color }) => <TrendingUp size={22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: "Scan",
          tabBarIcon: ({ color }) => <ScanLine size={22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: "Deals",
          tabBarIcon: ({ color }) => <Tag size={22} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={22} color={color} strokeWidth={1.5} />,
        }}
      />

      {/* Hidden tabs — screens still exist for routing but not shown in tab bar */}
      <Tabs.Screen name="games" options={{ href: null }} />
      <Tabs.Screen name="recipes" options={{ href: null }} />
      <Tabs.Screen name="kitchen" options={{ href: null }} />
      <Tabs.Screen name="safety" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="todo" options={{ href: null }} />
      <Tabs.Screen name="inventory" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
    </Tabs>
  );
}

export default function TabLayout() {
  if (IS_VENDOR) return <VendorTabLayout />;

  const { colors, options } = useTabBarOptions();
  const { kitchenBadge, safetyBadge } = useTabBadges();
  const isEatSafe = isComplianceVariant(APP_VARIANT);

  if (isEatSafe) {
    // EatSafe Brisbane: Home — Food Safety — Scanner — Reports — Settings
    return (
      <Tabs screenOptions={options}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tabs.Screen
          name="safety"
          options={{
            title: "Food Safety",
            tabBarIcon: ({ color }) => <ShieldCheck size={22} color={color} strokeWidth={1.5} />,
            tabBarBadge: safetyBadge,
            tabBarBadgeStyle: safetyBadge ? {
              backgroundColor: colors.destructive,
              color: "#FFFFFF",
              fontSize: 10,
              fontWeight: "700",
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              lineHeight: 16,
            } : undefined,
          }}
        />
        <Tabs.Screen
          name="scanner"
          options={{
            title: "Scanner",
            tabBarIcon: ({ color }) => <Camera size={22} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tabs.Screen
          name="reports"
          options={{
            title: "Reports",
            tabBarIcon: ({ color }) => <BarChart3 size={22} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => <Settings size={22} color={color} strokeWidth={1.5} />,
          }}
        />

        {/* Hidden tabs — screens still exist for routing but not shown in tab bar */}
        <Tabs.Screen name="games" options={{ href: null }} />
        <Tabs.Screen name="recipes" options={{ href: null }} />
        <Tabs.Screen name="kitchen" options={{ href: null }} />
        <Tabs.Screen name="todo" options={{ href: null }} />
        <Tabs.Screen name="demands" options={{ href: null }} />
        <Tabs.Screen name="deals" options={{ href: null }} />
        <Tabs.Screen name="inventory" options={{ href: null }} />
        <Tabs.Screen name="more" options={{ href: null }} />
      </Tabs>
    );
  }

  // Default: ChefOS / HomeChef / India — Home — Recipes — Kitchen — Safety — Settings
  const isHomechef = isHomeCook(APP_VARIANT);
  const sw = isHomechef ? 2 : 1.5;

  return (
    <Tabs screenOptions={options}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <LayoutDashboard size={22} color={color} strokeWidth={sw} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: isHomechef ? "My Recipes" : "Recipes",
          tabBarIcon: ({ color }) => <BookOpen size={22} color={color} strokeWidth={sw} />,
        }}
      />
      <Tabs.Screen
        name="kitchen"
        options={{
          title: isHomechef ? "My Kitchen" : "Kitchen",
          tabBarIcon: ({ color }) => <UtensilsCrossed size={22} color={color} strokeWidth={sw} />,
          tabBarBadge: kitchenBadge,
          tabBarBadgeStyle: kitchenBadge ? {
            backgroundColor: colors.accent,
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: "700",
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            lineHeight: 16,
          } : undefined,
        }}
      />
      <Tabs.Screen
        name="safety"
        options={{
          title: "Safety",
          tabBarIcon: ({ color }) => <ShieldCheck size={22} color={color} strokeWidth={sw} />,
          tabBarBadge: safetyBadge,
          tabBarBadgeStyle: safetyBadge ? {
            backgroundColor: colors.destructive,
            color: "#FFFFFF",
            fontSize: 10,
            fontWeight: "700",
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            lineHeight: 16,
          } : undefined,
        }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: "Games",
          tabBarIcon: ({ color }) => <Gamepad2 size={22} color={color} strokeWidth={sw} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={22} color={color} strokeWidth={sw} />,
        }}
      />

      {/* Hidden tabs — screens still exist for routing but not shown in tab bar */}
      <Tabs.Screen name="scanner" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
      <Tabs.Screen name="demands" options={{ href: null }} />
      <Tabs.Screen name="deals" options={{ href: null }} />
      <Tabs.Screen name="todo" options={{ href: null }} />
      <Tabs.Screen name="inventory" options={{ href: null }} />
      <Tabs.Screen name="more" options={{ href: null }} />
    </Tabs>
  );
}
