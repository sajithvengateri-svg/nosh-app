import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle2, Clock, Upload } from "lucide-react";

interface StaffCert {
  name: string; role: string;
  certs: { name: string; status: "valid" | "expiring" | "expired" | "missing"; expiry: string | null }[];
}

const staffCerts: StaffCert[] = [
  { name: "Tom Wilson", role: "Chef", certs: [
    { name: "RSA", status: "valid", expiry: "2027-03-15" },
    { name: "Food Safety", status: "valid", expiry: "2026-11-20" },
    { name: "First Aid", status: "expiring", expiry: "2026-03-01" },
  ]},
  { name: "Ryan Mitchell", role: "Bartender", certs: [
    { name: "RSA", status: "expired", expiry: "2026-01-10" },
    { name: "Food Safety", status: "valid", expiry: "2027-06-15" },
    { name: "First Aid", status: "missing", expiry: null },
  ]},
  { name: "Sophie Chen", role: "Wait Staff", certs: [
    { name: "RSA", status: "valid", expiry: "2027-08-20" },
    { name: "Food Safety", status: "expiring", expiry: "2026-03-15" },
    { name: "First Aid", status: "valid", expiry: "2027-01-10" },
  ]},
  { name: "Emma Davis", role: "Supervisor", certs: [
    { name: "RSA", status: "valid", expiry: "2027-05-01" },
    { name: "Food Safety", status: "valid", expiry: "2027-02-28" },
    { name: "First Aid", status: "valid", expiry: "2026-12-01" },
  ]},
  { name: "Jack Brown", role: "Runner", certs: [
    { name: "RSA", status: "valid", expiry: "2027-09-15" },
    { name: "Food Safety", status: "missing", expiry: null },
    { name: "First Aid", status: "missing", expiry: null },
  ]},
];

const statusIcon = (s: string) => {
  switch (s) {
    case "valid": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    case "expiring": return <Clock className="w-4 h-4 text-amber-400" />;
    case "expired": return <AlertTriangle className="w-4 h-4 text-red-400" />;
    default: return <Shield className="w-4 h-4 text-slate-500" />;
  }
};

const statusBadge = (s: string) => {
  const variants: Record<string, string> = {
    valid: "bg-emerald-500/20 text-emerald-400",
    expiring: "bg-amber-500/20 text-amber-400",
    expired: "bg-red-500/20 text-red-400",
    missing: "bg-slate-500/20 text-slate-400",
  };
  return <Badge className={variants[s] || ""} variant="secondary">{s}</Badge>;
};

export default function POSCompliance() {
  const expiredCount = staffCerts.flatMap(s => s.certs).filter(c => c.status === "expired").length;
  const expiringCount = staffCerts.flatMap(s => s.certs).filter(c => c.status === "expiring").length;
  const missingCount = staffCerts.flatMap(s => s.certs).filter(c => c.status === "missing").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Compliance & Certifications</h1>
        <p className="text-sm text-slate-400">Staff certification tracking and clock-in lockout</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{expiredCount}</p>
            <p className="text-xs text-slate-400">Expired</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-amber-400">{expiringCount}</p>
            <p className="text-xs text-slate-400">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-500/10 border-slate-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-400">{missingCount}</p>
            <p className="text-xs text-slate-400">Missing</p>
          </CardContent>
        </Card>
      </div>

      {/* Lockout Warning */}
      {expiredCount > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-400">Clock-in Lockout Active</p>
              <p className="text-xs text-slate-400">{expiredCount} expired cert(s) will prevent clock-in until resolved or manager override</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staff Grid */}
      <div className="space-y-4">
        {staffCerts.map((staff) => (
          <Card key={staff.name} className="bg-white/5 border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-white">{staff.name}</p>
                  <p className="text-xs text-slate-400">{staff.role}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-400"><Upload className="w-4 h-4 mr-1" /> Upload</Button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {staff.certs.map((cert) => (
                  <div key={cert.name} className="flex items-center gap-2 p-2 rounded-md bg-white/5">
                    {statusIcon(cert.status)}
                    <div>
                      <p className="text-xs font-medium text-white">{cert.name}</p>
                      <p className="text-[10px] text-slate-500">{cert.expiry || "Not uploaded"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
