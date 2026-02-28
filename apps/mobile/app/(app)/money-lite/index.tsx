import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { useOrg } from "../../../contexts/OrgProvider";
import { Card, CardContent } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Skeleton } from "../../../components/ui/Skeleton";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { useTheme } from "../../../contexts/ThemeProvider";

interface MoneyLiteEntry {
  id: string;
  org_id: string;
  period_start: string;
  period_type: string;
  revenue: number;
  food_cost: number;
  bev_cost: number;
  labour: number;
  overheads: number;
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

export default function MoneyLite() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id;
  const weekStart = getWeekStart();

  const [editing, setEditing] = useState(false);
  const [revenue, setRevenue] = useState("");
  const [foodCost, setFoodCost] = useState("");
  const [bevCost, setBevCost] = useState("");
  const [labour, setLabour] = useState("");
  const [overheads, setOverheads] = useState("");

  const { data: entry, isLoading, refetch, isRefetching } = useQuery<MoneyLiteEntry | null>({
    queryKey: ["money-lite", orgId, weekStart],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from("money_lite_entries")
        .select("*")
        .eq("org_id", orgId)
        .eq("period_start", weekStart)
        .eq("period_type", "weekly")
        .maybeSingle();
      if (error) throw error;
      return data as MoneyLiteEntry | null;
    },
    enabled: !!orgId,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error("No org");
      const data = {
        org_id: orgId,
        period_start: weekStart,
        period_type: "weekly" as const,
        revenue: parseFloat(revenue) || 0,
        food_cost: parseFloat(foodCost) || 0,
        bev_cost: parseFloat(bevCost) || 0,
        labour: parseFloat(labour) || 0,
        overheads: parseFloat(overheads) || 0,
      };

      if (entry?.id) {
        const { error } = await supabase
          .from("money_lite_entries")
          .update(data)
          .eq("id", entry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("money_lite_entries")
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["money-lite"] });
    },
    onError: (err: Error) => {
      Alert.alert("Error", err.message);
    },
  });

  const startEdit = () => {
    setRevenue(entry?.revenue?.toString() || "0");
    setFoodCost(entry?.food_cost?.toString() || "0");
    setBevCost(entry?.bev_cost?.toString() || "0");
    setLabour(entry?.labour?.toString() || "0");
    setOverheads(entry?.overheads?.toString() || "0");
    setEditing(true);
  };

  const totalCosts = entry
    ? entry.food_cost + entry.bev_cost + entry.labour + entry.overheads
    : 0;
  const profit = entry ? entry.revenue - totalCosts : 0;
  const profitPct = entry && entry.revenue > 0 ? ((profit / entry.revenue) * 100).toFixed(1) : "0";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="Money Lite" />

      {/* Upgrade banner */}
      <Pressable
        onPress={() => router.push("/(app)/money")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginHorizontal: 16,
          marginBottom: 8,
          padding: 12,
          borderRadius: 12,
          backgroundColor: "#84CC16" + "15",
          borderWidth: 1,
          borderColor: "#84CC16" + "30",
        }}
      >
        <Text style={{ flex: 1, fontSize: 13, fontWeight: "600", color: "#4D7C0F" }}>
          Try the full MoneyOS dashboard with live P&L, alerts & more
        </Text>
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#84CC16" }}>Open</Text>
      </Pressable>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 16 }}>
          Week of {weekStart}
        </Text>

        {isLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton width="100%" height={100} borderRadius={16} />
            <Skeleton width="100%" height={200} borderRadius={16} />
          </View>
        ) : editing ? (
          <Card>
            <CardContent style={{ paddingTop: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 16 }}>
                Update This Week
              </Text>
              <Input label="Revenue ($)" value={revenue} onChangeText={setRevenue} keyboardType="decimal-pad" />
              <Input label="Food Cost ($)" value={foodCost} onChangeText={setFoodCost} keyboardType="decimal-pad" />
              <Input label="Beverage Cost ($)" value={bevCost} onChangeText={setBevCost} keyboardType="decimal-pad" />
              <Input label="Labour ($)" value={labour} onChangeText={setLabour} keyboardType="decimal-pad" />
              <Input label="Overheads ($)" value={overheads} onChangeText={setOverheads} keyboardType="decimal-pad" />
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <Button variant="secondary" onPress={() => setEditing(false)} style={{ flex: 1 }}>
                  Cancel
                </Button>
                <Button onPress={() => saveMutation.mutate()} loading={saveMutation.isPending} style={{ flex: 1 }}>
                  Save
                </Button>
              </View>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary */}
            <Card style={{ marginBottom: 12, backgroundColor: profit >= 0 ? colors.successBg : colors.destructiveBg }}>
              <CardContent style={{ paddingTop: 16, alignItems: "center" }}>
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>Profit</Text>
                <Text
                  style={{
                    fontSize: 36,
                    fontWeight: "800",
                    color: profit >= 0 ? colors.success : colors.destructive,
                  }}
                >
                  ${Math.abs(profit).toFixed(0)}
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary }}>
                  {profitPct}% margin
                </Text>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <Card style={{ marginBottom: 16 }}>
              <CardContent style={{ paddingTop: 16 }}>
                <Row label="Revenue" value={entry?.revenue || 0} color={colors.success} borderColor={colors.border} textColor={colors.textSecondary} />
                <Row label="Food Cost" value={entry?.food_cost || 0} color={colors.destructive} borderColor={colors.border} textColor={colors.textSecondary} />
                <Row label="Beverage Cost" value={entry?.bev_cost || 0} color={colors.destructive} borderColor={colors.border} textColor={colors.textSecondary} />
                <Row label="Labour" value={entry?.labour || 0} color={colors.warning} borderColor={colors.border} textColor={colors.textSecondary} />
                <Row label="Overheads" value={entry?.overheads || 0} color={colors.textSecondary} borderColor={colors.border} textColor={colors.textSecondary} />
              </CardContent>
            </Card>

            <Button onPress={startEdit}>
              {entry ? "Update Numbers" : "Enter This Week's Numbers"}
            </Button>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value, color, borderColor, textColor }: { label: string; value: number; color: string; borderColor: string; textColor: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
      }}
    >
      <Text style={{ fontSize: 15, color: textColor }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: "700", color }}>
        ${value.toFixed(0)}
      </Text>
    </View>
  );
}
