import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, AlertTriangle, CheckCircle2, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays, parseISO } from "date-fns";

interface StaffMedical {
  id: string;
  staff_name: string;
  medical_cert_number: string | null;
  medical_cert_expiry: string;
  food_handler_cert_number: string | null;
  food_handler_cert_expiry: string | null;
  visa_expiry: string | null;
  is_active: boolean;
}

export default function GCCStaffMedicalTracker() {
  const orgId = useOrgId();
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffMedical[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [medCertNum, setMedCertNum] = useState("");
  const [medExpiry, setMedExpiry] = useState("");
  const [fhCertNum, setFhCertNum] = useState("");
  const [fhExpiry, setFhExpiry] = useState("");
  const [visaExpiry, setVisaExpiry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("gcc_staff_medical_certs" as any)
      .select("*")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("medical_cert_expiry", { ascending: true })
      .then(({ data }) => {
        if (data) setStaff(data as any as StaffMedical[]);
        setLoading(false);
      });
  }, [orgId]);

  const handleAdd = async () => {
    if (!orgId || !name || !medExpiry) return;
    setSaving(true);

    const { error } = await supabase.from("gcc_staff_medical_certs" as any).insert({
      org_id: orgId,
      user_id: user?.id,
      staff_name: name,
      medical_cert_number: medCertNum || null,
      medical_cert_expiry: medExpiry,
      food_handler_cert_number: fhCertNum || null,
      food_handler_cert_expiry: fhExpiry || null,
      visa_expiry: visaExpiry || null,
      is_active: true,
    } as any);

    if (error) {
      toast.error("Failed to save record");
    } else {
      toast.success("Staff medical record added");
      setShowAdd(false);
      setName(""); setMedCertNum(""); setMedExpiry(""); setFhCertNum(""); setFhExpiry(""); setVisaExpiry("");
      // Refresh
      const { data } = await supabase
        .from("gcc_staff_medical_certs" as any)
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("medical_cert_expiry", { ascending: true });
      if (data) setStaff(data as any as StaffMedical[]);
    }
    setSaving(false);
  };

  const expiredMedical = staff.filter((s) => differenceInDays(parseISO(s.medical_cert_expiry), new Date()) < 0).length;
  const expiringMedical = staff.filter((s) => {
    const d = differenceInDays(parseISO(s.medical_cert_expiry), new Date());
    return d >= 0 && d <= 30;
  }).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold">Staff Medical & Certificates</h2>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="bg-emerald-700 hover:bg-emerald-700/90 text-white">
          <Plus className="w-4 h-4 mr-1" /> Add Staff
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Annual medical fitness examination is mandatory for all food handlers across the UAE.
        Includes: chest X-ray (TB), blood tests (Hep B/C, HIV), stool culture.
      </p>

      <div className="flex gap-2">
        <Badge variant="default" className="bg-emerald-600">{staff.length} Staff</Badge>
        {expiringMedical > 0 && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {expiringMedical} Medical Expiring
          </Badge>
        )}
        {expiredMedical > 0 && (
          <Badge variant="destructive">{expiredMedical} Medical Expired</Badge>
        )}
      </div>

      {expiredMedical > 0 && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>CRITICAL:</strong> {expiredMedical} staff member(s) have expired medical certificates.
            Workers with expired health certificates cannot handle food.
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading staff records...</div>
      ) : staff.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No staff medical records tracked yet.</p>
            <p className="text-xs mt-1">Add food handler records to stay compliant.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {staff.map((s) => {
            const medDays = differenceInDays(parseISO(s.medical_cert_expiry), new Date());
            const medExpired = medDays < 0;
            const medExpiring = medDays >= 0 && medDays <= 30;

            return (
              <Card key={s.id} className={medExpired ? "border-red-300 dark:border-red-800" : medExpiring ? "border-amber-300 dark:border-amber-800" : ""}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm">{s.staff_name}</p>
                    {medExpired ? (
                      <Badge variant="destructive" className="text-[10px]">MEDICAL EXPIRED</Badge>
                    ) : medExpiring ? (
                      <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700">{medDays}d left</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-emerald-600">
                        <CheckCircle2 className="w-3 h-3 mr-0.5" /> Valid
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="block text-[10px] uppercase">Medical Cert</span>
                      <span className="font-mono">{format(parseISO(s.medical_cert_expiry), "dd/MM/yy")}</span>
                    </div>
                    {s.food_handler_cert_expiry && (
                      <div>
                        <span className="block text-[10px] uppercase">Food Handler</span>
                        <span className="font-mono">{format(parseISO(s.food_handler_cert_expiry), "dd/MM/yy")}</span>
                      </div>
                    )}
                    {s.visa_expiry && (
                      <div>
                        <span className="block text-[10px] uppercase">Visa</span>
                        <span className="font-mono">{format(parseISO(s.visa_expiry), "dd/MM/yy")}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HeartPulse className="w-5 h-5" />
              Add Staff Medical Record
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Staff Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="mt-1" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Medical Cert #</Label>
                <Input value={medCertNum} onChange={(e) => setMedCertNum(e.target.value)} placeholder="MC-1234" className="mt-1" />
              </div>
              <div>
                <Label>Medical Expiry *</Label>
                <Input type="date" value={medExpiry} onChange={(e) => setMedExpiry(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Food Handler Cert #</Label>
                <Input value={fhCertNum} onChange={(e) => setFhCertNum(e.target.value)} placeholder="FH-5678" className="mt-1" />
              </div>
              <div>
                <Label>FH Cert Expiry</Label>
                <Input type="date" value={fhExpiry} onChange={(e) => setFhExpiry(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Visa/Residency Expiry</Label>
              <Input type="date" value={visaExpiry} onChange={(e) => setVisaExpiry(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !name || !medExpiry} className="bg-emerald-700 hover:bg-emerald-700/90 text-white">
              {saving ? "Saving…" : "Save Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
