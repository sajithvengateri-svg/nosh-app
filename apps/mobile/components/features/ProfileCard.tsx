import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { StarRating } from "../../components/ui/StarRating";
import { Pencil } from "lucide-react-native";
import { useComplianceContext } from "../../contexts/ComplianceProvider";
import type { ComplianceProfile, FoodSafetySupervisor } from "../../hooks/useCompliance";

// ── Props ──────────────────────────────────────────────────────────────

interface ProfileCardProps {
  onSetup: () => void;
  onEdit?: () => void;
}

// ── Helpers ────────────────────────────────────────────────────────────

function getDaysUntil(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateString: string, locale: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
}

// ── Component ──────────────────────────────────────────────────────────

export function ProfileCard({ onSetup, onEdit }: ProfileCardProps) {
  const { colors } = useTheme();
  const { config, profile, supervisors, complianceScore } = useComplianceContext();

  const accentColor = config.labels.accentColor;
  const locale = config.locale;

  // ── Empty State ──────────────────────────────────────────────
  if (!profile) {
    return (
      <Card>
        <CardContent style={{ paddingTop: 24, alignItems: "center" }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: accentColor,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: 28, color: "#FFFFFF" }}>{"\uD83D\uDEE1\uFE0F"}</Text>
          </View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: colors.text,
              textAlign: "center",
              marginBottom: 4,
            }}
          >
            {config.labels.frameworkName}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Complete the setup wizard to get started
          </Text>
          <Button onPress={onSetup}>Set Up Compliance Profile</Button>
        </CardContent>
      </Card>
    );
  }

  // ── Derived values ─────────────────────────────────────────────
  const primarySupervisor = config.features.hasSupervisors
    ? supervisors.find((s) => s.is_primary) ?? supervisors[0] ?? null
    : null;

  const licenceNumber = profile[config.labels.licenceFieldKey];

  const licenceExpiryDays = profile.licence_expiry
    ? getDaysUntil(profile.licence_expiry)
    : null;

  const showLicenceWarning = licenceExpiryDays !== null && licenceExpiryDays <= 90 && licenceExpiryDays > 0;
  const showLicenceError = licenceExpiryDays !== null && licenceExpiryDays <= 0;

  const supervisorExpiryDays = primarySupervisor?.certificate_expiry
    ? getDaysUntil(primarySupervisor.certificate_expiry)
    : null;

  const showSupervisorWarning = supervisorExpiryDays !== null && supervisorExpiryDays <= 90 && supervisorExpiryDays > 0;
  const showSupervisorError = supervisorExpiryDays !== null && supervisorExpiryDays <= 0;

  const auditDays = profile.next_audit_date ? getDaysUntil(profile.next_audit_date) : null;

  // ── Full Profile ───────────────────────────────────────────────
  return (
    <Card>
      <CardContent style={{ paddingTop: 20 }}>
        {/* ── Header Badge ──────────────────────────────────── */}
        <View
          style={{
            backgroundColor: accentColor,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 24, marginRight: 10 }}>{"\uD83D\uDEE1\uFE0F"}</Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF", flex: 1 }}>
            {config.labels.frameworkName}
          </Text>
          {onEdit && (
            <Pressable
              onPress={onEdit}
              hitSlop={8}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.2)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pencil size={14} color="#FFFFFF" strokeWidth={2} />
            </Pressable>
          )}
        </View>

        {/* ── Business Category ─────────────────────────────── */}
        {profile.business_category != null && (
          <View style={{ marginBottom: 14 }}>
            <Badge variant="secondary">
              {profile.business_category}
            </Badge>
          </View>
        )}

        {/* ── Licence type (FSSAI-specific) ─────────────────── */}
        {profile.licence_type && (
          <View style={{ marginBottom: 14 }}>
            <Badge variant="secondary">
              {profile.licence_type === "registration" ? "Registration" : profile.licence_type === "state" ? "State Licence" : profile.licence_type === "central" ? "Central Licence" : profile.licence_type}
            </Badge>
          </View>
        )}

        {/* ── Licence Number ────────────────────────────────── */}
        {licenceNumber && (
          <View style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              {config.labels.licenceLabel}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                {licenceNumber}
              </Text>
              {profile.licence_expiry && (
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Exp {formatDate(profile.licence_expiry, locale)}
                </Text>
              )}
              {profile.licence_displayed && (
                <Badge variant="success">Displayed</Badge>
              )}
            </View>
          </View>
        )}

        {/* ── FOSTAC badge (FSSAI-specific) ─────────────────── */}
        {profile.fostac_certified && (
          <View style={{ marginBottom: 14 }}>
            <Badge variant="success">FOSTAC Certified</Badge>
          </View>
        )}

        {/* ── Primary Supervisor ────────────────────────────── */}
        {primarySupervisor && (
          <View style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              Primary {config.labels.supervisorRole}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                {primarySupervisor.name}
              </Text>
              {primarySupervisor.certificate_expiry && (
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Cert exp {formatDate(primarySupervisor.certificate_expiry, locale)}
                </Text>
              )}
              {primarySupervisor.notified_council && (
                <Badge variant="success">Council Notified</Badge>
              )}
            </View>
          </View>
        )}

        {/* ── Score Display ─────────────────────────────────── */}
        {complianceScore != null && complianceScore > 0 && (
          <View style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 6,
              }}
            >
              {config.scoring.model === "star_rating" ? "Eat Safe Star Rating" : "Compliance Score"}
            </Text>
            {config.scoring.model === "star_rating" ? (
              <StarRating rating={complianceScore} size="md" showLabel />
            ) : (
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "800",
                    color: complianceScore >= 80 ? colors.success : complianceScore >= 50 ? colors.warning : colors.destructive,
                  }}
                >
                  {complianceScore}%
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  {complianceScore >= 80 ? "Compliant" : complianceScore >= 50 ? "Needs Improvement" : "Non-Compliant"}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ── Next audit date ───────────────────────────────── */}
        {auditDays !== null && (
          <View
            style={{
              backgroundColor: auditDays <= 30 ? colors.warningBg : colors.accentBg,
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: auditDays <= 30 ? colors.warning : colors.accent }}>
              {auditDays <= 0 ? "Audit overdue" : `Next audit in ${auditDays} days`}
            </Text>
            {profile.next_audit_date && (
              <Text style={{ fontSize: 12, color: auditDays <= 30 ? colors.warning : colors.accent, marginTop: 2 }}>
                {formatDate(profile.next_audit_date, locale)}
              </Text>
            )}
          </View>
        )}

        {/* ── Licence Expiry Warnings ───────────────────────── */}
        {showLicenceError && (
          <View
            style={{
              backgroundColor: colors.destructiveBg,
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.destructive }}>
              {config.labels.frameworkShort} licence has expired
            </Text>
            <Text style={{ fontSize: 12, color: colors.destructive, marginTop: 2 }}>
              Renew your {config.labels.frameworkShort} licence immediately to stay compliant.
            </Text>
          </View>
        )}

        {showLicenceWarning && !showLicenceError && (
          <View
            style={{
              backgroundColor: colors.warningBg,
              borderRadius: 10,
              padding: 12,
              marginBottom: 8,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.warning }}>
              Licence expiring in {licenceExpiryDays} day{licenceExpiryDays === 1 ? "" : "s"}
            </Text>
            <Text style={{ fontSize: 12, color: colors.warning, marginTop: 2 }}>
              Renew before {profile.licence_expiry ? formatDate(profile.licence_expiry, locale) : ""} to stay compliant.
            </Text>
          </View>
        )}

        {/* ── Supervisor Expiry Warnings ────────────────────── */}
        {showSupervisorError && (
          <View
            style={{
              backgroundColor: colors.destructiveBg,
              borderRadius: 10,
              padding: 12,
              marginTop: 2,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.destructive }}>
              {config.labels.supervisorRole} certificate has expired
            </Text>
            <Text style={{ fontSize: 12, color: colors.destructive, marginTop: 2 }}>
              Certificate expired{" "}
              {primarySupervisor?.certificate_expiry ? formatDate(primarySupervisor.certificate_expiry, locale) : ""}.
              Renew immediately to stay compliant.
            </Text>
          </View>
        )}

        {showSupervisorWarning && !showSupervisorError && (
          <View
            style={{
              backgroundColor: colors.warningBg,
              borderRadius: 10,
              padding: 12,
              marginTop: 2,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.warning }}>
              {config.labels.supervisorRole} certificate expiring soon
            </Text>
            <Text style={{ fontSize: 12, color: colors.warning, marginTop: 2 }}>
              Certificate expires in {supervisorExpiryDays} day{supervisorExpiryDays === 1 ? "" : "s"} (
              {primarySupervisor?.certificate_expiry ? formatDate(primarySupervisor.certificate_expiry, locale) : ""}).
              Arrange renewal now.
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
