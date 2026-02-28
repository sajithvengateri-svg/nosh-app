import { View, Text, TouchableOpacity, Linking } from "react-native";
import { FileText, Upload, Calendar, DollarSign, User, ExternalLink } from "lucide-react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "./Badge";

interface ServiceLogCardProps {
  title: string;
  provider?: string;
  lastServiceDate?: string;
  nextDueDate?: string;
  invoiceUrl?: string;
  cost?: number;
  notes?: string;
  status?: "completed" | "upcoming" | "overdue";
  signedBy?: string;
  signedAt?: string;
  onPress?: () => void;
  onUploadInvoice?: () => void;
}

const STATUS_MAP = {
  completed: { label: "Completed", variant: "success" as const },
  upcoming: { label: "Upcoming", variant: "warning" as const },
  overdue: { label: "Overdue", variant: "destructive" as const },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDaysUntil(iso: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(iso);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

export function ServiceLogCard(props: ServiceLogCardProps) {
  const { colors } = useTheme();
  const {
    title, provider, lastServiceDate, nextDueDate, invoiceUrl,
    cost, notes, status, signedBy, signedAt, onPress, onUploadInvoice,
  } = props;

  const daysLeft = nextDueDate ? getDaysUntil(nextDueDate) : null;
  const dueBg = daysLeft === null ? colors.border
    : daysLeft > 30 ? colors.successBg
    : daysLeft >= 7 ? colors.warningBg
    : colors.destructiveBg;
  const dueColor = daysLeft === null ? colors.textMuted
    : daysLeft > 30 ? colors.success
    : daysLeft >= 7 ? colors.warning
    : colors.destructive;

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: colors.card, borderRadius: 14, borderWidth: 1,
        borderColor: colors.cardBorder, padding: 16,
      }}
    >
      {/* Header row */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, flex: 1, marginRight: 8 }}>{title}</Text>
        {status && <Badge variant={STATUS_MAP[status].variant}>{STATUS_MAP[status].label}</Badge>}
      </View>

      {/* Provider */}
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
        <User size={14} color={colors.textSecondary} />
        <Text style={{ fontSize: 14, color: colors.textSecondary, marginLeft: 6 }}>
          {provider || "No provider recorded"}
        </Text>
      </View>

      {/* Dates row */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {lastServiceDate && (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Calendar size={14} color={colors.textMuted} />
            <Text style={{ fontSize: 13, color: colors.textMuted, marginLeft: 4 }}>
              Last: {formatDate(lastServiceDate)}
            </Text>
          </View>
        )}
        {daysLeft !== null && (
          <View style={{ backgroundColor: dueBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, flexDirection: "row", alignItems: "center" }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: dueColor }}>
              {daysLeft <= 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d remaining`}
            </Text>
          </View>
        )}
      </View>

      {/* Cost */}
      {cost !== undefined && (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <DollarSign size={14} color={colors.textSecondary} />
          <Text style={{ fontSize: 14, color: colors.text, fontWeight: "600", marginLeft: 4 }}>
            ${cost.toFixed(2)}
          </Text>
        </View>
      )}

      {/* Notes */}
      {notes ? (
        <Text numberOfLines={2} style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8 }}>
          {notes}
        </Text>
      ) : null}

      {/* Invoice actions */}
      {(invoiceUrl || onUploadInvoice) && (
        <View style={{ flexDirection: "row", gap: 10, marginBottom: signedBy ? 10 : 0 }}>
          {invoiceUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(invoiceUrl)} style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.accentBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
              <FileText size={14} color={colors.accent} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.accent, marginLeft: 4 }}>Invoice</Text>
              <ExternalLink size={12} color={colors.accent} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          )}
          {!invoiceUrl && onUploadInvoice && (
            <TouchableOpacity onPress={onUploadInvoice} style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.inputBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: colors.border }}>
              <Upload size={14} color={colors.textSecondary} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.textSecondary, marginLeft: 4 }}>Upload Invoice</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Audit footer */}
      {signedBy && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }}>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>
            Signed by {signedBy}{signedAt ? ` at ${formatDate(signedAt)}` : ""}
          </Text>
        </View>
      )}
    </Wrapper>
  );
}
