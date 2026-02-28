import { useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { Input } from "../ui/Input";
import { ImagePicker } from "../ui/ImagePicker";
import { Select } from "../ui/Select";
import { DatePicker } from "../ui/DatePicker";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { X, ShieldCheck } from "lucide-react-native";
import { useComplianceContext } from "../../contexts/ComplianceProvider";
import type { WizardStep, ProfileFieldConfig, SectionDefinition } from "@queitos/shared";
import { isHomeCook as checkIsHomeCook } from "@queitos/shared";
import Constants from "expo-constants";
import type { AppVariant } from "@queitos/shared";

// ── Props ──────────────────────────────────────────────────────────────

interface SetupWizardProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  /** Render inline (no Modal wrapper) for embedding in the onboarding wizard */
  mode?: "modal" | "inline";
  /** Upload a document and return a public URL */
  uploadDocument?: (base64: string, folder: string) => Promise<string>;
}

// ── Helpers ────────────────────────────────────────────────────────────

function addYears(dateStr: string, years: number): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    date.setFullYear(date.getFullYear() + years);
    return date.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;

// ── Component ──────────────────────────────────────────────────────────

export function SetupWizard({
  visible,
  onClose,
  onComplete,
  mode = "modal",
  uploadDocument,
}: SetupWizardProps) {
  const { colors } = useTheme();
  const { config, upsertProfile, upsertSupervisor, bulkSetSectionToggles } = useComplianceContext();

  const accentColor = config.labels.accentColor;
  const wizardSteps = config.wizardSteps;
  const TOTAL_STEPS = wizardSteps.length;
  const isHomeCookVariant = checkIsHomeCook(APP_VARIANT);

  // ── Wizard state ──────────────────────────────────────────────
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // ── Dynamic form state (keyed by field key) ───────────────────
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  // ── Section toggles (for the sections step) ───────────────────
  const [sectionToggles, setSectionToggles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    config.sections.forEach((s) => {
      if (isHomeCookVariant && s.homeCookDefault !== undefined) {
        initial[s.key] = s.homeCookDefault;
      } else {
        initial[s.key] = s.defaultOn;
      }
    });
    return initial;
  });

  const setField = (key: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  // ── Navigation ────────────────────────────────────────────────
  const canGoNext = step < TOTAL_STEPS - 1;
  const canGoBack = step > 0;
  const isLastStep = step === TOTAL_STEPS - 1;
  const progress = (step + 1) / TOTAL_STEPS;

  const handleNext = () => {
    if (canGoNext) setStep((s) => s + 1);
  };
  const handleBack = () => {
    if (canGoBack) setStep((s) => s - 1);
  };

  // ── Finish / Save ─────────────────────────────────────────────
  const handleFinish = async () => {
    setSaving(true);
    try {
      // 1. Build profile payload from all non-FSS fields
      const profilePayload: Record<string, any> = {};
      const fssPayload: Record<string, any> = {};

      for (const ws of wizardSteps) {
        if (ws.key === "fss") {
          // FSS fields go to supervisor upsert
          for (const field of ws.fields) {
            if (formValues[field.key] !== undefined) {
              fssPayload[field.key] = formValues[field.key];
            }
          }
        } else if (ws.key === "sections") {
          // Handled separately
        } else {
          for (const field of ws.fields) {
            if (formValues[field.key] !== undefined) {
              profilePayload[field.key] = formValues[field.key];
            }
          }
        }
      }

      // Upsert profile
      if (Object.keys(profilePayload).length > 0) {
        await upsertProfile(profilePayload);
      }

      // Upsert supervisor (if FSS step exists and has name)
      if (config.features.hasSupervisors && fssPayload.name?.trim()) {
        // Auto-compute certificate expiry from date (5 years) if available
        if (fssPayload.certificate_date && !fssPayload.certificate_expiry) {
          fssPayload.certificate_expiry = addYears(fssPayload.certificate_date, 5);
        }
        fssPayload.is_primary = true;
        await upsertSupervisor(fssPayload);
      }

      // Bulk set section toggles (if sections step exists)
      const hasSectionsStep = wizardSteps.some((ws) => ws.key === "sections");
      if (hasSectionsStep) {
        await bulkSetSectionToggles(sectionToggles);
      }

      onComplete();
    } catch (err: any) {
      Alert.alert("Save Error", err?.message || "Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Render a single field ─────────────────────────────────────
  const renderField = (field: ProfileFieldConfig) => {
    const value = formValues[field.key];

    switch (field.type) {
      case "text":
        return (
          <Input
            key={field.key}
            label={field.label}
            value={value ?? ""}
            onChangeText={(v) => setField(field.key, v)}
            placeholder={field.placeholder || field.label}
            autoCapitalize={field.key.includes("number") || field.key.includes("licence") ? "characters" : "words"}
          />
        );

      case "date":
        return (
          <DatePicker
            key={field.key}
            label={field.label}
            placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
            value={value ? new Date(value + "T00:00:00") : new Date()}
            onChange={(date) => setField(field.key, date.toISOString().split("T")[0])}
          />
        );

      case "boolean":
        return (
          <View
            key={field.key}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text, flex: 1, marginRight: 12 }}>
              {field.label}
            </Text>
            <Switch
              value={!!value}
              onValueChange={(v) => setField(field.key, v)}
              trackColor={{ false: colors.border, true: accentColor }}
              thumbColor="#FFFFFF"
            />
          </View>
        );

      case "select":
        return (
          <Select
            key={field.key}
            label={field.label}
            placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`}
            value={value ?? ""}
            options={field.options || []}
            onValueChange={(v) => setField(field.key, v)}
          />
        );

      default:
        return null;
    }
  };

  // ── Render current step ───────────────────────────────────────
  const renderCurrentStep = () => {
    const currentStep = wizardSteps[step];
    if (!currentStep) return null;

    // Sections step — special handling for section toggles
    if (currentStep.key === "sections") {
      return (
        <View style={{ gap: 8 }}>
          {config.sections.map((section) => (
            <View
              key={section.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: colors.surface,
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "500", color: colors.text, flex: 1, marginRight: 12 }}>
                {section.label}
              </Text>
              <Switch
                value={sectionToggles[section.key] ?? false}
                onValueChange={(val) => setSectionToggles((prev) => ({ ...prev, [section.key]: val }))}
                trackColor={{ false: colors.border, true: accentColor }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>
      );
    }

    // Normal field-based step
    return (
      <View style={{ gap: 16 }}>
        {currentStep.fields.map(renderField)}
      </View>
    );
  };

  // ── Inner content ─────────────────────────────────────────────
  const renderInner = () => (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header (only in modal mode) */}
      {mode === "modal" && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <ShieldCheck size={22} color={accentColor} strokeWidth={2} />
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
              {config.labels.frameworkName} Setup
            </Text>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <X size={18} color={colors.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>
      )}

      {/* Progress bar */}
      <View style={{ height: 4, backgroundColor: colors.border }}>
        <View
          style={{
            height: 4,
            width: `${progress * 100}%`,
            backgroundColor: accentColor,
            borderRadius: 2,
          }}
        />
      </View>

      {/* Step indicator */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: "600",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 4,
          }}
        >
          Step {step + 1} of {TOTAL_STEPS}
        </Text>
        <Text style={{ fontSize: 22, fontWeight: "700", color: colors.text, marginBottom: 4 }}>
          {wizardSteps[step]?.title}
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20, marginBottom: 8 }}>
          {wizardSteps[step]?.subtitle}
        </Text>
      </View>

      {/* Step content */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Bottom navigation */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.background,
          flexDirection: "row",
          gap: 12,
        }}
      >
        {canGoBack && (
          <Pressable
            onPress={handleBack}
            disabled={saving}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              opacity: pressed ? 0.7 : saving ? 0.5 : 1,
            })}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textSecondary }}>
              Back
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={isLastStep ? handleFinish : handleNext}
          disabled={saving}
          style={({ pressed }) => ({
            flex: canGoBack ? 2 : 1,
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: accentColor,
            opacity: pressed ? 0.85 : saving ? 0.6 : 1,
            flexDirection: "row",
            gap: 8,
          })}
        >
          {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
            {saving ? "Saving..." : isLastStep ? "Finish" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // ── Main render ───────────────────────────────────────────────
  if (mode === "inline") {
    return renderInner();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          {renderInner()}
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
