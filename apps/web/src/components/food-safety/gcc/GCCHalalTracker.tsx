import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileCheck, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { useAuth } from "@/contexts/AuthContext";
import { formatAED } from "@/lib/shared/gccConfig";
import { format, differenceInDays, parseISO } from "date-fns";

interface HalalCert {
  id: string;
  supplier_name: string;
  certificate_number: string | null;
  issuing_authority: string | null;
  expiry_date: string;
  is_valid: boolean;
}

export default function GCCHalalTracker() {
  const orgId = useOrgId();
  const { user } = useAuth();
  const [certs, setCerts] = useState<HalalCert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // Form state
  const [supplier, setSupplier] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [authority, setAuthority] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("gcc_halal_certificates" as any)
      .select("*")
      .eq("org_id", orgId)
      .order("expiry_date", { ascending: true })
      .then(({ data }) => {
        if (data) setCerts(data as any as HalalCert[]);
        setLoading(false);
      });
  }, [orgId]);

  const handleAdd = async () => {
    if (!orgId || !supplier || !expiryDate) return;
    setSaving(true);

    const { error } = await supabase.from("gcc_halal_certificates" as any).insert({
      org_id: orgId,
      supplier_name: supplier,
      certificate_number: certNumber || null,
      issuing_authority: authority || null,
      expiry_date: expiryDate,
      is_valid: true,
      verified_by: user?.id,
      verified_at: new Date().toISOString(),
    } as any);

    if (error) {
      toast.error("Failed to save certificate");
    } else {
      toast.success("Halal certificate added");
      setShowAdd(false);
      setSupplier("");
      setCertNumber("");
      setAuthority("");
      setExpiryDate("");
      // Refresh
      const { data } = await supabase
        .from("gcc_halal_certificates" as any)
        .select("*")
        .eq("org_id", orgId)
        .order("expiry_date", { ascending: true });
      if (data) setCerts(data as any as HalalCert[]);
    }
    setSaving(false);
  };

  const expiringCount = certs.filter((c) => {
    const days = differenceInDays(parseISO(c.expiry_date), new Date());
    return days >= 0 && days <= 30;
  }).length;
  const expiredCount = certs.filter((c) => differenceInDays(parseISO(c.expiry_date), new Date()) < 0).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold">Halal Certificate Tracker</h2>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)} className="bg-emerald-700 hover:bg-emerald-700/90 text-white">
          <Plus className="w-4 h-4 mr-1" /> Add Certificate
        </Button>
      </div>

      {/* Summary badges */}
      <div className="flex gap-2">
        <Badge variant="default" className="bg-emerald-600">{certs.length} Suppliers</Badge>
        {expiringCount > 0 && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            {expiringCount} Expiring Soon
          </Badge>
        )}
        {expiredCount > 0 && (
          <Badge variant="destructive">{expiredCount} Expired</Badge>
        )}
      </div>

      {expiredCount > 0 && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <strong>CRITICAL:</strong> {expiredCount} supplier(s) have expired halal certificates.
            Missing halal certification is a critical violation. Fine: {formatAED(10000)} – {formatAED(50000)}.
          </div>
        </div>
      )}

      {/* Certificate list */}
      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading certificates...</div>
      ) : certs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No halal certificates tracked yet.</p>
            <p className="text-xs mt-1">Add supplier certificates to stay compliant.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {certs.map((cert) => {
            const daysUntilExpiry = differenceInDays(parseISO(cert.expiry_date), new Date());
            const isExpired = daysUntilExpiry < 0;
            const isExpiring = daysUntilExpiry >= 0 && daysUntilExpiry <= 30;

            return (
              <Card key={cert.id} className={isExpired ? "border-red-300 dark:border-red-800" : isExpiring ? "border-amber-300 dark:border-amber-800" : ""}>
                <CardContent className="py-3 px-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{cert.supplier_name}</p>
                    {cert.certificate_number && (
                      <p className="text-xs text-muted-foreground">Cert: {cert.certificate_number}</p>
                    )}
                    {cert.issuing_authority && (
                      <p className="text-xs text-muted-foreground">{cert.issuing_authority}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Expires</p>
                    <p className={`text-sm font-mono ${isExpired ? "text-red-600" : isExpiring ? "text-amber-600" : "text-emerald-600"}`}>
                      {format(parseISO(cert.expiry_date), "dd MMM yyyy")}
                    </p>
                    {isExpired ? (
                      <Badge variant="destructive" className="text-[10px] mt-1">EXPIRED</Badge>
                    ) : isExpiring ? (
                      <Badge variant="secondary" className="text-[10px] mt-1 bg-amber-100 text-amber-700">{daysUntilExpiry}d left</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] mt-1 text-emerald-600">
                        <CheckCircle2 className="w-3 h-3 mr-0.5" /> Valid
                      </Badge>
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
              <FileCheck className="w-5 h-5" />
              Add Halal Certificate
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Supplier Name *</Label>
              <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. Al Noor Meats" className="mt-1" autoFocus />
            </div>
            <div>
              <Label>Certificate Number</Label>
              <Input value={certNumber} onChange={(e) => setCertNumber(e.target.value)} placeholder="e.g. HC-2026-1234" className="mt-1" />
            </div>
            <div>
              <Label>Issuing Authority</Label>
              <Input value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="e.g. ESMA, Emirates Authority" className="mt-1" />
            </div>
            <div>
              <Label>Expiry Date *</Label>
              <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving || !supplier || !expiryDate} className="bg-emerald-700 hover:bg-emerald-700/90 text-white">
              {saving ? "Saving…" : "Save Certificate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
