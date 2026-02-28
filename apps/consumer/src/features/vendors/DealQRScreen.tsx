import { View, Text, Pressable, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { CheckCircle, Copy, X, Clock } from "lucide-react-native";
import { Colors, Glass, Spacing, BorderRadius } from "../../constants/colors";
import { lightTap, successNotification } from "../../lib/haptics";
import {
  formatCodeForDisplay,
  buildQRPayload,
  getTimeRemaining,
  isCodeExpired,
} from "../../lib/services/dealCodeService";
import * as Clipboard from "expo-clipboard";
import { useState, useEffect } from "react";

interface DealQRScreenProps {
  code: string;
  expiresAt: string;
  dealTitle: string;
  vendorName: string;
  onClose: () => void;
}

export function DealQRScreen({
  code,
  expiresAt,
  dealTitle,
  vendorName,
  onClose,
}: DealQRScreenProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(expiresAt));
  const expired = isCodeExpired(expiresAt);

  // Live countdown — update every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeRemaining(expiresAt));
    }, 30_000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const qrValue = buildQRPayload(code);
  const displayCode = formatCodeForDisplay(code);

  const handleCopy = async () => {
    lightTap();
    await Clipboard.setStringAsync(code);
    setCopied(true);
    successNotification();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Deal Code</Text>
        <Pressable onPress={() => { lightTap(); onClose(); }} hitSlop={12}>
          <X size={22} color={Colors.text.secondary} strokeWidth={1.5} />
        </Pressable>
      </View>

      <View style={styles.qrContainer}>
        {/* QR code */}
        <View style={[styles.qrCard, expired && { opacity: 0.4 }]}>
          <QRCode
            value={qrValue}
            size={220}
            color={Colors.secondary}
            backgroundColor="transparent"
          />
        </View>

        {/* Deal info */}
        <Text style={styles.dealTitle}>{dealTitle}</Text>
        <Text style={styles.vendorName}>{vendorName}</Text>

        {/* Large code display */}
        <Text style={styles.codeDisplay}>{displayCode}</Text>

        {/* Expiry status */}
        {expired ? (
          <View style={[styles.statusBadge, { backgroundColor: "rgba(168,157,163,0.15)" }]}>
            <Clock size={14} color={Colors.text.muted} strokeWidth={1.5} />
            <Text style={[styles.statusText, { color: Colors.text.muted }]}>Expired</Text>
          </View>
        ) : (
          <View style={styles.statusBadge}>
            <Clock size={14} color={Colors.success} strokeWidth={1.5} />
            <Text style={styles.statusText}>Expires in {timeLeft}</Text>
          </View>
        )}

        <Text style={styles.instruction}>
          Show this to the vendor to redeem your deal
        </Text>

        {/* Copy code row */}
        <Pressable onPress={handleCopy} style={styles.tokenRow}>
          <Text style={styles.tokenLabel}>CODE</Text>
          <Text style={styles.tokenValue}>{code}</Text>
          {copied ? (
            <CheckCircle size={16} color={Colors.success} strokeWidth={1.5} />
          ) : (
            <Copy size={16} color={Colors.text.muted} strokeWidth={1.5} />
          )}
        </Pressable>
      </View>

      <Pressable
        onPress={() => { lightTap(); onClose(); }}
        style={({ pressed }) => [styles.doneButton, { opacity: pressed ? 0.85 : 1 }]}
      >
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.secondary,
  },
  qrContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  qrCard: {
    backgroundColor: "#FFF",
    borderRadius: BorderRadius.card,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Glass.shadowLight.color,
    shadowOffset: Glass.shadowLight.offset,
    shadowRadius: Glass.shadowLight.radius,
    shadowOpacity: 1,
    borderWidth: 1,
    borderColor: Glass.borderLight,
  },
  dealTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.secondary,
    textAlign: "center",
    marginBottom: 4,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  codeDisplay: {
    fontSize: 32,
    fontWeight: "800",
    color: Colors.secondary,
    fontFamily: "JetBrains Mono",
    letterSpacing: 3,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    backgroundColor: "rgba(91, 163, 122, 0.12)",
    marginBottom: Spacing.md,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.success,
  },
  instruction: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  tokenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Glass.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Glass.borderLight,
    width: "100%",
  },
  tokenLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.muted,
    letterSpacing: 0.8,
  },
  tokenValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: "JetBrains Mono",
    color: Colors.secondary,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.button,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  doneText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFF",
  },
});
