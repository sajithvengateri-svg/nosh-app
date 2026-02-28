import { useState, useMemo } from "react";
import {
  View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, ExternalLink,
  ChefHat, Users, Percent, Activity, PieChart, BarChart3, Calculator,
  FileSearch, Trophy, Settings, CircleDot, ArrowRight, Banknote, Receipt,
  Wallet, Scale, Target, CreditCard, LineChart, Shield,
} from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { useMoneyDashboard } from "../../hooks/useMoneyDashboard";
import { Badge } from "../ui/Badge";
import { lightTap } from "../../lib/haptics";

type MoneyTab = "snapshot" | "explore" | "actions";

interface MoneyCommandCentreProps {
  compact?: boolean;
}

// ─── Web Suite Links ────────────────────────────────────────
const MONEY_SUITE_LINKS = [
  { id: "reactor", label: "Reactor", desc: "Live P&L engine", icon: Activity, color: "#22C55E", path: "/money/reactor" },
  { id: "pnl", label: "P&L Statement", desc: "Full profit & loss", icon: Receipt, color: "#6366F1", path: "/money/pnl" },
  { id: "trends", label: "Trends", desc: "Revenue & cost trends", icon: LineChart, color: "#3B82F6", path: "/money/trends" },
  { id: "simulator", label: "Simulator", desc: "What-if scenarios", icon: Calculator, color: "#F59E0B", path: "/money/simulator" },
  { id: "forensic", label: "Forensic", desc: "Cost breakdown drill", icon: FileSearch, color: "#EF4444", path: "/money/forensic" },
  { id: "portfolio", label: "Portfolio", desc: "Multi-site overview", icon: PieChart, color: "#8B5CF6", path: "/money/portfolio" },
  { id: "benchmarks", label: "Benchmarks", desc: "Industry comparison", icon: Trophy, color: "#14B8A6", path: "/money/benchmarks" },
  { id: "audit", label: "Audit", desc: "Financial health check", icon: Shield, color: "#F97316", path: "/money/audit" },
];

const WEB_BASE = "https://chefos.ai";

export function MoneyCommandCentre({ compact = false }: MoneyCommandCentreProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useMoneyDashboard();
  const [activeTab, setActiveTab] = useState<MoneyTab>("snapshot");

  const snapshot = data?.snapshot;
  const alerts = data?.alerts ?? [];
  const ecosystem = data?.ecosystem ?? [];
  const auditScore = data?.auditScore;

  const foodPct = snapshot && snapshot.revenue_total > 0
    ? ((snapshot.cogs_food / snapshot.revenue_total) * 100)
    : 0;

  // Data completeness as progress
  const completeness = snapshot?.data_completeness_pct ?? 0;

  // Count critical alerts
  const criticalCount = alerts.filter((a) => a.level === "critical").length;
  const warningCount = alerts.filter((a) => a.level === "warning").length;

  const openWebPage = (path: string) => {
    lightTap();
    Linking.openURL(`${WEB_BASE}${path}`);
  };

  return (
    <View>
      {/* Header — matches CommandCentre pattern */}
      <View style={{ paddingHorizontal: 20, paddingTop: compact ? 0 : 12, paddingBottom: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <DollarSign size={20} color={colors.accent} strokeWidth={2} />
            <Text style={{ fontSize: compact ? 18 : 22, fontWeight: "800", color: colors.text }}>
              MoneyOS
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {criticalCount > 0 && (
              <View style={{ backgroundColor: colors.destructiveBg, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={12} color={colors.destructive} strokeWidth={2} />
                <Text style={{ fontSize: 11, fontWeight: "700", color: colors.destructive }}>{criticalCount}</Text>
              </View>
            )}
            <Pressable
              onPress={() => { lightTap(); router.push("/(app)/money/settings"); }}
              style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}
            >
              <Settings size={14} color={colors.textSecondary} strokeWidth={1.5} />
            </Pressable>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
          {snapshot
            ? `Net ${snapshot.net_profit_pct.toFixed(1)}% · $${(snapshot.revenue_total / 1000).toFixed(1)}k revenue`
            : "No data yet — connect a data source"}
        </Text>
      </View>

      {/* Data Completeness Bar (like progress bar) */}
      {snapshot && (
        <View style={{ paddingHorizontal: 20, paddingVertical: 6 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Data completeness</Text>
            <Text style={{ fontSize: 12, fontWeight: "700", color: completeness >= 80 ? colors.success : completeness >= 50 ? colors.warning : colors.destructive }}>
              {completeness.toFixed(0)}%
            </Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.surface, overflow: "hidden" }}>
            <View style={{
              height: 6, borderRadius: 3, width: `${Math.min(completeness, 100)}%` as any,
              backgroundColor: completeness >= 80 ? colors.success : completeness >= 50 ? colors.warning : colors.destructive,
            }} />
          </View>
        </View>
      )}

      {/* Quick Actions (horizontal scroll — matches CommandCentre) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 6 }}>
        <Pressable
          onPress={() => openWebPage("/money/reactor")}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1 })}
        >
          <Activity size={16} color={colors.success} strokeWidth={1.5} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Live P&L</Text>
        </Pressable>

        <Pressable
          onPress={() => { lightTap(); router.push("/(app)/money-lite"); }}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1 })}
        >
          <Banknote size={16} color={colors.accent} strokeWidth={1.5} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Log Entry</Text>
        </Pressable>

        <Pressable
          onPress={() => openWebPage("/money/simulator")}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1 })}
        >
          <Calculator size={16} color={colors.warning} strokeWidth={1.5} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Simulator</Text>
        </Pressable>

        <Pressable
          onPress={() => openWebPage("/money/forensic")}
          style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.cardBorder, opacity: pressed ? 0.7 : 1 })}
        >
          <FileSearch size={16} color={colors.destructive} strokeWidth={1.5} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }}>Forensic</Text>
        </Pressable>
      </ScrollView>

      {/* Tab Pills (matches CommandCentre tabs) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 6, marginBottom: 4, marginTop: 4 }}>
        {([
          { key: "snapshot" as const, label: "Snapshot", icon: BarChart3 },
          { key: "explore" as const, label: "Full Suite", icon: ExternalLink },
          { key: "actions" as const, label: "Alerts", icon: AlertTriangle },
        ]).map(({ key, label, icon: Icon }) => (
          <Pressable key={key} onPress={() => { lightTap(); setActiveTab(key); }}
            style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: activeTab === key ? colors.accent : colors.surface }}
          >
            <Icon size={14} color={activeTab === key ? "#FFFFFF" : colors.textSecondary} strokeWidth={1.5} />
            <Text style={{ fontSize: 12, fontWeight: "700", color: activeTab === key ? "#FFFFFF" : colors.textSecondary }}>{label}</Text>
            {key === "actions" && criticalCount + warningCount > 0 && (
              <View style={{ backgroundColor: activeTab === key ? "#FFFFFF30" : colors.destructiveBg, borderRadius: 8, paddingHorizontal: 5, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: "700", color: activeTab === key ? "#FFFFFF" : colors.destructive }}>{criticalCount + warningCount}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* ─── Tab Content ────────────────────────────── */}

      {/* SNAPSHOT TAB */}
      {activeTab === "snapshot" && (
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          {isLoading ? (
            <View style={{ gap: 8 }}>
              <View style={{ height: 80, borderRadius: 16, backgroundColor: colors.surface }} />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <View style={{ flex: 1, height: 80, borderRadius: 16, backgroundColor: colors.surface }} />
                <View style={{ flex: 1, height: 80, borderRadius: 16, backgroundColor: colors.surface }} />
              </View>
            </View>
          ) : (
            <>
              {/* Net Profit Hero */}
              <View style={{
                backgroundColor: snapshot && snapshot.net_profit_pct >= 5
                  ? colors.successBg
                  : snapshot && snapshot.net_profit_pct >= 0
                    ? colors.warningBg
                    : colors.destructiveBg,
                borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 10,
              }}>
                <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Net Profit
                </Text>
                <Text style={{
                  fontSize: 44, fontWeight: "800", marginTop: 2,
                  color: snapshot && snapshot.net_profit_pct >= 5
                    ? colors.success
                    : snapshot && snapshot.net_profit_pct >= 0
                      ? colors.warning
                      : colors.destructive,
                }}>
                  {snapshot ? `${snapshot.net_profit_pct.toFixed(1)}%` : "—"}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {snapshot ? `$${snapshot.net_profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "Connect data to see results"}
                </Text>
              </View>

              {/* KPI Grid (2x2) */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <KPICard
                  label="Revenue"
                  value={snapshot ? `$${(snapshot.revenue_total / 1000).toFixed(1)}k` : "—"}
                  icon={TrendingUp}
                  iconColor={colors.success}
                  colors={colors}
                />
                <KPICard
                  label="Food Cost"
                  value={snapshot ? `${foodPct.toFixed(1)}%` : "—"}
                  icon={ChefHat}
                  iconColor={foodPct > 35 ? colors.destructive : foodPct > 30 ? colors.warning : colors.success}
                  bgColor={foodPct > 35 ? colors.destructiveBg : foodPct > 30 ? colors.warningBg : undefined}
                  colors={colors}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <KPICard
                  label="Labour"
                  value={snapshot ? `${snapshot.labour_pct.toFixed(1)}%` : "—"}
                  icon={Users}
                  iconColor={snapshot && snapshot.labour_pct > 32 ? colors.destructive : snapshot && snapshot.labour_pct > 28 ? colors.warning : colors.success}
                  bgColor={snapshot && snapshot.labour_pct > 32 ? colors.destructiveBg : snapshot && snapshot.labour_pct > 28 ? colors.warningBg : undefined}
                  colors={colors}
                />
                <KPICard
                  label="Prime Cost"
                  value={snapshot ? `${snapshot.prime_cost_pct.toFixed(1)}%` : "—"}
                  icon={Percent}
                  iconColor={snapshot && snapshot.prime_cost_pct > 70 ? colors.destructive : colors.accent}
                  bgColor={snapshot && snapshot.prime_cost_pct > 70 ? colors.destructiveBg : undefined}
                  colors={colors}
                />
              </View>

              {/* Audit Score (if available) */}
              {auditScore != null && (
                <View style={{
                  flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                  backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 8,
                  borderWidth: 1, borderColor: colors.cardBorder,
                }}>
                  <View>
                    <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "600" }}>Quiet Audit Score</Text>
                    <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text, marginTop: 2 }}>
                      {auditScore}/100
                    </Text>
                  </View>
                  <View style={{
                    width: 50, height: 50, borderRadius: 25, borderWidth: 4,
                    borderColor: (auditScore ?? 0) >= 85 ? colors.success : (auditScore ?? 0) >= 60 ? colors.warning : colors.destructive,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text }}>
                      {(auditScore ?? 0) >= 85 ? "A" : (auditScore ?? 0) >= 60 ? "B" : "C"}
                    </Text>
                  </View>
                </View>
              )}

              {/* Ecosystem Health */}
              {ecosystem.length > 0 && (
                <View style={{
                  backgroundColor: colors.card, borderRadius: 16, padding: 16,
                  borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 8,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text, marginBottom: 10 }}>Ecosystem</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {ecosystem.map((mod) => (
                      <View key={mod.id} style={{ flexDirection: "row", alignItems: "center", gap: 6, minWidth: "40%" }}>
                        <CircleDot
                          size={10}
                          color={mod.status === "connected" || mod.status === "synced" ? colors.success : mod.status === "stale" ? colors.warning : colors.destructive}
                          strokeWidth={2}
                        />
                        <Text style={{ fontSize: 12, color: colors.textSecondary, textTransform: "capitalize" }}>
                          {mod.module}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {/* EXPLORE TAB — Full Suite Web Links */}
      {activeTab === "explore" && (
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted, marginBottom: 10 }}>
            Open the full MoneyOS web suite in your browser.
          </Text>
          {MONEY_SUITE_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <Pressable
                key={link.id}
                onPress={() => openWebPage(link.path)}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", gap: 12,
                  backgroundColor: colors.card, borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: colors.cardBorder,
                  marginBottom: 8, opacity: pressed ? 0.7 : 1,
                })}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: link.color + "18", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} color={link.color} strokeWidth={1.5} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{link.label}</Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 1 }}>{link.desc}</Text>
                </View>
                <ArrowRight size={16} color={colors.textMuted} strokeWidth={1.5} />
              </Pressable>
            );
          })}

          {/* Open Full Suite CTA */}
          <Pressable
            onPress={() => openWebPage("/money/reactor")}
            style={({ pressed }) => ({
              flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
              backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 14,
              marginTop: 4, marginBottom: 8, opacity: pressed ? 0.9 : 1,
            })}
          >
            <ExternalLink size={16} color="#FFFFFF" strokeWidth={2} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>Open Full MoneyOS Suite</Text>
          </Pressable>
        </View>
      )}

      {/* ALERTS TAB */}
      {activeTab === "actions" && (
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          {alerts.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <Target size={32} color={colors.success} strokeWidth={1.5} />
              <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, marginTop: 12 }}>All Clear</Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: "center" }}>
                No alerts right now. Your numbers look healthy.
              </Text>
            </View>
          ) : (
            <>
              {alerts.map((alert) => (
                <View
                  key={alert.id}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 10,
                    backgroundColor: alert.level === "critical" ? colors.destructiveBg : alert.level === "warning" ? colors.warningBg : colors.accentBg,
                    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                    marginBottom: 8,
                  }}
                >
                  <View style={{
                    width: 8, height: 8, borderRadius: 4,
                    backgroundColor: alert.level === "critical" ? colors.destructive : alert.level === "warning" ? colors.warning : colors.accent,
                  }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>{alert.title}</Text>
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>{alert.detail}</Text>
                  </View>
                  <Badge variant={alert.level === "critical" ? "destructive" : alert.level === "warning" ? "warning" : "secondary"}>
                    {alert.level}
                  </Badge>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── KPI Card (compact, matching CommandCentre stat pattern) ────────
function KPICard({
  label,
  value,
  icon: Icon,
  iconColor,
  bgColor,
  colors,
}: {
  label: string;
  value: string;
  icon: any;
  iconColor: string;
  bgColor?: string;
  colors: any;
}) {
  return (
    <View style={{
      flex: 1, backgroundColor: bgColor || colors.card, borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: colors.cardBorder,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Icon size={14} color={iconColor} strokeWidth={1.5} />
        <Text style={{ fontSize: 12, color: colors.textMuted, fontWeight: "600" }}>{label}</Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text }}>{value}</Text>
    </View>
  );
}
