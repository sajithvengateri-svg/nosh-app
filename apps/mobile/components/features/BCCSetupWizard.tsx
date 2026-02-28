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
} from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { Input } from "../ui/Input";
import { ImagePicker } from "../ui/ImagePicker";
import { Badge } from "../ui/Badge";
import { BCC_SECTIONS } from "../../hooks/useBCCCompliance";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BCCSetupWizardProps {
  visible: boolean;
  onComplete: () => void;
  onClose: () => void;
  isHomeCook?: boolean;
  upsertProfile: (data: any) => Promise<void>;
  upsertSupervisor: (data: any) => Promise<void>;
  bulkSetSectionToggles: (toggles: Record<string, boolean>) => Promise<void>;
  /** Render inline (no Modal wrapper) for embedding in the onboarding wizard */
  mode?: "modal" | "inline";
  /** Upload a document and return a public URL */
  uploadDocument?: (base64: string, folder: string) => Promise<string>;
}

const TOTAL_STEPS = 5;

const STEP_META: { title: string; subtitle: string }[] = [
  {
    title: "Licence Details",
    subtitle: "Enter your BCC food business licence information",
  },
  {
    title: "Business Category",
    subtitle: "Select your category under FSANZ Standard 3.2.2A",
  },
  {
    title: "Food Safety Supervisor",
    subtitle: "Enter your primary FSS details and certificate info",
  },
  {
    title: "Food Safety Program",
    subtitle: "Is your food safety program accredited?",
  },
  {
    title: "Compliance Sections",
    subtitle: "Choose which BCC compliance sections to enable",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BCCSetupWizard({
  visible,
  onComplete,
  onClose,
  isHomeCook = false,
  upsertProfile,
  upsertSupervisor,
  bulkSetSectionToggles,
  mode = "modal",
  uploadDocument,
}: BCCSetupWizardProps) {
  const { colors } = useTheme();

  // ---- Wizard navigation ----
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // ---- Step 0: Licence ----
  const [licenceNumber, setLicenceNumber] = useState("");
  const [licenceExpiry, setLicenceExpiry] = useState("");
  const [licenceDisplayed, setLicenceDisplayed] = useState(false);
  const [licenceDocUrl, setLicenceDocUrl] = useState<string | null>(null);
  const [licenceDocUploading, setLicenceDocUploading] = useState(false);

  // ---- Step 1: Category ----
  const [businessCategory, setBusinessCategory] = useState<
    "category_1" | "category_2"
  >("category_1");

  // ---- Step 2: FSS ----
  const [fssName, setFssName] = useState("");
  const [fssCertNumber, setFssCertNumber] = useState("");
  const [fssCertDate, setFssCertDate] = useState("");
  const [fssNotifiedCouncil, setFssNotifiedCouncil] = useState(false);
  const [fssCertDocUrl, setFssCertDocUrl] = useState<string | null>(null);
  const [fssCertDocUploading, setFssCertDocUploading] = useState(false);

  const fssCertExpiry = useMemo(() => {
    if (!fssCertDate) return "";
    return addYears(fssCertDate, 5);
  }, [fssCertDate]);

  // ---- Step 3: Program ----
  const [programAccredited, setProgramAccredited] = useState(false);
  const [auditorName, setAuditorName] = useState("");

  // ---- Step 4: Sections ----
  const [sectionToggles, setSectionToggles] = useState<
    Record<string, boolean>
  >(() => {
    const initial: Record<string, boolean> = {};
    BCC_SECTIONS.forEach((s) => {
      if (isHomeCook && s.homeCookDefault !== undefined) {
        initial[s.key] = s.homeCookDefault;
      } else {
        initial[s.key] = s.defaultOn;
      }
    });
    return initial;
  });

  // ---- Navigation ----
  const canGoNext = step < TOTAL_STEPS - 1;
  const canGoBack = step > 0;
  const isLastStep = step === TOTAL_STEPS - 1;

  const handleNext = () => {
    if (canGoNext) setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (canGoBack) setStep((s) => s - 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // 1. Upsert compliance profile
      await upsertProfile({
        bcc_licence_number: licenceNumber || null,
        licence_expiry: licenceExpiry || null,
        licence_displayed: licenceDisplayed,
        business_category: businessCategory,
        food_safety_program_accredited: programAccredited,
        food_safety_program_auditor: programAccredited
          ? auditorName || null
          : null,
        ...(licenceDocUrl ? { licence_document_url: licenceDocUrl } : {}),
      });

      // 2. Upsert FSS (only if name provided)
      if (fssName.trim()) {
        await upsertSupervisor({
          name: fssName.trim(),
          certificate_number: fssCertNumber || null,
          certificate_date: fssCertDate || null,
          certificate_expiry: fssCertExpiry || null,
          notified_council: fssNotifiedCouncil,
          is_primary: true,
          ...(fssCertDocUrl ? { certificate_document_url: fssCertDocUrl } : {}),
        });
      }

      // 3. Bulk set section toggles
      await bulkSetSectionToggles(sectionToggles);

      // 4. Signal completion
      onComplete();
    } catch (err: any) {
      Alert.alert(
        "Save Error",
        err?.message || "Something went wrong while saving. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ---- Progress bar ----
  const progress = (step + 1) / TOTAL_STEPS;

  // ---- Step renderers ----

  const handleLicenceDocUpload = async (base64: string) => {
    if (!uploadDocument) return;
    setLicenceDocUploading(true);
    try {
      const url = await uploadDocument(base64, "licences");
      setLicenceDocUrl(url);
    } catch (e: any) {
      Alert.alert("Upload Failed", e.message || "Could not upload licence document");
    } finally {
      setLicenceDocUploading(false);
    }
  };

  const handleFssCertDocUpload = async (base64: string) => {
    if (!uploadDocument) return;
    setFssCertDocUploading(true);
    try {
      const url = await uploadDocument(base64, "fss-certs");
      setFssCertDocUrl(url);
    } catch (e: any) {
      Alert.alert("Upload Failed", e.message || "Could not upload certificate");
    } finally {
      setFssCertDocUploading(false);
    }
  };

  const renderStepLicence = () => (
    <View style={{ gap: 16 }}>
      <Input
        label="BCC Licence Number"
        value={licenceNumber}
        onChangeText={setLicenceNumber}
        placeholder="e.g. BCC-12345"
        autoCapitalize="characters"
      />
      <Input
        label="Licence Expiry Date"
        value={licenceExpiry}
        onChangeText={setLicenceExpiry}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
      />
      <View
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
        <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>
          Licence Displayed Prominently?
        </Text>
        <Switch
          value={licenceDisplayed}
          onValueChange={setLicenceDisplayed}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Document upload */}
      {uploadDocument && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>
            Upload Food Business Licence
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            Scan or photograph your BCC licence document
          </Text>
          {licenceDocUrl ? (
            <View style={{ gap: 8 }}>
              <Badge variant="success">Document Uploaded</Badge>
              <Pressable onPress={() => setLicenceDocUrl(null)}>
                <Text style={{ fontSize: 12, color: colors.accent, fontWeight: "600" }}>Re-upload</Text>
              </Pressable>
            </View>
          ) : (
            <ImagePicker
              onImageSelected={(base64) => handleLicenceDocUpload(base64)}
              buttonText={licenceDocUploading ? "Uploading..." : "Scan Licence Document"}
              showPreview
            />
          )}
        </View>
      )}
    </View>
  );

  const renderStepCategory = () => {
    const categories: {
      value: "category_1" | "category_2";
      title: string;
      description: string;
    }[] = [
      {
        value: "category_1",
        title: "Category 1",
        description:
          "Full Evidence Tool \u2014 for businesses that need comprehensive food safety documentation",
      },
      {
        value: "category_2",
        title: "Category 2",
        description:
          "FSS + Training \u2014 for businesses that need Food Safety Supervisor and training records only",
      },
    ];

    return (
      <View style={{ gap: 14 }}>
        <Text
          style={{
            fontSize: 12,
            color: colors.textMuted,
            fontWeight: "500",
            textAlign: "center",
          }}
        >
          Reference: FSANZ Standard 3.2.2A
        </Text>
        {categories.map((cat) => {
          const selected = businessCategory === cat.value;
          return (
            <Pressable
              key={cat.value}
              onPress={() => setBusinessCategory(cat.value)}
              style={({ pressed }) => ({
                backgroundColor: selected ? colors.accentBg : colors.card,
                borderRadius: 16,
                padding: 20,
                borderWidth: 2,
                borderColor: selected ? colors.accent : colors.border,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: selected ? colors.accent : colors.text,
                  }}
                >
                  {cat.title}
                </Text>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: selected ? colors.accent : colors.border,
                    backgroundColor: selected ? colors.accent : "transparent",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selected && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: "#FFFFFF",
                      }}
                    />
                  )}
                </View>
              </View>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  lineHeight: 20,
                }}
              >
                {cat.description}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderStepFSS = () => (
    <View style={{ gap: 16 }}>
      <Input
        label="Supervisor Name"
        value={fssName}
        onChangeText={setFssName}
        placeholder="Full name of Food Safety Supervisor"
        autoCapitalize="words"
      />
      <Input
        label="RTO Certificate Number"
        value={fssCertNumber}
        onChangeText={setFssCertNumber}
        placeholder="e.g. FSS-2024-0001"
        autoCapitalize="characters"
      />
      <Input
        label="Certificate Date"
        value={fssCertDate}
        onChangeText={setFssCertDate}
        placeholder="YYYY-MM-DD"
        autoCapitalize="none"
      />
      {fssCertExpiry !== "" && (
        <View
          style={{
            backgroundColor: colors.successBg,
            borderRadius: 12,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "600",
              color: colors.success,
            }}
          >
            Certificate Expiry (auto):
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: colors.success,
            }}
          >
            {fssCertExpiry}
          </Text>
        </View>
      )}
      <View
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
        <Text style={{ fontSize: 15, fontWeight: "500", color: colors.text }}>
          Notified to Council?
        </Text>
        <Switch
          value={fssNotifiedCouncil}
          onValueChange={setFssNotifiedCouncil}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Certificate upload */}
      {uploadDocument && (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.textSecondary }}>
            Upload FSS Certificate
          </Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            Scan or photograph the RTO-issued certificate
          </Text>
          {fssCertDocUrl ? (
            <View style={{ gap: 8 }}>
              <Badge variant="success">Certificate Uploaded</Badge>
              <Pressable onPress={() => setFssCertDocUrl(null)}>
                <Text style={{ fontSize: 12, color: colors.accent, fontWeight: "600" }}>Re-upload</Text>
              </Pressable>
            </View>
          ) : (
            <ImagePicker
              onImageSelected={(base64) => handleFssCertDocUpload(base64)}
              buttonText={fssCertDocUploading ? "Uploading..." : "Scan Certificate"}
              showPreview
            />
          )}
        </View>
      )}
    </View>
  );

  const renderStepProgram = () => (
    <View style={{ gap: 16 }}>
      <View
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
        <Text
          style={{
            fontSize: 15,
            fontWeight: "500",
            color: colors.text,
            flex: 1,
            marginRight: 12,
          }}
        >
          Accredited Food Safety Program?
        </Text>
        <Switch
          value={programAccredited}
          onValueChange={setProgramAccredited}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor="#FFFFFF"
        />
      </View>
      {programAccredited && (
        <Input
          label="Auditor Name"
          value={auditorName}
          onChangeText={setAuditorName}
          placeholder="Name of accredited auditor"
          autoCapitalize="words"
        />
      )}
    </View>
  );

  const renderStepSections = () => (
    <View style={{ gap: 8 }}>
      {BCC_SECTIONS.map((section) => (
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
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: colors.text,
              flex: 1,
              marginRight: 12,
            }}
          >
            {section.label}
          </Text>
          <Switch
            value={sectionToggles[section.key] ?? false}
            onValueChange={(val) =>
              setSectionToggles((prev) => ({ ...prev, [section.key]: val }))
            }
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor="#FFFFFF"
          />
        </View>
      ))}
    </View>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 0:
        return renderStepLicence();
      case 1:
        return renderStepCategory();
      case 2:
        return renderStepFSS();
      case 3:
        return renderStepProgram();
      case 4:
        return renderStepSections();
      default:
        return null;
    }
  };

  // ---- Inner content (shared between modal and inline) ----
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
          <View style={{ width: 36 }} />
          <Text style={{ fontSize: 17, fontWeight: "700", color: colors.text }}>
            BCC Eat Safe Setup
          </Text>
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
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: colors.textSecondary,
              }}
            >
              {"\u2715"}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Progress bar */}
      <View
        style={{
          height: 4,
          backgroundColor: colors.border,
        }}
      >
        <View
          style={{
            height: 4,
            width: `${progress * 100}%`,
            backgroundColor: colors.warning,
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
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: colors.text,
            marginBottom: 4,
          }}
        >
          {STEP_META[step].title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: colors.textSecondary,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          {STEP_META[step].subtitle}
        </Text>
      </View>

      {/* Step content */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 120,
        }}
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
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.textSecondary,
              }}
            >
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
            backgroundColor: colors.accent,
            opacity: pressed ? 0.85 : saving ? 0.6 : 1,
            flexDirection: "row",
            gap: 8,
          })}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : null}
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
            {saving ? "Saving..." : isLastStep ? "Finish" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // ---- Main render ----
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
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {renderInner()}
      </SafeAreaView>
    </Modal>
  );
}
