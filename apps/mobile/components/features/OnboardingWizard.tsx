import { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeProvider";
import { useOrg } from "../../contexts/OrgProvider";
import { useAuth } from "../../contexts/AuthProvider";
import { supabase } from "../../lib/supabase";
import { useBCCCompliance } from "../../hooks/useBCCCompliance";
import { useSuppliers } from "../../hooks/useReceiving";
import { useOnboardingProgress } from "../../hooks/useOnboardingProgress";

import { PhaseHeader } from "./onboarding/PhaseHeader";
import { BCCSelfAssessment } from "./BCCSelfAssessment";
import { BCCSetupWizard } from "./BCCSetupWizard";
import { GreenShieldCeremony } from "./onboarding/GreenShieldCeremony";
import { TempCheckGrid } from "./TempCheckGrid";
import { OnboardingSupplierEntry } from "./onboarding/OnboardingSupplierEntry";
import { OnboardingTeamInvite } from "./onboarding/OnboardingTeamInvite";
import { OnboardingFolderPreview } from "./onboarding/OnboardingFolderPreview";

// ── Phase definitions ────────────────────────────────────────────────

interface PhaseConfig {
  key: string;
  title: string;
  subtitle: string;
  skippable: boolean;
  isInterstitial?: boolean;
}

const PHASES: PhaseConfig[] = [
  {
    key: "self_audit",
    title: "Food Safety Self-Audit",
    subtitle: "Complete the official A1-A40 BCC checklist",
    skippable: false,
  },
  {
    key: "compliance",
    title: "Compliance Setup",
    subtitle: "Licence, category, FSS, program & sections",
    skippable: false,
  },
  {
    key: "green_shield",
    title: "Green Shield Status",
    subtitle: "Your document compliance check",
    skippable: false,
    isInterstitial: true,
  },
  {
    key: "temp_setup",
    title: "Temperature Equipment",
    subtitle: "Set up your fridges, freezers & hot holds",
    skippable: true,
  },
  {
    key: "suppliers",
    title: "Approved Suppliers",
    subtitle: "Register your approved suppliers",
    skippable: true,
  },
  {
    key: "receiving",
    title: "Receiving Log",
    subtitle: "Your receiving log is ready",
    skippable: false,
    isInterstitial: true,
  },
  {
    key: "team_training",
    title: "Team & Training",
    subtitle: "Invite your team and assign training",
    skippable: true,
  },
  {
    key: "folder_preview",
    title: "Your Food Safety Folder",
    subtitle: "Everything in one place, ready for inspection",
    skippable: false,
    isInterstitial: true,
  },
];

const TOTAL_PHASES = PHASES.length;

// ── Upload helper ────────────────────────────────────────────────────

function decodeBase64(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// ── Component ────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const { colors } = useTheme();
  const router = useRouter();
  const { currentOrg, refreshOrg } = useOrg();
  const { user, isDevBypass } = useAuth();
  const orgId = currentOrg?.id;

  const {
    currentPhase: savedPhase,
    phaseData,
    updateProgress,
    completeOnboarding,
    isLoading: progressLoading,
  } = useOnboardingProgress();

  const bcc = useBCCCompliance();
  const { upsertProfile, upsertSupervisor, bulkSetSectionToggles } = bcc;

  const { suppliers } = useSuppliers();

  const [phase, setPhase] = useState(savedPhase);
  const [localPhaseData, setLocalPhaseData] = useState(phaseData);

  // Persist progress on phase change
  const goToPhase = useCallback(
    async (nextPhase: number, markCurrentComplete = true) => {
      const updated = { ...localPhaseData };
      if (markCurrentComplete) {
        updated[String(phase)] = { completed: true };
      }
      setLocalPhaseData(updated);
      setPhase(nextPhase);
      try {
        await updateProgress({
          current_phase: nextPhase,
          phase_data: updated,
        });
      } catch {}
    },
    [phase, localPhaseData, updateProgress]
  );

  const handleNext = () => {
    if (phase < TOTAL_PHASES - 1) {
      goToPhase(phase + 1);
    }
  };

  const handleBack = () => {
    if (phase > 0) {
      goToPhase(phase - 1, false);
    }
  };

  const handleSkip = () => {
    const updated = { ...localPhaseData };
    updated[String(phase)] = { completed: true, skipped: true };
    setLocalPhaseData(updated);
    if (phase < TOTAL_PHASES - 1) {
      goToPhase(phase + 1, false);
    }
  };

  const handleFinishSetup = async () => {
    try {
      await completeOnboarding();
      await refreshOrg();
      router.replace("/(app)/(tabs)/dashboard");
    } catch (e: any) {
      Alert.alert("Error", e.message || "Could not complete setup");
    }
  };

  // Upload document helper for BCCSetupWizard
  const uploadDocument = async (base64: string, folder: string): Promise<string> => {
    if (!orgId) throw new Error("No org");
    if (isDevBypass) return `https://dev-storage/${folder}/${Date.now()}.jpg`;
    const fileName = `${folder}/${orgId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("food-safety")
      .upload(fileName, decodeBase64(base64), { contentType: "image/jpeg" });
    if (error) throw error;
    const { data } = supabase.storage.from("food-safety").getPublicUrl(fileName);
    return data.publicUrl;
  };

  // Auto-create receiving log templates (Phase 5)
  const createReceivingTemplates = async () => {
    if (!orgId || !user) return 0;
    if (suppliers.length === 0) return 0;
    if (isDevBypass) return suppliers.length;

    const todayStr = new Date().toISOString().split("T")[0];
    const rows = suppliers.map((s: any) => ({
      org_id: orgId,
      log_type: "receiving",
      log_date: todayStr,
      shift: new Date().getHours() < 12 ? "AM" : "PM",
      notes: JSON.stringify({
        item_name: `Delivery from ${s.supplier_name}`,
        supplier: s.supplier_name,
        template: true,
      }),
      logged_by: user.id,
      logged_by_name: user.email,
    }));

    const { error } = await supabase.from("daily_compliance_logs").insert(rows);
    if (error) console.error("Receiving template error:", error);
    return rows.length;
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (progressLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  // ── Phase content ────────────────────────────────────────────────
  const currentPhaseConfig = PHASES[phase];
  const isLastPhase = phase === TOTAL_PHASES - 1;

  const renderPhaseContent = () => {
    switch (PHASES[phase].key) {
      case "self_audit":
        return (
          <BCCSelfAssessment
            mode="onboarding"
            onComplete={handleNext}
          />
        );

      case "compliance":
        return (
          <BCCSetupWizard
            visible
            mode="inline"
            onComplete={handleNext}
            onClose={() => {}}
            upsertProfile={upsertProfile}
            upsertSupervisor={upsertSupervisor}
            bulkSetSectionToggles={bulkSetSectionToggles}
            uploadDocument={uploadDocument}
          />
        );

      case "green_shield":
        return <GreenShieldCeremony onComplete={handleNext} />;

      case "temp_setup":
        return <TempCheckGrid />;

      case "suppliers":
        return <OnboardingSupplierEntry onComplete={handleNext} />;

      case "receiving":
        return <ReceivingInterstitial suppliers={suppliers} onCreated={createReceivingTemplates} />;

      case "team_training":
        return <OnboardingTeamInvite onComplete={handleNext} />;

      case "folder_preview":
        return <OnboardingFolderPreview onComplete={handleFinishSetup} />;

      default:
        return null;
    }
  };

  // Phases that manage their own navigation (self_audit has save button, compliance has its own back/next)
  const selfNavigating = ["self_audit", "compliance"].includes(currentPhaseConfig.key);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Phase header */}
      <PhaseHeader
        currentPhase={phase}
        totalPhases={TOTAL_PHASES}
        title={currentPhaseConfig.title}
        subtitle={currentPhaseConfig.subtitle}
      />

      {/* Phase content */}
      <View style={{ flex: 1 }}>
        {renderPhaseContent()}
      </View>

      {/* Bottom navigation (only for phases that don't self-navigate) */}
      {!selfNavigating && (
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <View style={{ flexDirection: "row", gap: 12 }}>
            {phase > 0 && (
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textSecondary }}>
                  Back
                </Text>
              </Pressable>
            )}

            <Pressable
              onPress={isLastPhase ? handleFinishSetup : handleNext}
              style={({ pressed }) => ({
                flex: phase > 0 ? 2 : 1,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isLastPhase ? "#10B981" : colors.accent,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
                {isLastPhase ? "Finish Setup" : "Continue"}
              </Text>
            </Pressable>
          </View>

          {/* Skip option */}
          {currentPhaseConfig.skippable && (
            <Pressable onPress={handleSkip} style={{ alignItems: "center", paddingTop: 12 }}>
              <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: "500" }}>
                Skip for now
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

// ── Receiving Interstitial ─────────────────────────────────────────

function ReceivingInterstitial({
  suppliers,
  onCreated,
}: {
  suppliers: any[];
  onCreated: () => Promise<number>;
}) {
  const { colors } = useTheme();
  const [count, setCount] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const create = async () => {
    setCreating(true);
    try {
      const n = await onCreated();
      setCount(n);
    } catch {}
    setCreating(false);
  };

  // Auto-create on mount
  useEffect(() => {
    create();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
      {creating ? (
        <>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={{ fontSize: 14, color: colors.textMuted, marginTop: 12 }}>
            Creating receiving log templates...
          </Text>
        </>
      ) : (
        <>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#10B981" + "20",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 32 }}>{"\u2705"}</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.text, textAlign: "center" }}>
            Receiving Log Ready
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            {count && count > 0
              ? `Created receiving log templates for ${count} supplier${count !== 1 ? "s" : ""}. You'll find them in your Receiving Log.`
              : "Your receiving log is set up and ready. Add suppliers first to auto-create templates."}
          </Text>
        </>
      )}
    </View>
  );
}
