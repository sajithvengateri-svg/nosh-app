import { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeProvider";
import { useFSSAICompliance, FSSAI_SECTIONS, FSSAI_ALL_ITEMS } from "../../hooks/useFSSAICompliance";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Send } from "lucide-react-native";

export default function FSSAISelfAssessment() {
  const { colors } = useTheme();
  const { complianceScore, submitAssessment } = useFSSAICompliance();
  const [responses, setResponses] = useState<Record<string, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(FSSAI_SECTIONS.map((s) => [s.key, true]))
  );
  const [submitting, setSubmitting] = useState(false);

  const toggleItem = useCallback((key: string) => {
    setResponses((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const answeredCount = Object.keys(responses).length;
  const passedCount = Object.values(responses).filter(Boolean).length;
  const totalItems = FSSAI_ALL_ITEMS.length;
  const progressPct = totalItems > 0 ? Math.round((answeredCount / totalItems) * 100) : 0;
  const scorePct = answeredCount > 0 ? Math.round((passedCount / answeredCount) * 100) : 0;

  const handleSubmit = async () => {
    if (answeredCount < totalItems) {
      Alert.alert(
        "Incomplete Assessment",
        `You've answered ${answeredCount} of ${totalItems} items. Answer all items before submitting.`
      );
      return;
    }
    setSubmitting(true);
    try {
      await submitAssessment(responses);
      Alert.alert("Assessment Submitted", `Your FSSAI compliance score: ${scorePct}%`);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to submit");
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.text, marginBottom: 4 }}>
          FSSAI Self-Assessment
        </Text>
        <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 16 }}>
          Schedule 4 — Food Safety Audit Checklist
        </Text>

        {/* Progress Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
              Progress: {answeredCount}/{totalItems}
            </Text>
            <Text style={{ fontSize: 14, fontWeight: "700", color: scorePct >= 80 ? "#10B981" : scorePct >= 50 ? "#F59E0B" : "#EF4444" }}>
              Score: {scorePct}%
            </Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border }}>
            <View
              style={{
                height: 8,
                borderRadius: 4,
                width: `${progressPct}%`,
                backgroundColor: "#FF9933",
              }}
            />
          </View>
        </View>

        {/* Sections */}
        {FSSAI_SECTIONS.map((section) => {
          const expanded = expandedSections[section.key];
          const sectionPassed = section.items.filter((i) => responses[i.key]).length;
          const sectionTotal = section.items.length;

          return (
            <View
              key={section.key}
              style={{
                backgroundColor: colors.card,
                borderRadius: 12,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: colors.border,
                overflow: "hidden",
              }}
            >
              <Pressable
                onPress={() => toggleSection(section.key)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 14,
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
                    {section.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                    {sectionPassed}/{sectionTotal} passed
                  </Text>
                </View>
                {expanded ? (
                  <ChevronUp size={20} color={colors.textMuted} />
                ) : (
                  <ChevronDown size={20} color={colors.textMuted} />
                )}
              </Pressable>

              {expanded &&
                section.items.map((item) => {
                  const checked = !!responses[item.key];
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => toggleItem(item.key)}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.7 : 1,
                        flexDirection: "row",
                        alignItems: "flex-start",
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                      })}
                    >
                      {checked ? (
                        <CheckCircle2 size={20} color="#10B981" style={{ marginTop: 1, marginRight: 10 }} />
                      ) : (
                        <Circle size={20} color={colors.textMuted} style={{ marginTop: 1, marginRight: 10 }} />
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: "#FF9933", marginBottom: 2 }}>
                          {item.key}
                        </Text>
                        <Text style={{ fontSize: 13, color: checked ? colors.text : colors.textMuted, lineHeight: 18 }}>
                          {item.text}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
            </View>
          );
        })}
      </ScrollView>

      {/* Submit Button */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          paddingBottom: 32,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          style={{
            backgroundColor: "#FF9933",
            borderRadius: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            opacity: submitting ? 0.6 : 1,
          }}
        >
          <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
            {submitting ? "Submitting..." : "Submit Assessment"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
