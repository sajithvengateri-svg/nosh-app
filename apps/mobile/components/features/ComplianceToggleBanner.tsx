import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ShieldCheck } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { ComplianceProvider, useComplianceContext } from "../../contexts/ComplianceProvider";
import { Badge } from "../ui/Badge";

/**
 * Self-contained compliance toggle banner.
 * Wraps itself in ComplianceProvider so it can be dropped anywhere.
 * Shows BCC shield + status + enable/active button.
 */
export function ComplianceToggleBanner() {
  return (
    <ComplianceProvider>
      <ComplianceToggleBannerInner />
    </ComplianceProvider>
  );
}

function ComplianceToggleBannerInner() {
  const router = useRouter();
  const { colors } = useTheme();
  const { config, profile, complianceScore, loading } = useComplianceContext();

  if (loading) return null;

  const accentColor = config.labels.accentColor;
  const isActive = !!profile;

  return (
    <Pressable
      onPress={() => router.push("/(app)/food-safety" as any)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: isActive ? accentColor + "10" : colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: isActive ? accentColor + "20" : colors.border,
      }}
    >
      <ShieldCheck size={18} color={isActive ? accentColor : colors.textMuted} strokeWidth={1.5} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: isActive ? accentColor : colors.text }}>
          {config.labels.frameworkShort} Compliance
        </Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary }}>
          {isActive ? "Tap to manage compliance" : "Tap to enable compliance mode"}
        </Text>
      </View>

      {isActive && complianceScore != null && complianceScore > 0 && (
        <View style={{ backgroundColor: accentColor + "15", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: accentColor }}>
            {config.scoring.model === "star_rating" ? `${complianceScore}\u2605` : `${complianceScore}%`}
          </Text>
        </View>
      )}

      {isActive ? (
        <Badge variant="success">Active</Badge>
      ) : (
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: colors.accentBg }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent }}>Enable</Text>
        </View>
      )}
    </Pressable>
  );
}
