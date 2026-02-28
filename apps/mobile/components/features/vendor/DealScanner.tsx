import { useState, useRef } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { CheckCircle, XCircle, Keyboard, ScanLine } from "lucide-react-native";
import { useTheme } from "../../../contexts/ThemeProvider";
import {
  useValidateDealCode,
  useConfirmRedemption,
  type DealCodeInfo,
} from "../../../hooks/useVendorDeals";
import { DealScanConfirm } from "./DealScanConfirm";
import { lightTap, successNotification } from "../../../lib/haptics";

type ScanState =
  | "scanning"
  | "validating"
  | "confirming"
  | "redeeming"
  | "success"
  | "error";

// Parse QR data — supports URL format, legacy JSON, and plain 8-char codes
function parseQRData(data: string): string | null {
  // URL: https://nosh.app/r/A8X4N2P9
  const urlMatch = data.match(/nosh\.app\/r\/([A-Z2-9]{8})/i);
  if (urlMatch) return urlMatch[1].toUpperCase();

  // Legacy JSON: { redemption_id, deal_id, qr_code_token }
  try {
    const json = JSON.parse(data);
    if (json.qr_code_token) return json.qr_code_token;
    if (json.code) return json.code.toUpperCase();
  } catch {
    // Not JSON, continue
  }

  // Plain 8-char code (with optional dash)
  const cleaned = data.replace(/-/g, "").toUpperCase().trim();
  if (/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/.test(cleaned)) return cleaned;

  return null;
}

export function DealScanner() {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const validateCode = useValidateDealCode();
  const confirmRedemption = useConfirmRedemption();

  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [dealInfo, setDealInfo] = useState<DealCodeInfo | null>(null);
  const [currentCode, setCurrentCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [successAmount, setSuccessAmount] = useState<number | null>(null);
  const processingRef = useRef(false);

  const handleBarcode = async ({ data }: { data: string }) => {
    if (processingRef.current || scanState !== "scanning") return;
    processingRef.current = true;

    const code = parseQRData(data);
    if (!code) {
      setScanState("error");
      setErrorMessage("Invalid QR code format");
      processingRef.current = false;
      return;
    }

    await validateDealCode(code);
  };

  const validateDealCode = async (code: string) => {
    setScanState("validating");
    setCurrentCode(code);

    try {
      const info = await validateCode.mutateAsync({ code });
      setDealInfo(info);
      setScanState("confirming");
    } catch (e: any) {
      setScanState("error");
      setErrorMessage(e.message ?? "Code validation failed");
    }
    processingRef.current = false;
  };

  const handleConfirm = async (amount: number) => {
    setScanState("redeeming");

    try {
      await confirmRedemption.mutateAsync({
        code: currentCode,
        transaction_amount: amount,
      });
      setSuccessAmount(amount);
      setScanState("success");
      successNotification();
    } catch (e: any) {
      setScanState("error");
      setErrorMessage(e.message ?? "Redemption failed");
    }
  };

  const handleManualSubmit = () => {
    const cleaned = manualCode.replace(/-/g, "").toUpperCase().trim();
    if (cleaned.length !== 8) return;
    lightTap();
    validateDealCode(cleaned);
  };

  const resetScanner = () => {
    setScanState("scanning");
    setDealInfo(null);
    setCurrentCode("");
    setErrorMessage("");
    setManualCode("");
    setShowManual(false);
    setSuccessAmount(null);
    processingRef.current = false;
  };

  if (!permission) return null;

  // Permission request
  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <ScanLine size={48} color={colors.textMuted} strokeWidth={1.5} />
          <Text
            style={{
              fontSize: 15,
              color: colors.text,
              textAlign: "center",
              marginTop: 16,
              marginBottom: 16,
            }}
          >
            Camera access is needed to scan customer QR codes
          </Text>
          <Pressable
            onPress={requestPermission}
            style={({ pressed }) => ({
              backgroundColor: colors.accent,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 32,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>Grant Permission</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={["top"]}>
      {/* Camera scanning */}
      {scanState === "scanning" && !showManual && (
        <View style={{ flex: 1 }}>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={handleBarcode}
          />

          {/* Scan frame overlay */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
            }}
            pointerEvents="none"
          >
            <Text
              style={{
                color: "#FFF",
                fontSize: 14,
                fontWeight: "600",
                marginBottom: 16,
                textShadowColor: "rgba(0,0,0,0.6)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
            >
              Scan customer's NOSH QR
            </Text>
            <View
              style={{
                width: 240,
                height: 240,
                borderRadius: 20,
                borderWidth: 3,
                borderColor: colors.accent,
              }}
            />
          </View>

          {/* Manual entry link */}
          <View
            style={{
              position: "absolute",
              bottom: 40,
              left: 0,
              right: 0,
              alignItems: "center",
            }}
          >
            <Pressable
              onPress={() => {
                lightTap();
                setShowManual(true);
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                backgroundColor: "rgba(0,0,0,0.7)",
                borderRadius: 12,
                paddingVertical: 12,
                paddingHorizontal: 20,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Keyboard size={18} color="#FFF" strokeWidth={1.5} />
              <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 14 }}>
                Enter code manually
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Manual entry */}
      {scanState === "scanning" && showManual && (
        <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }}>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: colors.text,
              marginBottom: 12,
            }}
          >
            Enter 8-character deal code
          </Text>
          <TextInput
            value={manualCode}
            onChangeText={(t) => setManualCode(t.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 8))}
            placeholder="e.g. A8X4N2P9"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={8}
            style={{
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 12,
              padding: 16,
              fontSize: 24,
              fontWeight: "700",
              letterSpacing: 4,
              textAlign: "center",
              backgroundColor: colors.inputBg,
              color: colors.text,
              marginBottom: 16,
            }}
          />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => setShowManual(false)}
              style={({ pressed }) => ({
                flex: 1,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontWeight: "600", color: colors.text }}>Back to Camera</Text>
            </Pressable>
            <Pressable
              onPress={handleManualSubmit}
              disabled={manualCode.length !== 8}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: manualCode.length === 8 ? colors.accent : colors.border,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{ fontWeight: "700", color: "#FFF" }}>Verify</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Validating */}
      {scanState === "validating" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.text,
              marginTop: 16,
            }}
          >
            Verifying code...
          </Text>
        </View>
      )}

      {/* Confirm card (shows deal info + amount input) */}
      {(scanState === "confirming" || scanState === "redeeming") && dealInfo && (
        <DealScanConfirm
          dealInfo={dealInfo}
          onConfirm={handleConfirm}
          onCancel={resetScanner}
          isRedeeming={scanState === "redeeming"}
        />
      )}

      {/* Success */}
      {scanState === "success" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <CheckCircle size={64} color={colors.success} strokeWidth={1.5} />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: colors.success,
              marginTop: 16,
            }}
          >
            Redeemed
          </Text>
          {dealInfo?.deal.title && (
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: colors.text,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              {dealInfo.deal.title}
            </Text>
          )}
          {successAmount != null && (
            <Text
              style={{
                fontSize: 15,
                color: colors.textSecondary,
                marginTop: 4,
              }}
            >
              ${successAmount.toFixed(2)} sale logged
            </Text>
          )}
          <Pressable
            onPress={() => {
              lightTap();
              resetScanner();
            }}
            style={({ pressed }) => ({
              marginTop: 32,
              backgroundColor: colors.accent,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 40,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>Scan Another</Text>
          </Pressable>
        </View>
      )}

      {/* Error */}
      {scanState === "error" && (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <XCircle size={64} color={colors.destructive} strokeWidth={1.5} />
          <Text
            style={{
              fontSize: 22,
              fontWeight: "800",
              color: colors.destructive,
              marginTop: 16,
            }}
          >
            Failed
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: colors.textSecondary,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            {errorMessage}
          </Text>
          <Pressable
            onPress={() => {
              lightTap();
              resetScanner();
            }}
            style={({ pressed }) => ({
              marginTop: 32,
              backgroundColor: colors.accent,
              borderRadius: 12,
              paddingVertical: 14,
              paddingHorizontal: 40,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: "#FFF", fontWeight: "700", fontSize: 16 }}>Try Again</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
