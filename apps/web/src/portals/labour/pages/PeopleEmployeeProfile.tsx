import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Briefcase, FileText, Clock, Award, AlertTriangle, CalendarOff, ShieldCheck, Upload, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrg } from "@/contexts/OrgContext";
import { useEmployeeDocuments, usePerformanceReviews, useEmployeeWarnings, useEmployeeMilestones } from "@/lib/shared/queries/peopleQueries";
import { useEmployeeCertifications, useUpsertCertification, getCertStatus, CERT_STATUS_COLORS } from "@/lib/shared/queries/certificationQueries";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const PeopleEmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data: employee } = useQuery({
    queryKey: ["employee_profile", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_profiles")
        .select("*, profiles!employee_profiles_user_id_fkey(full_name, email)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const userId = employee?.user_id;
  const { data: documents } = useEmployeeDocuments(userId, orgId);
  const { data: reviews } = usePerformanceReviews(orgId, userId);
  const { data: warnings } = useEmployeeWarnings(orgId, userId);
  const { data: milestones } = useEmployeeMilestones(orgId, userId);
  const { data: certifications } = useEmployeeCertifications(orgId, userId);
  const upsertCert = useUpsertCertification();

  const { data: lifecycle } = useQuery({
    queryKey: ["employee_lifecycle", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("employee_lifecycle").select("*").eq("user_id", userId!).order("event_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: absences } = useQuery({
    queryKey: ["absence_records", userId, orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from("absence_records").select("*").eq("user_id", userId!).eq("org_id", orgId!).order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId && !!orgId,
  });

  if (!employee) return <div className="p-6 text-center text-muted-foreground">Loading…</div>;

  const fullName = (employee as any).profiles?.full_name || employee.user_id?.slice(0, 8) || "Unknown";
  const section = Array.isArray(employee.section_tags) && (employee.section_tags as any[]).length > 0 ? (employee.section_tags as any[])[0] : "—";

  const warningPath = ["VERBAL", "FIRST_WRITTEN", "FINAL_WRITTEN", "SHOW_CAUSE", "TERMINATION"];
  const currentWarningLevel = warnings?.length ? warningPath.indexOf(warnings[0]?.warning_type) : -1;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <Button variant="ghost" size="sm" onClick={() => navigate("/labour/people/directory")}><ArrowLeft className="w-4 h-4 mr-2" />Directory</Button>

      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
          {fullName.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
          <div className="flex gap-2 mt-1 flex-wrap">
            <Badge variant="outline">{section}</Badge>
            {employee.classification && <Badge variant="secondary">{employee.classification}</Badge>}
            <Badge variant={employee.is_active ? "default" : "destructive"}>{employee.is_active ? "Active" : "Departed"}</Badge>
          </div>
          {employee.start_date && <p className="text-xs text-muted-foreground mt-1">Started {format(new Date(employee.start_date), "dd MMM yyyy")}</p>}
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview"><User className="w-3 h-3 mr-1" />Overview</TabsTrigger>
          <TabsTrigger value="employment"><Briefcase className="w-3 h-3 mr-1" />Employment</TabsTrigger>
          <TabsTrigger value="documents"><FileText className="w-3 h-3 mr-1" />Documents</TabsTrigger>
          <TabsTrigger value="timeline"><Clock className="w-3 h-3 mr-1" />Timeline</TabsTrigger>
          <TabsTrigger value="reviews"><Award className="w-3 h-3 mr-1" />Reviews</TabsTrigger>
          <TabsTrigger value="warnings"><AlertTriangle className="w-3 h-3 mr-1" />Warnings</TabsTrigger>
          <TabsTrigger value="absences"><CalendarOff className="w-3 h-3 mr-1" />Absences</TabsTrigger>
          <TabsTrigger value="certifications"><ShieldCheck className="w-3 h-3 mr-1" />Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="pt-4 grid md:grid-cols-2 gap-4">
              {([
                ["Full Name", fullName],
                ["DOB", employee.date_of_birth ? format(new Date(employee.date_of_birth), "dd MMM yyyy") : "—"],
                ["Address", employee.address || "—"],
                ["Emergency Contact", employee.emergency_contact_name ? `${employee.emergency_contact_name} (${employee.emergency_contact_phone || "—"})` : "—"],
                ["Section", section],
                ["Classification", employee.classification || "—"],
              ] as [string, string][]).map(([label, val]) => (
                <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium text-foreground">{val}</p></div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment">
          <Card>
            <CardContent className="pt-4 grid md:grid-cols-2 gap-4">
              {([
                ["Award", employee.award_code || "HIGA"],
                ["Pay Type", employee.pay_type || "—"],
                ["Annual Salary", employee.annual_salary ? `$${employee.annual_salary.toLocaleString()}` : "—"],
                ["Agreed Hours", employee.agreed_hours_per_week ? `${employee.agreed_hours_per_week}hrs/wk` : "—"],
                ["Employment Type", employee.employment_type || "—"],
                ["Supplies Own Tools", employee.supplies_own_tools ? "Yes" : "No"],
              ] as [string, string][]).map(([label, val]) => (
                <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium text-foreground">{val}</p></div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card><CardContent className="pt-4">
            {documents && documents.length > 0 ? documents.map((d) => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div><p className="text-sm font-medium text-foreground">{d.name}</p><p className="text-xs text-muted-foreground">{d.document_type} · {format(new Date(d.uploaded_at), "dd MMM yyyy")}</p></div>
                <div className="flex items-center gap-2">
                  {d.expires_at && new Date(d.expires_at) < new Date() && <Badge variant="destructive" className="text-xs">Expired</Badge>}
                  <Badge variant={d.is_verified ? "default" : "secondary"}>{d.is_verified ? "Verified" : "Pending"}</Badge>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">No documents</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card><CardContent className="pt-4">
            {lifecycle && lifecycle.length > 0 ? lifecycle.map((e: any) => (
              <div key={e.id} className="flex gap-3 py-2 border-b border-border last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div><p className="text-sm font-medium text-foreground">{e.event_type}</p><p className="text-xs text-muted-foreground">{format(new Date(e.event_date), "dd MMM yyyy")}</p></div>
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">No lifecycle events</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card><CardContent className="pt-4">
            {reviews && reviews.length > 0 ? reviews.map((r) => (
              <div key={r.id} className="py-2 border-b border-border last:border-0">
                <div className="flex justify-between"><p className="text-sm font-medium text-foreground">{r.review_type}</p><Badge variant="outline">{r.overall_score ? `${r.overall_score}/5` : "—"}</Badge></div>
                <p className="text-xs text-muted-foreground">{r.review_date ? format(new Date(r.review_date), "dd MMM yyyy") : "—"} · {r.status}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">No reviews</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="warnings">
          <Card><CardContent className="pt-4">
            <div className="flex gap-1 mb-4">
              {warningPath.map((w, i) => <div key={w} className={`flex-1 h-2 rounded ${i <= currentWarningLevel ? "bg-destructive" : "bg-muted"}`} />)}
            </div>
            {warnings && warnings.length > 0 ? warnings.map((w) => (
              <div key={w.id} className="py-2 border-b border-border last:border-0">
                <div className="flex justify-between"><p className="text-sm font-medium text-foreground">{w.warning_type.replace(/_/g, " ")}</p><span className="text-xs text-muted-foreground">{format(new Date(w.issued_at), "dd MMM yyyy")}</span></div>
                <p className="text-xs text-muted-foreground mt-1">{w.reason}</p>
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">No warnings</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="absences">
          <Card><CardContent className="pt-4">
            {absences && absences.length > 0 ? absences.map((a: any) => (
              <div key={a.id} className="flex justify-between py-2 border-b border-border last:border-0">
                <div><p className="text-sm font-medium text-foreground">{a.absence_type}</p><p className="text-xs text-muted-foreground">{format(new Date(a.date), "dd MMM yyyy")}</p></div>
                {a.hours_missed && <span className="text-sm text-muted-foreground">{a.hours_missed}hrs</span>}
              </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">No absences</p>}
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="certifications">
          <Card><CardContent className="pt-4 space-y-4">
            {certifications && certifications.length > 0 ? certifications.map((c: any) => {
              const status = getCertStatus(c.expiry_date);
              const StatusIcon = status === "valid" ? CheckCircle : status === "expiring" ? AlertTriangle : status === "expired" ? XCircle : MinusCircle;
              return (
                <div key={c.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-5 h-5 ${CERT_STATUS_COLORS[status]}`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.cert_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.cert_number && `#${c.cert_number} · `}
                        {c.issuing_state && `${c.issuing_state} · `}
                        {c.expiry_date ? `Expires ${format(new Date(c.expiry_date), "dd MMM yyyy")}` : "No expiry set"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={status === "valid" ? "default" : status === "expiring" ? "secondary" : "destructive"} className="capitalize text-xs">{status}</Badge>
                    {c.verified_at && <Badge variant="outline" className="text-xs">Verified ✓</Badge>}
                    {c.file_url && (
                      <Button size="sm" variant="ghost" onClick={async () => {
                        const { data } = await supabase.storage.from("certification-files").createSignedUrl(c.file_url, 3600);
                        if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                      }}>View</Button>
                    )}
                    {!c.verified_at && (
                      <Button size="sm" variant="outline" onClick={async () => {
                        await upsertCert.mutateAsync({ id: c.id, org_id: orgId, user_id: userId, cert_type: c.cert_type, verified_at: new Date().toISOString(), verified_by: userId });
                        toast({ title: "Certificate verified" });
                      }}>Verify</Button>
                    )}
                  </div>
                </div>
              );
            }) : <p className="text-sm text-muted-foreground text-center py-4">No certifications recorded</p>}

            <label className="flex items-center justify-center gap-2 py-3 border border-dashed border-border rounded-lg text-sm text-muted-foreground hover:bg-muted/50 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Upload new certification</span>
              <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.heic" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !orgId || !userId) return;
                const path = `${orgId}/${userId}/${Date.now()}_${file.name}`;
                const { error } = await supabase.storage.from("certification-files").upload(path, file);
                if (error) { toast({ title: "Upload failed", variant: "destructive" }); return; }
                await upsertCert.mutateAsync({ org_id: orgId, user_id: userId, cert_type: "RSA", file_url: path });
                toast({ title: "Certificate uploaded" });
              }} />
            </label>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PeopleEmployeeProfile;
