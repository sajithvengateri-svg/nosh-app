import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileCheck, UserCheck } from "lucide-react";
import BCCStarRating from "./BCCStarRating";
import type { ComplianceProfile, FoodSafetySupervisor } from "@/hooks/useBCCCompliance";
import { format, parseISO } from "date-fns";

interface Props {
  profile: ComplianceProfile | null;
  supervisors: FoodSafetySupervisor[];
}

export default function ComplianceProfileCard({ profile, supervisors }: Props) {
  const primaryFSS = supervisors.find((s) => s.is_primary) || supervisors[0];

  if (!profile) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-8 text-center text-muted-foreground">
          <Shield className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>No compliance profile yet. Complete the setup wizard to get started.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-[#000080]/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-[#000080]">
          <Shield className="w-5 h-5" />
          Compliance Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Licence */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">BCC Licence</p>
          <p className="font-semibold">{profile.bcc_licence_number || "Not set"}</p>
          {profile.licence_expiry && (
            <p className="text-xs text-muted-foreground">
              Expires {format(parseISO(profile.licence_expiry), "dd MMM yyyy")}
            </p>
          )}
          {profile.licence_displayed && (
            <Badge variant="outline" className="text-xs">Displayed ✓</Badge>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Business Category</p>
          <Badge variant="secondary">
            {profile.business_category === "category_1" ? "Category 1 — Full Evidence" : "Category 2 — FSS + Training"}
          </Badge>
        </div>

        {/* FSS */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Food Safety Supervisor</p>
          {primaryFSS ? (
            <>
              <p className="font-semibold flex items-center gap-1">
                <UserCheck className="w-4 h-4" />
                {primaryFSS.name}
              </p>
              {primaryFSS.certificate_expiry && (
                <p className="text-xs text-muted-foreground">
                  Cert expires {format(parseISO(primaryFSS.certificate_expiry), "dd MMM yyyy")}
                </p>
              )}
              {primaryFSS.notified_council && (
                <Badge variant="outline" className="text-xs">Council Notified ✓</Badge>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Not assigned</p>
          )}
        </div>

        {/* Star Rating */}
        {profile.last_star_rating != null && (
          <div className="space-y-1 sm:col-span-2 lg:col-span-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Star Rating</p>
            <BCCStarRating rating={profile.last_star_rating} size="lg" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
