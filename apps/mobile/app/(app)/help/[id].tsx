import { useEffect, useRef, useMemo } from "react";
import { View, Text, Pressable, ScrollView, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../../../contexts/ThemeProvider";
import {
  ChevronLeft, CheckCircle, AlertTriangle, ShieldCheck, Thermometer,
  MapPin, Camera, BookOpen, Plus, Sparkles, PenLine, Package,
  UtensilsCrossed, ClipboardList, Users, Repeat, Receipt, FileText,
  Play, ListChecks, Calendar, LayoutGrid, ShoppingCart, Search,
  List, Archive, ScanLine, HeartPulse, Droplets, Truck, Flame,
  type LucideIcon,
} from "lucide-react-native";
import { getHelpItem, getItemsByCategory, APP_VERSION, type HelpItem, type HelpWorkflow } from "../../../lib/help/helpData";

const STEP_ICONS: Record<string, LucideIcon> = {
  ShieldCheck, Thermometer, MapPin, Camera, AlertTriangle, CheckCircle,
  BookOpen, Plus, Sparkles, PenLine, Package, UtensilsCrossed,
  ClipboardList, Users, Repeat, Receipt, FileText, Play,
  ListChecks, Calendar, LayoutGrid, ShoppingCart, Search, List, Archive, ScanLine,
  HeartPulse, Droplets, Truck, Flame,
};

function getStepIcon(name: string): LucideIcon {
  return STEP_ICONS[name] || CheckCircle;
}

// ── Animated Workflow Stepper ────────────────────────────

function WorkflowStepper({ workflow, colors }: { workflow: HelpWorkflow; colors: any }) {
  const router = useRouter();
  const stepAnims = useRef(workflow.steps.map(() => new Animated.Value(0))).current;
  const lineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stagger step animations
    const animations = stepAnims.map((anim, i) =>
      Animated.timing(anim, { toValue: 1, duration: 400, delay: i * 150, useNativeDriver: true })
    );
    const lineAnimation = Animated.timing(lineAnim, {
      toValue: 1, duration: workflow.steps.length * 150 + 400, useNativeDriver: false,
    });

    Animated.parallel([Animated.stagger(150, animations), lineAnimation]).start();
  }, []);

  const totalHeight = workflow.steps.length * 120;

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: workflow.color + "15", alignItems: "center", justifyContent: "center" }}>
          {(() => { const Icon = STEP_ICONS[workflow.icon] || CheckCircle; return <Icon size={24} color={workflow.color} strokeWidth={1.8} />; })()}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>{workflow.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
            <View style={{ backgroundColor: workflow.color + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 11, fontWeight: "700", color: workflow.color }}>{workflow.steps.length} steps</Text>
            </View>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>Workflow</Text>
          </View>
        </View>
      </View>

      <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginBottom: 24 }}>
        {workflow.description}
      </Text>

      {/* Stepper */}
      <View style={{ paddingLeft: 4 }}>
        {workflow.steps.map((step, i) => {
          const StepIcon = getStepIcon(step.icon);
          const isLast = i === workflow.steps.length - 1;

          return (
            <Animated.View
              key={i}
              style={{
                flexDirection: "row",
                opacity: stepAnims[i],
                transform: [{ translateY: stepAnims[i].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                marginBottom: isLast ? 0 : 16,
              }}
            >
              {/* Left rail — circle + line */}
              <View style={{ width: 40, alignItems: "center" }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 16, backgroundColor: workflow.color + "20",
                  borderWidth: 2, borderColor: workflow.color, alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: workflow.color }}>{i + 1}</Text>
                </View>
                {!isLast && (
                  <View style={{ width: 2, flex: 1, backgroundColor: workflow.color + "30", marginTop: 4, marginBottom: -8 }} />
                )}
              </View>

              {/* Right content */}
              <View style={{ flex: 1, marginLeft: 12, paddingBottom: isLast ? 0 : 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <StepIcon size={16} color={workflow.color} strokeWidth={1.8} />
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>{step.title}</Text>
                </View>
                <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 21 }}>{step.description}</Text>
                {step.tip && (
                  <View style={{ flexDirection: "row", backgroundColor: colors.warningBg || "#FEF3C7", borderRadius: 10, padding: 10, marginTop: 8, gap: 8 }}>
                    <AlertTriangle size={14} color={colors.warning || "#D97706"} strokeWidth={1.5} style={{ marginTop: 2 }} />
                    <Text style={{ flex: 1, fontSize: 12, color: colors.warning || "#92400E", lineHeight: 18 }}>{step.tip}</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* Try it now button */}
      {workflow.navigateTo && (
        <Pressable
          onPress={() => router.push(workflow.navigateTo as any)}
          style={({ pressed }) => ({
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
            backgroundColor: pressed ? workflow.color : workflow.color + "E0",
            borderRadius: 14, paddingVertical: 14, marginTop: 28,
          })}
        >
          <Play size={18} color="#FFFFFF" strokeWidth={2} fill="#FFFFFF" />
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>Try it now</Text>
        </Pressable>
      )}

      {/* Version */}
      <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: "center", marginTop: 20 }}>
        Written for v{workflow.appVersion}
      </Text>
    </View>
  );
}

// ── Article Detail ───────────────────────────────────────

function ArticleDetail({ article, colors }: { article: HelpItem & { type: "article" }; colors: any }) {
  const router = useRouter();

  const relatedWorkflows = useMemo(() => {
    return getItemsByCategory(article.category).filter((i) => i.type === "workflow");
  }, [article.category]);

  return (
    <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: article.color + "15", alignItems: "center", justifyContent: "center" }}>
          {(() => { const Icon = STEP_ICONS[article.icon] || CheckCircle; return <Icon size={24} color={article.color} strokeWidth={1.8} />; })()}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.text }}>{article.title}</Text>
          <View style={{ backgroundColor: article.color + "20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginTop: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: article.color }}>
              {article.category.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={{ gap: 14 }}>
        {article.content.map((paragraph, i) => (
          <Text key={i} style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 23 }}>
            {paragraph}
          </Text>
        ))}
      </View>

      {/* Related workflows */}
      {relatedWorkflows.length > 0 && (
        <View style={{ marginTop: 28 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            Related Workflows
          </Text>
          {relatedWorkflows.map((wf) => {
            if (wf.type !== "workflow") return null;
            const WfIcon = STEP_ICONS[wf.icon] || CheckCircle;
            return (
              <Pressable
                key={wf.id}
                onPress={() => router.push({ pathname: "/(app)/help/[id]", params: { id: wf.id } })}
                style={({ pressed }) => ({
                  flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12,
                  backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, marginBottom: 8,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: wf.color + "15", alignItems: "center", justifyContent: "center" }}>
                  <WfIcon size={18} color={wf.color} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>{wf.title}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted }}>{wf.steps.length} steps</Text>
                </View>
                <ChevronLeft size={14} color={colors.textMuted} strokeWidth={1.5} style={{ transform: [{ rotate: "180deg" }] }} />
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Version */}
      <Text style={{ fontSize: 11, color: colors.textMuted, textAlign: "center", marginTop: 24 }}>
        Written for v{article.appVersion}
      </Text>
    </View>
  );
}

// ── Main Screen ──────────────────────────────────────────

export default function HelpDetail() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const item = useMemo(() => (id ? getHelpItem(id) : undefined), [id]);

  if (!item) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 16, color: colors.textMuted }}>Article not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.accent }}>Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 }}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 4 }}>
          <ChevronLeft size={22} color={colors.text} strokeWidth={2} />
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text, flex: 1 }} numberOfLines={1}>
          {item.type === "workflow" ? "Workflow" : "Help Article"}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {item.type === "workflow" ? (
          <WorkflowStepper workflow={item} colors={colors} />
        ) : (
          <ArticleDetail article={item} colors={colors} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
