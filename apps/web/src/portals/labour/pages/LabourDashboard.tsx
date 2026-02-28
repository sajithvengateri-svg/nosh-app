import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Clock, ShieldCheck, TrendingUp, AlertTriangle, Fingerprint, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { useEmployeeProfiles, useRosters } from "@/lib/shared/queries/labourQueries";
import { useStaffCertifications, getCertStatus } from "@/lib/shared/queries/certificationQueries";

const LabourDashboard = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { data: employees } = useEmployeeProfiles(orgId);
  const { data: rosters } = useRosters(orgId);
  const { data: certs } = useStaffCertifications(orgId);

  const activeEmployees = employees?.filter(e => e.is_active) ?? [];
  const latestRoster = rosters?.[0];

  // RSA alert counts
  const expiredCerts = certs?.filter(c => c.cert_type === "RSA" && getCertStatus(c.expiry_date) === "expired").length ?? 0;
  const expiringCerts = certs?.filter(c => c.cert_type === "RSA" && getCertStatus(c.expiry_date) === "expiring").length ?? 0;
  const rsaAlertCount = expiredCerts + expiringCerts;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">LabourOS</h1>
        <p className="text-muted-foreground text-sm">Workforce scheduling & labour cost control</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Staff</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{activeEmployees.length}</p><p className="text-xs text-muted-foreground">active employees</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><DollarSign className="w-4 h-4" /> Budget</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">${latestRoster?.labour_budget?.toLocaleString() ?? '—'}</p><p className="text-xs text-muted-foreground">this period</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Rostered</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{latestRoster?.total_rostered_hours ?? '—'}h</p><p className="text-xs text-muted-foreground">total hours</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Compliance</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">✓</p><p className="text-xs text-muted-foreground">award compliant</p></CardContent>
        </Card>
      </div>

      {/* RSA Alert */}
      {rsaAlertCount > 0 && (
        <Link to="/labour/compliance/certs" className="block">
          <Card className="border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-pointer">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">RSA Compliance Alert</p>
                <p className="text-xs text-muted-foreground">{expiredCerts} expired, {expiringCerts} expiring within 30 days</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      )}

      <Link to="/clock/dashboard" className="block">
        <Card className="border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Fingerprint className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">ClockOS — Time & Attendance</p>
              <p className="text-xs text-muted-foreground">View live clock-ins, manage PINs & induction</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Labour Cost Trend</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground text-sm">Labour cost tracking will appear here once pay runs are processed.</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Compliance Alerts</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground text-sm">Fatigue risk, missed breaks, and award compliance alerts will appear here.</p></CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LabourDashboard;
