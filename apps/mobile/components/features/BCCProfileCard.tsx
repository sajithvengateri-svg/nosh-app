import { View, Text, Pressable } from "react-native";
import { useTheme } from "../../contexts/ThemeProvider";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { StarRating } from "../../components/ui/StarRating";
import { Pencil } from "lucide-react-native";
import type { ComplianceProfile, FoodSafetySupervisor } from "../../hooks/useBCCCompliance";

interface BCCProfileCardProps {
  profile: ComplianceProfile | null;
  supervisors: FoodSafetySupervisor[];
  onSetup: () => void;
  onEdit?: () => void;
}

const NAVY = "#000080";

function getDaysUntil(dateString: string): number {
  const target = new Date(dateString);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCategoryLabel(category: string): string {
  if (category === "category_1") return "Category 1 \u2014 Full Evidence";
  if (category === "category_2") return "Category 2 \u2014 FSS + Training";
  return String(category);
}

export function BCCProfileCard({ profile, supervisors, onSetup, onEdit }: BCCProfileCardProps) {
  const { colors } = useTheme();

  // ── Empty State ──────────────────────────────────────────────
  if (!profile) {
    return (
      <Card>
        <CardContent style={{ paddingTop: 24, alignItems: "center" }}>
          {/* Shield icon placeholder */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: NAVY,
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
            BCC Eat Safe Compliance
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

  // ── Derived values ───────────────────────────────────────────
  const primaryFSS = supervisors.find((s) => s.is_primary) ?? supervisors[0] ?? null;

  const fssExpiryDays = primaryFSS?.certificate_expiry
    ? getDaysUntil(primaryFSS.certificate_expiry)
    : null;

  const licenceExpiryDays = profile.licence_expiry
    ? getDaysUntil(profile.licence_expiry)
    : null;

  const showLicenceWarning = licenceExpiryDays !== null && licenceExpiryDays <= 90 && licenceExpiryDays > 0;
  const showLicenceError = licenceExpiryDays !== null && licenceExpiryDays <= 0;

  const showFSSWarning = fssExpiryDays !== null && fssExpiryDays <= 90 && fssExpiryDays > 0;
  const showFSSError = fssExpiryDays !== null && fssExpiryDays <= 0;

  // ── Full Profile ─────────────────────────────────────────────
  return (
    <Card>
      <CardContent style={{ paddingTop: 20 }}>
        {/* ── BCC Shield Badge ──────────────────────────────── */}
        <View
          style={{
            backgroundColor: NAVY,
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
            BCC Eat Safe Certified
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
              {getCategoryLabel(profile.business_category)}
            </Badge>
          </View>
        )}

        {/* ── Licence Section ───────────────────────────────── */}
        {profile.bcc_licence_number && (
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
              Licence
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                {profile.bcc_licence_number}
              </Text>
              {profile.licence_expiry && (
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Exp {formatDate(profile.licence_expiry)}
                </Text>
              )}
              {profile.licence_displayed && (
                <Badge variant="success">Displayed</Badge>
              )}
            </View>
          </View>
        )}

        {/* ── Primary FSS Section ───────────────────────────── */}
        {primaryFSS && (
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
              Primary Food Safety Supervisor
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
                {primaryFSS.name}
              </Text>
              {primaryFSS.certificate_expiry && (
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                  Cert exp {formatDate(primaryFSS.certificate_expiry)}
                </Text>
              )}
              {primaryFSS.notified_council && (
                <Badge variant="success">Council Notified</Badge>
              )}
            </View>
          </View>
        )}

        {/* ── Star Rating ───────────────────────────────────── */}
        {profile.last_star_rating != null && (
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
              Eat Safe Star Rating
            </Text>
            <StarRating rating={profile.last_star_rating} size="md" showLabel />
          </View>
        )}

        {/* ── Licence Expiry Banner ─────────────────────────── */}
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
              BCC licence has expired
            </Text>
            <Text style={{ fontSize: 12, color: colors.destructive, marginTop: 2 }}>
              Your food business licence expired{" "}
              {profile.licence_expiry ? formatDate(profile.licence_expiry) : ""}. Renew with Brisbane City Council immediately.
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
              Licence expiring soon
            </Text>
            <Text style={{ fontSize: 12, color: colors.warning, marginTop: 2 }}>
              Your BCC licence expires in {licenceExpiryDays} day{licenceExpiryDays === 1 ? "" : "s"} (
              {profile.licence_expiry ? formatDate(profile.licence_expiry) : ""}). Renew before it lapses.
            </Text>
          </View>
        )}

        {/* ── FSS Expiry Banner ─────────────────────────────── */}
        {showFSSError && (
          <View
            style={{
              backgroundColor: colors.destructiveBg,
              borderRadius: 10,
              padding: 12,
              marginTop: 2,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.destructive }}>
              FSS certificate has expired
            </Text>
            <Text style={{ fontSize: 12, color: colors.destructive, marginTop: 2 }}>
              Your Food Safety Supervisor certificate expired{" "}
              {primaryFSS?.certificate_expiry ? formatDate(primaryFSS.certificate_expiry) : ""}.
              Renew immediately to stay compliant.
            </Text>
          </View>
        )}

        {showFSSWarning && !showFSSError && (
          <View
            style={{
              backgroundColor: colors.warningBg,
              borderRadius: 10,
              padding: 12,
              marginTop: 2,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.warning }}>
              FSS certificate expiring soon
            </Text>
            <Text style={{ fontSize: 12, color: colors.warning, marginTop: 2 }}>
              Certificate expires in {fssExpiryDays} day{fssExpiryDays === 1 ? "" : "s"} (
              {primaryFSS?.certificate_expiry ? formatDate(primaryFSS.certificate_expiry) : ""}).
              Arrange renewal now.
            </Text>
          </View>
        )}
      </CardContent>
    </Card>
  );
}
