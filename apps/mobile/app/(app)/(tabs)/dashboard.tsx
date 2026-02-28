import { useMemo, useCallback, useEffect, useRef } from "react";
import { View, Text, FlatList, RefreshControl, Pressable, Share, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { lightTap } from "../../../lib/haptics";
import Constants from "expo-constants";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthProvider";
import { useOrg } from "../../../contexts/OrgProvider";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useDashboardStats } from "../../../hooks/useDashboardStats";
import { useSystemHealth } from "../../../hooks/useSystemHealth";
import { useTeamPosts } from "../../../hooks/useTeamFeed";
import { useOrgSettings } from "../../../hooks/useOrgSettings";
import { useReservationData } from "../../../hooks/useReservationData";
import { useFoodSales } from "../../../hooks/useFoodSales";
import { useDishParPredictions } from "../../../hooks/useDishParPredictions";
import { useFeatureGate } from "../../../hooks/useFeatureGate";
import { useCompanion } from "../../../hooks/useCompanion";
import { useAppSettings } from "../../../hooks/useAppSettings";
import { VARIANT_COMPLIANCE, isComplianceVariant, isVendor, VARIANT_REGISTRY, getRegion, isHomeCook as isHomeCookVariant } from "@queitos/shared";
import type { AppVariant } from "@queitos/shared";
import { VendorDashboard } from "../../../components/features/vendor/VendorDashboard";
import { StatCard } from "../../../components/features/StatCard";
import { KitchenWallComposer, KitchenWallHeader, KitchenWallFeed } from "../../../components/features/KitchenWall";
import { CommandCentre } from "../../../components/features/CommandCentre";
import { HomeCleaningWidget } from "../../../components/features/HomeCleaningWidget";
import { SkeletonCard } from "../../../components/ui/Skeleton";
import {
  ClipboardList,
  BookOpen,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  ChevronRight,
  Gift,
  Check,
  UtensilsCrossed,
  DollarSign,
  Calculator,
  Users,
  Star,
  TrendingUp,
  Bot,
  MessageCircleQuestion,
  type LucideIcon,
} from "lucide-react-native";

const APP_VARIANT_KEY = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;
const IS_HOMECHEF = isHomeCookVariant(APP_VARIANT_KEY);

function CompanionWidget({ colors, router }: { colors: any; router: any }) {
  const { profile: companion, hasCompanion } = useCompanion();
  const { settings } = useAppSettings();

  if (!hasCompanion || !settings.companionEnabled) return null;

  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning! What shall we cook today?"
      : hour < 17
      ? "Afternoon! Need help with dinner prep?"
      : "Evening! Let's sort out tonight's meal.";

  return (
    <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
      <Pressable
        onPress={() => router.push("/(app)/ai-chat")}
        style={{
          backgroundColor: colors.accentBg || colors.accent + "15",
          borderRadius: 16,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.accent + "20",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Bot size={24} color={colors.accent} strokeWidth={1.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
            {companion!.companion_name}
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
            {greeting}
          </Text>
        </View>
        <ChevronRight size={16} color={colors.accent} strokeWidth={1.5} />
      </Pressable>
    </View>
  );
}

function AlertBanner({ icon: IconComponent, title, subtitle, color, onPress }: { icon: LucideIcon; title: string; subtitle: string; color: string; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, backgroundColor: color + "15", borderWidth: 1, borderColor: color + "30" }}
    >
      <IconComponent size={20} color={color} strokeWidth={1.5} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{subtitle}</Text>
      </View>
      {onPress && <ChevronRight size={16} color={colors.accent} strokeWidth={1.5} />}
    </Pressable>
  );
}

function HealthScorePill({ score, onPress }: { score: number; onPress: () => void }) {
  const { colors } = useTheme();
  const color = score >= 75 ? colors.success : score >= 50 ? colors.warning : colors.destructive;
  return (
    <Pressable
      onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: color + "20", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 12, fontWeight: "700", color }}>{score}</Text>
    </Pressable>
  );
}


function PrepListWidget({ orgId, colors, router }: { orgId: string | undefined; colors: any; router: any }) {
  const { data: prepLists } = useQuery({
    queryKey: ["prep-lists-dashboard", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("prep_lists")
        .select("id, name, items, status")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) return [];
      return (data || []).map((pl: any) => {
        const items = Array.isArray(pl.items) ? pl.items : [];
        return {
          id: pl.id,
          name: pl.name,
          total: items.length,
          completed: items.filter((i: any) => i.completed).length,
        };
      });
    },
    enabled: !!orgId,
  });

  if (!prepLists || prepLists.length === 0) return null;

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Prep Lists</Text>
        <Pressable onPress={() => router.push("/(app)/prep-lists")}>
          <Text style={{ fontSize: 13, color: colors.accent, fontWeight: "600" }}>View All</Text>
        </Pressable>
      </View>
      {prepLists.map((pl: any) => {
        const pct = pl.total > 0 ? Math.round((pl.completed / pl.total) * 100) : 0;
        return (
          <Pressable key={pl.id} onPress={() => router.push("/(app)/prep-lists")} style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>{pl.name}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{pl.completed}/{pl.total}</Text>
            </View>
            <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
              <View style={{ height: 6, width: `${pct}%`, backgroundColor: pct === 100 ? colors.success : colors.accent, borderRadius: 3 }} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function FoodSafetyAlerts({ orgId, colors, router }: { orgId: string | undefined; colors: any; router: any }) {
  const { data: criticalCount } = useQuery({
    queryKey: ["safety-critical-count", orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const today = new Date().toISOString().split("T")[0];
      const { count, error } = await supabase
        .from("food_safety_logs")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .eq("date", today)
        .eq("status", "critical");
      if (error) return 0;
      return count || 0;
    },
    enabled: !!orgId,
  });

  if (!criticalCount || criticalCount === 0) return null;

  return (
    <Pressable
      onPress={() => router.push("/(app)/food-safety")}
      style={{
        flexDirection: "row", alignItems: "center", gap: 12,
        padding: 14, borderRadius: 12, marginBottom: 12,
        backgroundColor: colors.destructive + "12", borderWidth: 1, borderColor: colors.destructive + "30",
      }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.destructive + "20", alignItems: "center", justifyContent: "center" }}>
        <ShieldAlert size={18} color={colors.destructive} strokeWidth={1.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: colors.destructive }}>
          {criticalCount} Critical Safety Alert{criticalCount > 1 ? "s" : ""}
        </Text>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          Temperature readings out of safe range today
        </Text>
      </View>
      <ChevronRight size={16} color={colors.destructive} strokeWidth={1.5} />
    </Pressable>
  );
}

function TaskInbox({ orgId, colors, router }: { orgId: string | undefined; colors: any; router: any }) {
  const { data: tasks } = useQuery({
    queryKey: ["dashboard-tasks", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("kitchen_tasks")
        .select("id, title, priority, due_date, status")
        .eq("org_id", orgId)
        .neq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) return [];
      return data || [];
    },
    enabled: !!orgId,
  });

  if (!tasks || tasks.length === 0) return null;

  const priorityColor = (p: string) => {
    if (p === "high" || p === "urgent") return colors.destructive;
    if (p === "medium") return colors.warning;
    return colors.success;
  };

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Task Inbox</Text>
          <View style={{ backgroundColor: colors.accent, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#FFFFFF" }}>{tasks.length}</Text>
          </View>
        </View>
      </View>
      {tasks.map((task: any) => (
        <View key={task.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: priorityColor(task.priority || "low") }} />
          <Text style={{ flex: 1, fontSize: 13, color: colors.text }} numberOfLines={1}>{task.title}</Text>
          {task.due_date && (
            <Text style={{ fontSize: 11, color: colors.textMuted }}>
              {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

function ContributionStats({ orgId, userId, colors }: { orgId: string | undefined; userId: string | undefined; colors: any }) {
  const { data: contribs } = useQuery({
    queryKey: ["contribution-stats", orgId, userId],
    queryFn: async () => {
      if (!orgId || !userId) return null;
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [recipes, safety, tasks] = await Promise.all([
        supabase.from("recipes").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("created_by", userId).gte("created_at", weekAgo),
        supabase.from("food_safety_logs").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("recorded_by", userId).gte("created_at", weekAgo),
        supabase.from("kitchen_tasks").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("completed_by", userId).eq("status", "completed").gte("completed_at", weekAgo),
      ]);
      return {
        recipes: recipes.count || 0,
        safety: safety.count || 0,
        prep: tasks.count || 0,
      };
    },
    enabled: !!orgId && !!userId,
  });

  if (!contribs) return null;

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 12 }}>Your Week</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {[
          { label: "Recipes", value: contribs.recipes },
          { label: "Safety Logs", value: contribs.safety },
          { label: "Prep Done", value: contribs.prep },
        ].map((item) => (
          <View key={item.label} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, alignItems: "center" }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: colors.accent }}>{item.value}</Text>
            <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ReferralCard({ colors, referralCode }: { colors: any; referralCode?: string }) {
  if (!referralCode) return null;

  const handleShare = async () => {
    try {
      await Share.share({
        message: IS_HOMECHEF
          ? `Try HomeChef — organise your recipes, meal prep & kitchen like a pro! Use my code: ${referralCode}\nhttps://chefos.ai/invite/${referralCode}`
          : `Join ChefOS with my referral code: ${referralCode}\nhttps://chefos.ai/invite/${referralCode}`,
      });
    } catch {}
  };

  return (
    <View style={{ backgroundColor: colors.accentBg, borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <Gift size={20} color={colors.accent} strokeWidth={1.5} />
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{IS_HOMECHEF ? "Share with Friends" : "Refer a Chef"}</Text>
      </View>
      <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
        Share your code and both get a free month of Pro!
      </Text>
      <Pressable
        onPress={handleShare}
        style={({ pressed }) => ({
          backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 10, alignItems: "center",
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF" }}>Share Code: {referralCode}</Text>
      </Pressable>
    </View>
  );
}

// DateCarousel removed — To Do section has its own day carousel

function ReservationWidget({ selectedDate, viewMode, colors }: { selectedDate: Date; viewMode: "day" | "week"; colors: any }) {
  const { stats, isLoading } = useReservationData(selectedDate, viewMode);

  if (isLoading || !stats.hasData) return null;

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <UtensilsCrossed size={16} color={colors.accent} strokeWidth={1.5} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
            {viewMode === "day" ? "Tonight's Service" : "This Week"}
          </Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>
          {stats.totalCovers} covers
        </Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.accent }}>{stats.totalCovers}</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Covers</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.accent }}>{stats.totalBookings}</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Bookings</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: stats.vipCount > 0 ? colors.warning : colors.accent }}>{stats.vipCount}</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>VIPs</Text>
        </View>
      </View>

      {/* Upcoming reservations (day view only) */}
      {viewMode === "day" && stats.upcoming.length > 0 && (
        <View style={{ gap: 8 }}>
          {stats.upcoming.map((res) => (
            <View key={res.id} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent, width: 50 }}>{res.time}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{res.guest_name}</Text>
                  {res.guest?.vip_tier && res.guest.vip_tier !== "none" && (
                    <Star size={12} color={colors.warning} fill={colors.warning} />
                  )}
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>
                    <Users size={10} color={colors.textMuted} /> {res.party_size}
                  </Text>
                  {res.table_number && <Text style={{ fontSize: 12, color: colors.textMuted }}>T{res.table_number}</Text>}
                  {res.dietary_notes && (
                    <Text style={{ fontSize: 11, color: colors.warning, fontWeight: "600" }}>{res.dietary_notes}</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Week view: avg party size */}
      {viewMode === "week" && (
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>
          Avg party size: {stats.avgPartySize} · {stats.vipCount} VIP guest{stats.vipCount !== 1 ? "s" : ""}
        </Text>
      )}

      {stats.isFromImport && stats.lastSynced && (
        <Text style={{ fontSize: 11, color: colors.textMuted }}>
          From external system · Last synced: {new Date(stats.lastSynced).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </Text>
      )}
    </View>
  );
}

function FoodSalesWidget({ selectedDate, viewMode, colors }: { selectedDate: Date; viewMode: "day" | "week"; colors: any }) {
  const { stats, isLoading } = useFoodSales(selectedDate, viewMode);

  if (isLoading || !stats.hasData) return null;

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <DollarSign size={16} color={colors.success} strokeWidth={1.5} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
            {viewMode === "day" ? "Today's Sales" : "Weekly Sales"}
          </Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.success }}>
          ${stats.totalRevenue.toFixed(2)}
        </Text>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.success }}>${stats.totalRevenue.toFixed(0)}</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Revenue</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.accent }}>{stats.totalOrders}</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Orders</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.accent }}>${stats.avgTicket}</Text>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Avg Ticket</Text>
        </View>
      </View>

      {/* Top selling items */}
      {stats.topItems.length > 0 && (
        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase" }}>Top Sellers</Text>
          {stats.topItems.map((item, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: colors.text }}>{item.name}</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>{item.qty} sold</Text>
            </View>
          ))}
        </View>
      )}

      {stats.isFromImport && stats.lastSynced && (
        <Text style={{ fontSize: 11, color: colors.textMuted }}>
          From POS sync · Last synced: {new Date(stats.lastSynced).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </Text>
      )}
    </View>
  );
}

function DishParWidget({ selectedDate, colors }: { selectedDate: Date; colors: any }) {
  const dateStr = selectedDate.toISOString().split("T")[0];
  const { predictions, covers, isLoading } = useDishParPredictions(dateStr);

  if (isLoading || predictions.length === 0) return null;

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TrendingUp size={16} color={colors.accent} strokeWidth={1.5} />
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Predicted Prep</Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.accent }}>{covers} covers</Text>
      </View>
      {predictions.slice(0, 6).map((p, i) => (
        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 }}>
          <Text style={{ fontSize: 14, color: colors.text, flex: 1 }} numberOfLines={1}>{p.item_name}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.accent }}>{p.predicted_qty}</Text>
            <View style={{ backgroundColor: (p.confidence === "high" ? colors.success : p.confidence === "medium" ? colors.warning : colors.textMuted) + "20", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
              <Text style={{ fontSize: 9, fontWeight: "700", color: p.confidence === "high" ? colors.success : p.confidence === "medium" ? colors.warning : colors.textMuted }}>{p.confidence}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function MoneyOSWidget({ colors, orgId, router }: { colors: any; orgId: string | undefined; router: any }) {
  const { data: snapshot } = useQuery({
    queryKey: ["money-widget", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data } = await supabase
        .from("pnl_snapshots")
        .select("revenue_total, net_profit, net_profit_pct, labour_pct, cogs_food")
        .eq("org_id", orgId)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!orgId,
    staleTime: 120_000,
  });

  const foodPct = snapshot && snapshot.revenue_total > 0
    ? ((snapshot.cogs_food / snapshot.revenue_total) * 100).toFixed(1)
    : null;

  const profitColor = snapshot
    ? snapshot.net_profit_pct >= 5 ? colors.success
      : snapshot.net_profit_pct >= 0 ? colors.warning
        : colors.destructive
    : colors.textMuted;

  return (
    <Pressable
      onPress={() => { lightTap(); router.push("/(app)/money"); }}
      style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16 }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: "#84CC16" + "20", alignItems: "center", justifyContent: "center" }}>
            <DollarSign size={14} color="#84CC16" strokeWidth={2} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>MoneyOS</Text>
        </View>
        <ChevronRight size={16} color={colors.accent} strokeWidth={1.5} />
      </View>
      {snapshot ? (
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: profitColor }}>{snapshot.net_profit_pct.toFixed(1)}%</Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>Net Profit</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>${(snapshot.revenue_total / 1000).toFixed(1)}k</Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>Revenue</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 10, alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: snapshot.labour_pct > 32 ? colors.destructive : colors.text }}>{snapshot.labour_pct.toFixed(1)}%</Text>
            <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>Labour</Text>
          </View>
        </View>
      ) : (
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>Tap to view financial intelligence</Text>
      )}
    </Pressable>
  );
}

const EATSAFE_NAVY = "#000080";

function EatSafeOnboarding({ orgId, colors, router }: { orgId: string | undefined; colors: any; router: any }) {
  const { data: checklist } = useQuery({
    queryKey: ["eatsafe-onboarding", orgId],
    queryFn: async () => {
      if (!orgId) return { profile: false, tempLog: false, selfAssess: false, cleaning: false, supplier: false };
      const [profileRes, tempRes, assessRes, cleaningRes, supplierRes] = await Promise.all([
        supabase.from("compliance_profiles").select("id", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("food_safety_logs").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("check_type", "temperature"),
        supabase.from("audit_self_assessments").select("id", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("cleaning_schedules").select("id", { count: "exact", head: true }).eq("org_id", orgId),
        supabase.from("suppliers").select("id", { count: "exact", head: true }).eq("org_id", orgId),
      ]);
      return {
        profile: (profileRes.count ?? 0) > 0,
        tempLog: (tempRes.count ?? 0) > 0,
        selfAssess: (assessRes.count ?? 0) > 0,
        cleaning: (cleaningRes.count ?? 0) > 0,
        supplier: (supplierRes.count ?? 0) > 0,
      };
    },
    enabled: !!orgId,
  });

  if (!checklist) return null;

  const steps = [
    { done: checklist.profile, label: "Complete FSSAI/BCC profile setup", route: "/(app)/food-safety" as const },
    { done: checklist.tempLog, label: "Log your first temperature", route: "/(app)/temp-grid" as const },
    { done: checklist.selfAssess, label: "Complete a self-assessment", route: "/(app)/food-safety" as const },
    { done: checklist.cleaning, label: "Set up cleaning schedule", route: "/(app)/food-safety" as const },
    { done: checklist.supplier, label: "Add your first supplier", route: "/(app)/ingredients" as const },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const totalSteps = steps.length;
  const progressPct = Math.round((completedCount / totalSteps) * 100);

  if (completedCount === totalSteps) return null;

  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: EATSAFE_NAVY + "20" }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: EATSAFE_NAVY + "15", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={18} color={EATSAFE_NAVY} strokeWidth={1.5} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>Get Started with EatSafe</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {completedCount} of {totalSteps} complete
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden", marginBottom: 14 }}>
        <View style={{ height: 6, width: `${progressPct}%`, backgroundColor: EATSAFE_NAVY, borderRadius: 3 }} />
      </View>

      {/* Checklist items */}
      <View style={{ gap: 10 }}>
        {steps.map((step, i) => (
          <Pressable
            key={i}
            onPress={() => router.push(step.route)}
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <View
              style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: step.done ? EATSAFE_NAVY : colors.border,
                alignItems: "center", justifyContent: "center",
              }}
            >
              {step.done && <Check size={13} color="#FFFFFF" strokeWidth={2.5} />}
            </View>
            <Text
              style={{
                flex: 1, fontSize: 14,
                color: step.done ? colors.textMuted : colors.text,
                textDecorationLine: step.done ? "line-through" : "none",
              }}
            >
              {step.label}
            </Text>
            {!step.done && <ChevronRight size={14} color={colors.textMuted} strokeWidth={1.5} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function DashboardRoute() {
  if (isVendor(APP_VARIANT_KEY)) return <VendorDashboard />;
  return <Dashboard />;
}

function Dashboard() {
  const router = useRouter();
  const { profile, isHeadChef: isHead, signOut } = useAuth();
  const { currentOrg, storeMode } = useOrg();
  const { colors } = useTheme();
  const { data: stats, isLoading, refetch, isRefetching } = useDashboardStats();
  const { data: healthData } = useSystemHealth();
  const { data: posts, refetch: refetchPosts, isRefetching: isRefetchingPosts } = useTeamPosts();
  const orgId = currentOrg?.id;

  const selectedDate = new Date();
  const viewMode = "day" as const;
  const { showReservations, showPosSales, showDishPar } = useOrgSettings();

  const { variant, canAccess } = useFeatureGate();
  const isEatSafe = isComplianceVariant(variant);
  const isIndia = variant === "india_fssai";
  const complianceFramework = VARIANT_COMPLIANCE[variant];

  const isHomeCook = isHomeCookVariant(APP_VARIANT_KEY);
  const isHeadChef = isHead;

  // Companion onboarding + walkthrough trigger (homecook only, fires once per mount)
  const { needsOnboarding: companionNeedsOnboarding } = useCompanion();
  const { settings: appSettings } = useAppSettings();
  const onboardingPushed = useRef(false);

  useEffect(() => {
    if (!isHomeCook || onboardingPushed.current) return;

    if (companionNeedsOnboarding && appSettings.companionEnabled) {
      onboardingPushed.current = true;
      const timer = setTimeout(() => {
        router.push("/(app)/companion-onboarding");
      }, 600);
      return () => clearTimeout(timer);
    }

    if (!appSettings.hasSeenWalkthrough) {
      onboardingPushed.current = true;
      const timer = setTimeout(() => {
        router.push("/(app)/feature-walkthrough");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isHomeCook, companionNeedsOnboarding, appSettings.companionEnabled, appSettings.hasSeenWalkthrough]);

  const greeting = profile?.full_name
    ? `Hey${isHomeCook ? " Boss" : " Chef"} ${profile.full_name.split(" ")[0]}`
    : isHomeCook ? "Welcome Home" : "Dashboard";

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const pendingPrep = (stats?.prepTasksTotal ?? 0) - (stats?.prepTasksCompleted ?? 0);
  const foodCostColor = (stats?.avgFoodCostPercent ?? 0) <= (stats?.targetFoodCost ?? 30) ? colors.success : colors.warning;

  const { data: safetyCount } = useQuery({
    queryKey: ["safety-today-count", orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const today = new Date().toISOString().split("T")[0];
      const { count, error } = await supabase.from("food_safety_logs").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("date", today);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!orgId,
  });

  const { data: bccReadiness } = useQuery({
    queryKey: ["bcc-readiness-pill", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { count } = await supabase.from("compliance_profiles").select("id", { count: "exact", head: true }).eq("org_id", orgId);
      if (!count) return null;
      // Quick readiness: check critical actions
      const { count: criticalCount } = await supabase.from("corrective_actions").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("status", "open").eq("severity", "critical");
      return { hasBCC: true, criticalOpen: criticalCount || 0 };
    },
    enabled: !!orgId && !isHomeCook,
  });

  const { data: fssaiReadiness } = useQuery({
    queryKey: ["fssai-readiness-pill", orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { count: profileCount } = await supabase
        .from("compliance_profiles")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId);
      if (!profileCount) return null;
      const { data: assessments } = await supabase
        .from("audit_self_assessments")
        .select("score")
        .eq("org_id", orgId)
        .eq("framework", "fssai")
        .order("created_at", { ascending: false })
        .limit(1);
      const latestScore = assessments?.[0]?.score ?? null;
      return { hasFSSAI: true, score: latestScore };
    },
    enabled: !!orgId && complianceFramework === "fssai",
  });

  const handleRefresh = useCallback(() => {
    refetch();
    refetchPosts();
  }, [refetch, refetchPosts]);

  const setupSteps = useMemo(() => [
    { done: (stats?.recipeCount ?? 0) > 0, label: "Add your first recipe", onPress: () => router.push({ pathname: "/(app)/recipe/edit", params: { id: "new" } }) },
    { done: false, label: "Add ingredients", onPress: () => router.push("/(app)/ingredients") },
    ...(!isHomeCook ? [{ done: false, label: "Invite a team member", onPress: () => router.push("/(app)/team") }] : []),
    { done: (safetyCount ?? 0) > 0, label: "Log a temperature check", onPress: () => router.push("/(app)/temp-grid" as any) },
    { done: (stats?.prepTasksTotal ?? 0) > 0, label: "Create a prep list", onPress: () => router.push("/(app)/prep-lists") },
  ], [stats, safetyCount, isHomeCook, router]);

  const setupDone = setupSteps.filter((s) => s.done).length;
  const setupTotal = setupSteps.length;
  const setupPct = Math.round((setupDone / setupTotal) * 100);

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

  const headerContent = (
    <>
      {/* Header with Health Score */}
      <View style={{ padding: 24, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>
              {currentOrg?.name || "My Kitchen"}
            </Text>
            <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text, marginTop: 4 }}>
              {greeting}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>{currentDate}</Text>
          </View>
          <View style={{ alignItems: "flex-end", gap: 6 }}>
            {/* Help — long-press to go to landing (dev shortcut) */}
            <Pressable
              onPress={() => { lightTap(); router.push("/(app)/help"); }}
              onLongPress={() => { lightTap(); router.replace("/(auth)/landing"); }}
              delayLongPress={800}
              style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}
            >
              <MessageCircleQuestion size={20} color={colors.accent} strokeWidth={1.8} />
            </Pressable>
            {!isHomeCook && healthData && (
              <HealthScorePill score={healthData.overallScore} onPress={() => router.push("/(app)/housekeeping")} />
            )}
            {!isHomeCook && complianceFramework === "bcc" && bccReadiness?.hasBCC && (
              <Pressable
                onPress={() => router.push("/(app)/food-safety")}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 4,
                  backgroundColor: bccReadiness.criticalOpen > 0 ? colors.destructive + "20" : "#000080" + "20",
                  borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
                }}
              >
                <ShieldCheck size={12} color={bccReadiness.criticalOpen > 0 ? colors.destructive : "#000080"} strokeWidth={2} />
                <Text style={{
                  fontSize: 11, fontWeight: "700",
                  color: bccReadiness.criticalOpen > 0 ? colors.destructive : "#000080",
                }}>
                  {bccReadiness.criticalOpen > 0 ? `${bccReadiness.criticalOpen} critical` : "BCC"}
                </Text>
              </Pressable>
            )}
            {!isHomeCook && complianceFramework === "fssai" && fssaiReadiness?.hasFSSAI && (
              <Pressable
                onPress={() => router.push("/(app)/food-safety")}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 4,
                  backgroundColor: "#FF9933" + "20",
                  borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
                }}
              >
                <ShieldCheck size={12} color="#FF9933" strokeWidth={2} />
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#FF9933" }}>
                  {fssaiReadiness.score != null ? `FSSAI ${fssaiReadiness.score}%` : "FSSAI"}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => { lightTap(); router.push("/(app)/costing"); }}
              style={{
                flexDirection: "row", alignItems: "center", gap: 4,
                backgroundColor: colors.success + "20",
                borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
              }}
            >
              <Calculator size={12} color={colors.success} strokeWidth={2} />
              <Text style={{ fontSize: 11, fontWeight: "700", color: colors.success }}>Cost Calc</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* To Do — always renders, loads its own data */}
      <View style={{ marginBottom: 16 }}>
        <CommandCentre compact />
      </View>

      {/* Companion Widget (homecook only) */}
      {isHomeCook && <CompanionWidget colors={colors} router={router} />}

      {/* Home Cleaning — nav card (homecook only) */}
      {isHomeCook && (
        <View style={{ marginHorizontal: 24, marginBottom: 12 }}>
          <HomeCleaningWidget />
        </View>
      )}

      {isLoading ? (
        <View style={{ padding: 24, gap: 12 }}><SkeletonCard /><SkeletonCard /><SkeletonCard /></View>
      ) : (
        <View style={{ paddingHorizontal: 24 }}>
          {/* Stats Grid */}
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}><StatCard label={isHomeCook ? "My Recipes" : "Active Recipes"} value={stats?.recipeCount ?? 0} icon={BookOpen} backgroundColor={isHomeCook ? colors.warningBg : colors.successBg} /></View>
            <View style={{ flex: 1 }}><StatCard label="Low Stock" value={stats?.lowStockCount ?? 0} icon={AlertTriangle} backgroundColor={(stats?.lowStockCount ?? 0) > 0 ? colors.destructiveBg : colors.surface} /></View>
          </View>
          {!isHomeCook && (
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <View style={{ backgroundColor: foodCostColor + "15", borderRadius: 16, padding: 16 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>Food Cost</Text>
                  <Text style={{ fontSize: 24, fontWeight: "800", color: foodCostColor, marginTop: 4 }}>{stats?.avgFoodCostPercent ?? 0}%</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>Target: {stats?.targetFoodCost ?? 30}%</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}><StatCard label="Safety Checks" value={safetyCount ?? 0} icon={ClipboardList} backgroundColor={colors.accentBg} /></View>
            </View>
          )}

          {/* Food Safety Alerts */}
          {!isHomeCook && <FoodSafetyAlerts orgId={orgId} colors={colors} router={router} />}

          {/* Reservation Widget */}
          {!isHomeCook && showReservations && (
            <ReservationWidget selectedDate={selectedDate} viewMode={viewMode} colors={colors} />
          )}

          {/* Food Sales Widget */}
          {!isHomeCook && showPosSales && (
            <FoodSalesWidget selectedDate={selectedDate} viewMode={viewMode} colors={colors} />
          )}

          {/* Dish Par Predictions */}
          {!isHomeCook && showDishPar && (
            <DishParWidget selectedDate={selectedDate} colors={colors} />
          )}

          {/* MoneyOS Quick View — free for all */}
          {!isHomeCook && (
            <MoneyOSWidget colors={colors} orgId={orgId} router={router} />
          )}

          {/* Alerts */}
          <View style={{ gap: 10, marginBottom: 16 }}>
            {(stats?.lowStockCount ?? 0) > 0 && <AlertBanner icon={AlertTriangle} title="Low Stock Alert" subtitle={`${stats?.lowStockCount} items below par level`} color={colors.warning} onPress={() => router.push("/(app)/ingredients")} />}
            {(stats?.lowStockCount ?? 0) === 0 && pendingPrep === 0 && <AlertBanner icon={Check} title="All Clear" subtitle="Everything is running smoothly" color={colors.success} />}
          </View>

          {/* Contribution Stats */}
          {!isHomeCook && <ContributionStats orgId={orgId} userId={profile?.id} colors={colors} />}

          {/* EatSafe Brisbane Onboarding Checklist */}
          {isEatSafe && (
            <EatSafeOnboarding orgId={orgId} colors={colors} router={router} />
          )}

          {/* Setup Progress / Onboarding */}
          {setupPct < 100 && (
            <View style={{ backgroundColor: colors.accentBg, borderRadius: 16, padding: 16, marginBottom: 16, gap: 12 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>Getting Started</Text>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>{setupPct}%</Text>
              </View>
              <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: "hidden" }}>
                <View style={{ height: 6, width: `${setupPct}%`, backgroundColor: colors.accent, borderRadius: 3 }} />
              </View>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>{setupDone}/{setupTotal} steps completed</Text>
              {setupSteps.map((step, i) => (
                <Pressable key={i} onPress={step.onPress} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: step.done ? colors.success : colors.border, alignItems: "center", justifyContent: "center" }}>
                    {step.done && <Check size={12} color={colors.background} strokeWidth={2.5} />}
                  </View>
                  <Text style={{ fontSize: 14, color: step.done ? colors.textMuted : colors.textSecondary, textDecorationLine: step.done ? "line-through" : "none" }}>{step.label}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Referral Card */}
          <ReferralCard colors={colors} referralCode={(profile as any)?.referral_code} />

          {/* Kitchen Wall */}
          {!isHomeCook && (
            <View style={{ marginBottom: 12 }}>
              <KitchenWallHeader />
              <KitchenWallComposer />
            </View>
          )}
        </View>
      )}
    </>
  );

  const feedData = (!isHomeCook && posts) ? posts : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        data={feedData}
        keyExtractor={(item) => item.id}
        scrollEnabled={true}
        ListHeaderComponent={headerContent}
        renderItem={() => null}
        ListFooterComponent={
          !isHomeCook && !isLoading ? (
            <View style={{ paddingHorizontal: 24, paddingBottom: 40 }}>
              <KitchenWallFeed isHeadChef={isHeadChef} />
            </View>
          ) : <View style={{ height: 40 }} />
        }
        refreshControl={<RefreshControl refreshing={isRefetching || isRefetchingPosts} onRefresh={handleRefresh} />}
      />
    </SafeAreaView>
  );
}
