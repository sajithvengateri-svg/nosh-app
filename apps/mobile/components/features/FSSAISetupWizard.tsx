import { useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { DatePicker } from "../ui/DatePicker";
import { Button } from "../ui/Button";
import { X, ShieldCheck } from "lucide-react-native";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FSSAISetupWizardProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  upsertProfile: (data: any) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SAFFRON = "#FF9933";

const LICENCE_TYPE_OPTIONS = [
  { label: "Registration (Turnover < \u20B912 lakh)", value: "registration" },
  { label: "State Licence (\u20B912-20 crore)", value: "state" },
  { label: "Central Licence (> \u20B920 crore)", value: "central" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FSSAISetupWizard({
  visible,
  onClose,
  onComplete,
  upsertProfile,
}: FSSAISetupWizardProps) {
  const { colors } = useTheme();

  // ---- Form state ----
  const [saving, setSaving] = useState(false);
  const [licenceNumber, setLicenceNumber] = useState("");
  const [licenceType, setLicenceType] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [fostacCertified, setFostacCertified] = useState(false);
  const [nextAuditDate, setNextAuditDate] = useState("");

  // ---- Save handler ----
  const handleSave = async () => {
    if (!licenceNumber.trim()) {
      Alert.alert("Required", "Please enter your FSSAI Licence Number.");
      return;
    }

    if (licenceNumber.trim().length !== 14 || !/^\d{14}$/.test(licenceNumber.trim())) {
      Alert.alert(
        "Invalid Licence Number",
        "FSSAI Licence Number must be exactly 14 digits."
      );
      return;
    }

    setSaving(true);
    try {
      await upsertProfile({
        fssai_licence_number: licenceNumber.trim(),
        fssai_licence_type: licenceType || null,
        fssai_licence_expiry: expiryDate || null,
        fssai_business_category: businessCategory.trim() || null,
        fssai_fostac_certified: fostacCertified,
        fssai_next_audit_date: nextAuditDate || null,
      });
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
        {/* Header */}
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
            <ShieldCheck size={22} color={SAFFRON} strokeWidth={2} />
            <Text
              style={{ fontSize: 17, fontWeight: "700", color: colors.text }}
            >
              FSSAI Compliance Setup
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

        {/* Saffron accent bar */}
        <View style={{ height: 3, backgroundColor: SAFFRON }} />

        {/* Form content */}
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 120,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ gap: 18 }}>
            {/* Licence Number */}
            <Input
              label="FSSAI Licence Number"
              value={licenceNumber}
              onChangeText={setLicenceNumber}
              placeholder="14-digit licence number"
              keyboardType="number-pad"
              maxLength={14}
            />

            {/* Licence Type */}
            <Select
              label="Licence Type"
              placeholder="Select licence type"
              value={licenceType}
              options={LICENCE_TYPE_OPTIONS}
              onValueChange={setLicenceType}
            />

            {/* Licence Expiry Date */}
            <DatePicker
              label="Licence Expiry"
              placeholder="Select expiry date"
              value={expiryDate ? new Date(expiryDate + "T00:00:00") : new Date()}
              onChange={(date) => setExpiryDate(date.toISOString().split("T")[0])}
            />

            {/* Business Category */}
            <Input
              label="Business Category"
              value={businessCategory}
              onChangeText={setBusinessCategory}
              placeholder='e.g. "Restaurant", "Caterer", "Street Food"'
              autoCapitalize="words"
            />

            {/* FOSTAC Certified Toggle */}
            <View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: colors.textSecondary,
                  marginBottom: 8,
                }}
              >
                FOSTAC Certified?
              </Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => setFostacCertified(true)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: fostacCertified
                      ? colors.successBg || "#DCFCE7"
                      : colors.surface,
                    borderWidth: 2,
                    borderColor: fostacCertified ? colors.success : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: fostacCertified
                        ? colors.success
                        : colors.textSecondary,
                    }}
                  >
                    Yes
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setFostacCertified(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: !fostacCertified
                      ? colors.destructiveBg || "#FEE2E2"
                      : colors.surface,
                    borderWidth: 2,
                    borderColor: !fostacCertified
                      ? colors.destructive
                      : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: !fostacCertified
                        ? colors.destructive
                        : colors.textSecondary,
                    }}
                  >
                    No
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Next Audit Date (optional) */}
            <DatePicker
              label="Next Audit Date (optional)"
              placeholder="Select audit date"
              value={
                nextAuditDate
                  ? new Date(nextAuditDate + "T00:00:00")
                  : new Date()
              }
              onChange={(date) =>
                setNextAuditDate(date.toISOString().split("T")[0])
              }
            />
          </View>
        </ScrollView>

        {/* Bottom save button */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <Button
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            size="lg"
            style={{ backgroundColor: SAFFRON }}
            textStyle={{ color: "#FFFFFF" }}
          >
            Save FSSAI Profile
          </Button>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
