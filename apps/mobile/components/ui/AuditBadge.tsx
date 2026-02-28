import { View, Text } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";

interface AuditBadgeProps {
  signedBy: string;
  signedAt: string; // ISO datetime string
  size?: "sm" | "md";
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase();
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm} on ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function AuditBadge({ signedBy, signedAt, size = "md" }: AuditBadgeProps) {
  const { colors } = useTheme();
  const circle = size === "sm" ? 24 : 32;
  const fontSize = size === "sm" ? 11 : 13;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 8,
        padding: 8,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          backgroundColor: colors.accentBg,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 8,
        }}
      >
        <Text style={{ fontSize: fontSize - 1, fontWeight: "700", color: colors.accent }}>
          {getInitials(signedBy)}
        </Text>
      </View>
      <Text style={{ fontSize, color: colors.textSecondary, flexShrink: 1 }}>
        Signed by{" "}
        <Text style={{ color: colors.text, fontWeight: "600" }}>{signedBy}</Text>
        {" "}at {formatDateTime(signedAt)}
      </Text>
    </View>
  );
}
