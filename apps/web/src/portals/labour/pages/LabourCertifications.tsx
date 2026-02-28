import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, Upload, CheckCircle, AlertTriangle, XCircle, MinusCircle, ChevronLeft, ChevronRight, Search, Copy, ExternalLink } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { useEmployeeProfilesWithNames } from "@/lib/shared/queries/labourQueries";
import { useStaffCertifications, useUpsertCertification, getCertStatus, CERT_STATUS_COLORS } from "@/lib/shared/queries/certificationQueries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

const CERT_ICONS: Record<string, typeof CheckCircle> = { valid: CheckCircle, expiring: AlertTriangle, expired: XCircle, missing: MinusCircle };
const SECTIONS = ["All", "Bar", "Floor", "Kitchen", "Management"];
const STATUSES = ["All", "Valid", "Expiring", "Expired", "Missing"];

const LabourCertifications = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { data: employees } = useEmployeeProfilesWithNames(orgId);
  const { data: certs } = useStaffCertifications(orgId);
  const upsertCert = useUpsertCertification();

  const [sectionFilter, setSectionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [inspectorIdx, setInspectorIdx] = useState(0);

  // Build employee cert map
  const empCertData = (employees ?? []).map(emp => {
    const empCerts = certs?.filter(c => c.user_id === emp.user_id) ?? [];
    const rsaCert = empCerts.find(c => c.cert_type === "RSA");
    const rsaStatus = rsaCert ? getCertStatus(rsaCert.expiry_date) : "missing";
    const section = Array.isArray(emp.section_tags) && (emp.section_tags as any[]).length > 0 ? (emp.section_tags as any[])[0] : "Other";
    return { ...emp, rsaCert, rsaStatus, section, allCerts: empCerts };
  });

  const filtered = empCertData.filter(e => {
    if (search && !e.full_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (sectionFilter !== "All" && e.section !== sectionFilter) return false;
    if (statusFilter !== "All" && e.rsaStatus !== statusFilter.toLowerCase()) return false;
    return true;
  });

  // Summary counts
  const total = empCertData.filter(e => ["Bar", "Floor"].includes(e.section)).length;
  const validCount = empCertData.filter(e => e.rsaStatus === "valid").length;
  const expiringCount = empCertData.filter(e => e.rsaStatus === "expiring").length;
  const expiredMissing = empCertData.filter(e => e.rsaStatus === "expired" || e.rsaStatus === "missing").length;

  // File upload handler
  const handleUpload = async (userId: string, file: File) => {
    if (!orgId) return;
    const path = `${orgId}/${userId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("certification-files").upload(path, file);
    if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); return; }
    
    const existing = certs?.find(c => c.user_id === userId && c.cert_type === "RSA");
    await upsertCert.mutateAsync({
      ...(existing ? { id: existing.id } : {}),
      org_id: orgId,
      user_id: userId,
      cert_type: "RSA",
      file_url: path,
      status: existing?.expiry_date ? getCertStatus(existing.expiry_date) : "missing",
    });
    toast({ title: "Certificate uploaded" });
  };

  const handleDrop = (userId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(userId, file);
  };

  // Inspector keyboard nav
  useEffect(() => {
    if (!inspectorOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setInspectorIdx(i => Math.min(i + 1, filtered.length - 1));
      if (e.key === "ArrowLeft") setInspectorIdx(i => Math.max(i - 1, 0));
      if (e.key === "Escape") setInspectorOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [inspectorOpen, filtered.length]);

  const copyTrainingLink = () => {
    const slug = currentOrg?.slug || "demo";
    navigator.clipboard.writeText(`${window.location.origin}/train/rsa/${slug}`);
    toast({ title: "Training link copied!" });
  };

  const inspectorEmp = filtered[inspectorIdx];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">RSA & Certifications</h1>
          <p className="text-sm text-muted-foreground">Track and verify staff certifications</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={copyTrainingLink}><Copy className="w-4 h-4 mr-2" />Copy Training Link</Button>
          <Button size="sm" variant="outline" onClick={() => { setInspectorIdx(0); setInspectorOpen(true); }}><ExternalLink className="w-4 h-4 mr-2" />Inspector View</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-foreground">{total}</p><p className="text-xs text-muted-foreground">Bar/Floor Staff</p></CardContent></Card>
        <Card className="border-green-600/30"><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-green-600">{validCount}</p><p className="text-xs text-muted-foreground">Valid RSA</p></CardContent></Card>
        <Card className="border-yellow-600/30"><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-yellow-600">{expiringCount}</p><p className="text-xs text-muted-foreground">Expiring (30d)</p></CardContent></Card>
        <Card className="border-destructive/30"><CardContent className="py-4 text-center"><p className="text-2xl font-bold text-destructive">{expiredMissing}</p><p className="text-xs text-muted-foreground">Expired / Missing</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search staff…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {SECTIONS.map(s => <Button key={s} variant={sectionFilter === s ? "default" : "outline"} size="sm" onClick={() => setSectionFilter(s)}>{s}</Button>)}
        </div>
        <div className="flex gap-1">
          {STATUSES.map(s => <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)}>{s}</Button>)}
        </div>
      </div>

      {/* Staff grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(emp => {
          const StatusIcon = CERT_ICONS[emp.rsaStatus];
          return (
            <Card key={emp.id} className="relative"
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop(emp.user_id)}
            >
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {emp.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{emp.full_name}</p>
                    <Badge variant="outline" className="text-xs mt-0.5">{emp.section}</Badge>
                  </div>
                  <StatusIcon className={`w-5 h-5 ${CERT_STATUS_COLORS[emp.rsaStatus]}`} />
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between"><span>RSA Status</span><span className={`font-medium capitalize ${CERT_STATUS_COLORS[emp.rsaStatus]}`}>{emp.rsaStatus}</span></div>
                  {emp.rsaCert?.expiry_date && <div className="flex justify-between"><span>Expiry</span><span>{format(new Date(emp.rsaCert.expiry_date), "dd MMM yyyy")}</span></div>}
                  {emp.rsaCert?.cert_number && <div className="flex justify-between"><span>Cert #</span><span>{emp.rsaCert.cert_number}</span></div>}
                  {emp.rsaCert?.verified_at && <div className="flex justify-between"><span>Verified</span><Badge variant="default" className="text-[10px] h-4">✓</Badge></div>}
                </div>

                <label className="flex items-center justify-center gap-2 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload cert</span>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.heic" onChange={e => { if (e.target.files?.[0]) handleUpload(emp.user_id, e.target.files[0]); }} />
                </label>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-8 text-muted-foreground">No employees match filters</div>
        )}
      </div>

      {/* Inspector quick-flip dialog */}
      <Dialog open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><ShieldCheck className="w-5 h-5" />Certificate Inspector</DialogTitle>
          </DialogHeader>
          {inspectorEmp && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" disabled={inspectorIdx === 0} onClick={() => setInspectorIdx(i => i - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{inspectorEmp.full_name}</p>
                  <p className="text-xs text-muted-foreground">{inspectorIdx + 1} of {filtered.length}</p>
                </div>
                <Button variant="ghost" size="sm" disabled={inspectorIdx >= filtered.length - 1} onClick={() => setInspectorIdx(i => i + 1)}><ChevronRight className="w-4 h-4" /></Button>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Section</p><p className="font-medium text-foreground">{inspectorEmp.section}</p></div>
                <div><p className="text-xs text-muted-foreground">RSA Status</p><p className={`font-medium capitalize ${CERT_STATUS_COLORS[inspectorEmp.rsaStatus]}`}>{inspectorEmp.rsaStatus}</p></div>
                <div><p className="text-xs text-muted-foreground">Cert Number</p><p className="font-medium text-foreground">{inspectorEmp.rsaCert?.cert_number || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Expiry Date</p><p className="font-medium text-foreground">{inspectorEmp.rsaCert?.expiry_date ? format(new Date(inspectorEmp.rsaCert.expiry_date), "dd MMM yyyy") : "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Issuing State</p><p className="font-medium text-foreground">{inspectorEmp.rsaCert?.issuing_state || "—"}</p></div>
                <div><p className="text-xs text-muted-foreground">Verified</p><p className="font-medium text-foreground">{inspectorEmp.rsaCert?.verified_at ? "✓ Yes" : "Not verified"}</p></div>
              </div>

              {inspectorEmp.rsaCert?.file_url && (
                <div className="border border-border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">Certificate file attached</p>
                  <Button size="sm" variant="outline" onClick={async () => {
                    const { data } = await supabase.storage.from("certification-files").createSignedUrl(inspectorEmp.rsaCert!.file_url!, 3600);
                    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                  }}>View / Download</Button>
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">Use ← → arrow keys to navigate</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabourCertifications;
