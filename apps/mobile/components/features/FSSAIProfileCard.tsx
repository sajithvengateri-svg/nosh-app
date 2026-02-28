import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Pencil } from "lucide-react-native";
import type { FSSAIProfile } from "../../hooks/useFSSAICompliance";

const SAFFRON = "#FF9933";

interface FSSAIProfileCardProps {
  profile: FSSAIProfile | null;
  complianceScore: number;
  onSetup: () => void;
  onEdit?: () => void;
}

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDaysUntil(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getLicenceTypeLabel(type: string): string {
  if (type === "registration") return "Registration";
  if (type === "state") return "State Licence";
  if (type === "central") return "Central Licence";
  return type;
}

export function FSSAIProfileCard({ profile, complianceScore, onSetup, onEdit }: FSSAIProfileCardProps) {
  const { colors } = useTheme();

  if (!profile) {
    return (
      <Card>
        <CardContent style={{ paddingTop: 24, alignItems: "center" }}>
          <View
            style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: SAFFRON,
              alignItems: "center", justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 28, color: "#FFFFFF" }}>🇮🇳</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: 4 }}>
            FSSAI Compliance
          </Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: "center", marginBottom: 20 }}>
            Set up your FSSAI profile to track compliance
          </Text>
          <Button onPress={onSetup}>Set Up FSSAI Profile</Button>
        </CardContent>
      </Card>
    );
  }

  const licenceExpiryDays = profile.licence_expiry ? getDaysUntil(profile.licence_expiry) : null;
  const showLicenceWarning = licenceExpiryDays !== null && licenceExpiryDays <= 90 && licenceExpiryDays > 0;
  const showLicenceError = licenceExpiryDays !== null && licenceExpiryDays <= 0;

  const auditDays = profile.next_audit_date ? getDaysUntil(profile.next_audit_date) : null;

  return (
    <Card>
      <CardContent style={{ paddingTop: 20 }}>
        {/* Header */}
        <View style={{
          backgroundColor: SAFFRON, borderRadius: 12,
          paddingVertical: 14, paddingHorizontal: 16,
          flexDirection: "row", alignItems: "center",
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 24, marginRight: 10 }}>🇮🇳</Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", flex: 1 }}>
            FSSAI Compliant
          </Text>
          {onEdit && (
            <Pressable onPress={onEdit} hitSlop={8} style={{
              width: 32, height: 32, borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.2)",
              alignItems: "center", justifyContent: "center",
            }}>
              <Pencil size={14} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          )}
        </View>

        {/* Licence type badge */}
        {profile.licence_type && (
          <View style={{ marginBottom: 14 }}>
            <Badge variant="secondary">{getLicenceTypeLabel(profile.licence_type)}</Badge>
          </View>
        )}

        {/* Licence number */}
        {profile.fssai_licence_number && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              FSSAI Licence Number
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                {profile.fssai_licence_number}
              </Text>
              {profile.licence_expiry && (
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Exp {formatDate(profile.licence_expiry)}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* FOSTAC */}
        {profile.fostac_certified && (
          <View style={{ marginBottom: 14 }}>
            <Badge variant="success">FOSTAC Certified</Badge>
          </View>
        )}

        {/* Compliance score */}
        {complianceScore > 0 && (
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: "500", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
              Compliance Score
            </Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
              <Text style={{ fontSize: 28, fontWeight: "800", color: complianceScore >= 80 ? colors.success : complianceScore >= 50 ? colors.warning : colors.destructive }}>
                {complianceScore}%
              </Text>
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                {complianceScore >= 80 ? "Compliant" : complianceScore >= 50 ? "Needs Improvement" : "Non-Compliant"}
              </Text>
            </View>
          </View>
        )}

        {/* Next audit date */}
        {auditDays !== null && (
          <View style={{
            backgroundColor: auditDays <= 30 ? colors.warningBg : colors.accentBg,
            borderRadius: 10, padding: 12, marginBottom: 8,
          }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: auditDays <= 30 ? colors.warning : colors.accent }}>
              {auditDays <= 0 ? "Audit overdue" : `Next audit in ${auditDays} days`}
            </Text>
            {profile.next_audit_date && (
              <Text style={{ fontSize: 12, color: auditDays <= 30 ? colors.warning : colors.accent, marginTop: 2 }}>
                {formatDate(profile.next_audit_date)}
              </Text>
            )}
          </View>
        )}

        {/* Licence expiry warnings */}
        {showLicenceError && (
          <View style={{ backgroundColor: colors.destructiveBg, borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.destructive }}>
              FSSAI licence has expired
            </Text>
            <Text style={{ fontSize: 12, color: colors.destructive, marginTop: 2 }}>
              Renew your FSSAI licence immediately to avoid penalties.
            </Text>
          </View>
        )}

        {showLicenceWarning && !showLicenceError && (
          <View style={{ backgroundColor: colors.warningBg, borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.warning }}>
              Licence expiring in {licenceExpiryDays} day{licenceExpiryDays === 1 ? "" : "s"}
            </Text>
            <Text style={{ fontSize: 12, color: colors.warning, marginTop: 2 }}>
              Renew before {profile.licence_expiry ? formatDate(profile.licence_expiry) : ""} to stay compliant.
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
