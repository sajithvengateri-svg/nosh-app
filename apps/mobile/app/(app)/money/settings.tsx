import { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import {
  Target, Bell, ChevronDown, ChevronUp, Check,
  Database, Mail, Paperclip, Globe, FileSpreadsheet,
  Copy, Eye, EyeOff,
} from "lucide-react-native";
import { useTheme } from "../../../contexts/ThemeProvider";
import { useMoneySettings } from "../../../hooks/useMoneySettings";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { ScreenHeader } from "../../../components/ui/ScreenHeader";
import { lightTap } from "../../../lib/haptics";
import * as Clipboard from "expo-clipboard";
import type { Benchmark, AlertRule } from "../../../hooks/useMoneySettings";

export default function MoneySettings() {
  const { colors } = useTheme();
  const { benchmarks, alertRules, updateBenchmark, toggleAlertRule, isSaving } = useMoneySettings();
  const [expandedBenchmark, setExpandedBenchmark] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sources" | "benchmarks" | "alerts">("sources");

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScreenHeader title="MoneyOS Settings" />

      {/* Tabs */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
        {(["sources", "benchmarks", "alerts"] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => { lightTap(); setActiveTab(tab); }}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: 10,
              backgroundColor: activeTab === tab ? colors.accent : colors.surface,
              alignItems: "center",
            }}
          >
            <Text style={{
              fontSize: 13,
              fontWeight: "700",
              color: activeTab === tab ? "#FFFFFF" : colors.textSecondary,
              textTransform: "capitalize",
            }}>
              {tab === "sources" ? "Data Sources" : tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: 40 }}>
        {activeTab === "sources" && <DataSourcesTab colors={colors} />}
        {activeTab === "benchmarks" && (
          <>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
              Set target, warning, and critical thresholds for your key metrics.
            </Text>
            {benchmarks.map((bm) => (
              <BenchmarkRow
                key={bm.id}
                benchmark={bm}
                expanded={expandedBenchmark === bm.id}
                onToggle={() => setExpandedBenchmark(expandedBenchmark === bm.id ? null : bm.id)}
                onUpdate={(updates) => updateBenchmark(bm.id, updates)}
                colors={colors}
              />
            ))}
          </>
        )}
        {activeTab === "alerts" && (
          <>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 16 }}>
              Toggle alerts on or off. When enabled, you'll be notified when thresholds are breached.
            </Text>
            {alertRules.map((rule) => (
              <AlertRuleRow
                key={rule.id}
                rule={rule}
                onToggle={() => toggleAlertRule(rule.id)}
                colors={colors}
              />
            ))}
          </>
        )}

        {isSaving && (
          <Text style={{ fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: 8 }}>
            Saving...
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Data Sources Tab ───────────────────────────────────

function DataSourcesTab({ colors }: { colors: any }) {
  const [showApiKey, setShowApiKey] = useState(false);
  const [emailAddress] = useState("money-import@chefos.io");
  const apiKey = "ck_live_xxxxxxxxxxxxxxxxxxxx"; // Placeholder — would come from org settings

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "application/pdf",
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.[0]) {
        const file = result.assets[0];
        Alert.alert(
          "File Selected",
          `${file.name} (${(file.size! / 1024).toFixed(1)} KB)\n\nThis will be processed and imported into your financial data.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Import", onPress: () => Alert.alert("Importing", "File queued for processing. You'll be notified when complete.") },
          ]
        );
      }
    } catch {
      Alert.alert("Error", "Failed to pick file.");
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    lightTap();
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("Copied", `${label} copied to clipboard.`);
    } catch {
      Alert.alert("Error", "Failed to copy.");
    }
  };

  return (
    <>
      {/* Manual Entry */}
      <SourceCard
        icon={<Database size={18} color={colors.accent} strokeWidth={2} />}
        title="Manual Entry"
        description="Enter weekly revenue, costs, and overheads manually via Money Lite."
        status="active"
        colors={colors}
      />

      {/* API Integration */}
      <Card style={{ marginBottom: 12 }}>
        <CardContent style={{ paddingTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Globe size={18} color={colors.accent} strokeWidth={2} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, flex: 1 }}>API Integration</Text>
            <Badge variant="secondary">Coming Soon</Badge>
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
            Connect your POS, accounting, or payroll system via API to auto-sync financial data.
          </Text>

          {/* API Key */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12, marginBottom: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              API Key
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ flex: 1, fontSize: 13, fontFamily: "monospace", color: colors.text }}>
                {showApiKey ? apiKey : "ck_live_••••••••••••••••••••"}
              </Text>
              <Pressable onPress={() => { lightTap(); setShowApiKey(!showApiKey); }}>
                {showApiKey
                  ? <EyeOff size={16} color={colors.textMuted} strokeWidth={1.5} />
                  : <Eye size={16} color={colors.textMuted} strokeWidth={1.5} />
                }
              </Pressable>
              <Pressable onPress={() => copyToClipboard(apiKey, "API Key")}>
                <Copy size={16} color={colors.accent} strokeWidth={1.5} />
              </Pressable>
            </View>
          </View>

          {/* API Endpoint */}
          <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Endpoint
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ flex: 1, fontSize: 12, fontFamily: "monospace", color: colors.textSecondary }}>
                POST /functions/v1/money-import
              </Text>
              <Pressable onPress={() => copyToClipboard("https://api.chefos.io/functions/v1/money-import", "Endpoint URL")}>
                <Copy size={16} color={colors.accent} strokeWidth={1.5} />
              </Pressable>
            </View>
          </View>
        </CardContent>
      </Card>

      {/* Email Import */}
      <Card style={{ marginBottom: 12 }}>
        <CardContent style={{ paddingTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Mail size={18} color={colors.accent} strokeWidth={2} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, flex: 1 }}>Email Import</Text>
            <Badge variant="success">Active</Badge>
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
            Forward invoices, P&L reports, or bank statements to your unique email address. We'll extract the data automatically.
          </Text>

          <View style={{ backgroundColor: colors.surface, borderRadius: 8, padding: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Your Import Email
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Mail size={14} color={colors.accent} strokeWidth={1.5} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.accent }}>
                {emailAddress}
              </Text>
              <Pressable onPress={() => copyToClipboard(emailAddress, "Email address")}>
                <Copy size={16} color={colors.accent} strokeWidth={1.5} />
              </Pressable>
            </View>
          </View>

          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 8 }}>
            Accepted: PDF invoices, CSV exports, Excel files, plain text summaries
          </Text>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card style={{ marginBottom: 12 }}>
        <CardContent style={{ paddingTop: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Paperclip size={18} color={colors.accent} strokeWidth={2} />
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, flex: 1 }}>File Import</Text>
            <Badge variant="success">Active</Badge>
          </View>
          <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12 }}>
            Upload CSV, Excel, or PDF files directly. We'll parse and import the financial data.
          </Text>

          <Button variant="outline" onPress={handleFilePick}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <FileSpreadsheet size={16} color={colors.text} strokeWidth={1.5} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
                Choose File (CSV, Excel, PDF)
              </Text>
            </View>
          </Button>
        </CardContent>
      </Card>

      {/* Supported Integrations */}
      <View style={{ marginTop: 8, marginBottom: 16 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Supported Integrations
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {["Square", "Lightspeed", "Xero", "MYOB", "Deputy", "Tanda", "Tyro", "Stripe"].map((name) => (
            <View key={name} style={{ backgroundColor: colors.surface, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary }}>{name}</Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

function SourceCard({
  icon,
  title,
  description,
  status,
  colors,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: "active" | "inactive" | "coming";
  colors: any;
}) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <CardContent style={{ paddingTop: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
          {icon}
          <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text, flex: 1 }}>{title}</Text>
          <Badge variant={status === "active" ? "success" : "secondary"}>
            {status === "active" ? "Active" : status === "coming" ? "Coming Soon" : "Off"}
          </Badge>
        </View>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>{description}</Text>
      </CardContent>
    </Card>
  );
}

// ─── Benchmark & Alert Components ───────────────────────

function BenchmarkRow({
  benchmark,
  expanded,
  onToggle,
  onUpdate,
  colors,
}: {
  benchmark: Benchmark;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Benchmark>) => void;
  colors: any;
}) {
  const [target, setTarget] = useState(benchmark.target.toString());
  const [warning, setWarning] = useState(benchmark.warning.toString());
  const [critical, setCritical] = useState(benchmark.critical.toString());

  const handleSave = () => {
    lightTap();
    onUpdate({
      target: parseFloat(target) || benchmark.target,
      warning: parseFloat(warning) || benchmark.warning,
      critical: parseFloat(critical) || benchmark.critical,
    });
  };

  return (
    <Card style={{ marginBottom: 8 }}>
      <Pressable onPress={() => { lightTap(); onToggle(); }}>
        <CardContent style={{ paddingTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>{benchmark.label}</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              Target: {benchmark.target}{benchmark.unit} · Warn: {benchmark.warning}{benchmark.unit} · Crit: {benchmark.critical}{benchmark.unit}
            </Text>
          </View>
          <Badge variant="secondary">{benchmark.category}</Badge>
          {expanded ? (
            <ChevronUp size={16} color={colors.textMuted} strokeWidth={1.5} style={{ marginLeft: 8 }} />
          ) : (
            <ChevronDown size={16} color={colors.textMuted} strokeWidth={1.5} style={{ marginLeft: 8 }} />
          )}
        </CardContent>
      </Pressable>

      {expanded && (
        <CardContent>
          <View style={{ gap: 12 }}>
            <ThresholdInput label="Target" value={target} onChangeText={setTarget} unit={benchmark.unit} color={colors.success} colors={colors} />
            <ThresholdInput label="Warning" value={warning} onChangeText={setWarning} unit={benchmark.unit} color={colors.warning} colors={colors} />
            <ThresholdInput label="Critical" value={critical} onChangeText={setCritical} unit={benchmark.unit} color={colors.destructive} colors={colors} />
            <Button size="sm" onPress={handleSave}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Check size={14} color="#fff" strokeWidth={2} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Save</Text>
              </View>
            </Button>
          </View>
        </CardContent>
      )}
    </Card>
  );
}

function ThresholdInput({
  label,
  value,
  onChangeText,
  unit,
  color,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  unit: string;
  color: string;
  colors: any;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontSize: 13, color: colors.textSecondary, width: 60 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
          fontSize: 15,
          fontWeight: "600",
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      />
      <Text style={{ fontSize: 13, color: colors.textMuted, width: 20 }}>{unit}</Text>
    </View>
  );
}

function AlertRuleRow({
  rule,
  onToggle,
  colors,
}: {
  rule: AlertRule;
  onToggle: () => void;
  colors: any;
}) {
  return (
    <Card style={{ marginBottom: 8 }}>
      <CardContent style={{ paddingTop: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{rule.name}</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
            {rule.metric} {rule.condition} {rule.threshold}
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
            <Badge variant={rule.severity === "critical" ? "destructive" : rule.severity === "warning" ? "warning" : "secondary"}>
              {rule.severity}
            </Badge>
            {rule.notifyEmail && <Badge variant="outline">Email</Badge>}
            {rule.notifyPush && <Badge variant="outline">Push</Badge>}
          </View>
        </View>
        <Switch
          value={rule.enabled}
          onValueChange={() => { lightTap(); onToggle(); }}
          trackColor={{ false: colors.border, true: colors.accent }}
        />
      </CardContent>
    </Card>
  );
}
