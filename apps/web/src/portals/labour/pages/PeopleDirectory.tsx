import { useState } from "react";
import { Search, Plus, Users, LayoutGrid, List, CheckCircle, AlertTriangle, XCircle, MinusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useStaffCertifications, getCertStatus, CERT_STATUS_COLORS } from "@/lib/shared/queries/certificationQueries";

const CERT_ICONS: Record<string, typeof CheckCircle> = { valid: CheckCircle, expiring: AlertTriangle, expired: XCircle, missing: MinusCircle };

const PeopleDirectory = () => {
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "departed">("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const { data: employees } = useQuery({
    queryKey: ["employee_profiles", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_profiles")
        .select("*, profiles!employee_profiles_user_id_fkey(full_name)")
        .eq("org_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: certs } = useStaffCertifications(orgId);

  // Query today's rostered shifts
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: todayShifts } = useQuery({
    queryKey: ["today-roster-shifts", orgId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("labour_roster_shifts")
        .select("user_id")
        .eq("org_id", orgId!)
        .eq("date", today);
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const rosteredUserIds = new Set(todayShifts?.map(s => s.user_id) ?? []);

  const getName = (e: any) => e.profiles?.full_name || e.user_id?.slice(0, 8) || "—";
  const getSection = (e: any) => {
    const tags = e.section_tags as any;
    if (Array.isArray(tags) && tags.length > 0) return tags[0];
    return "—";
  };

  const getCertForUser = (userId: string, certType: string) => {
    const cert = certs?.find(c => c.user_id === userId && c.cert_type === certType);
    return cert ? getCertStatus(cert.expiry_date) : "missing";
  };

  const filtered = employees?.filter((e: any) => {
    const name = getName(e);
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "active" && !e.is_active) return false;
    if (filter === "departed" && e.is_active) return false;
    return true;
  }) ?? [];

  const CertBadge = ({ status }: { status: string }) => {
    const Icon = CERT_ICONS[status];
    return <Icon className={`w-3.5 h-3.5 ${CERT_STATUS_COLORS[status]}`} />;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employee Directory</h1>
          <p className="text-sm text-muted-foreground">{employees?.filter((e: any) => e.is_active).length ?? 0} active employees</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border border-border rounded-lg overflow-hidden">
            <Button variant={viewMode === "cards" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setViewMode("cards")}><LayoutGrid className="w-4 h-4" /></Button>
            <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm" className="rounded-none" onClick={() => setViewMode("table")}><List className="w-4 h-4" /></Button>
          </div>
          <Button size="sm" onClick={() => navigate("/labour/people/onboarding")}><Plus className="w-4 h-4 mr-2" />Add Employee</Button>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {(["all", "active", "departed"] as const).map(f => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">{f}</Button>
          ))}
        </div>
      </div>

      {viewMode === "cards" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.length > 0 ? filtered.map((e: any) => {
            const name = getName(e);
            const section = getSection(e);
            const isRostered = rosteredUserIds.has(e.user_id);
            const rsaStatus = getCertForUser(e.user_id, "RSA");
            const foodStatus = getCertForUser(e.user_id, "FOOD_SAFETY");
            const firstAidStatus = getCertForUser(e.user_id, "FIRST_AID");

            return (
              <Card key={e.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => navigate(`/labour/people/directory/${e.id}`)}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                        {name.charAt(0)}
                      </div>
                      {isRostered && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className="text-xs">{section}</Badge>
                        <Badge variant={e.is_active ? "default" : "secondary"} className="text-xs">{e.is_active ? "Active" : "Departed"}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>{e.classification || "—"}</span><span>{e.employment_type || "—"}</span></div>
                    {e.start_date && <p>Started {format(new Date(e.start_date), "dd MMM yyyy")}</p>}
                  </div>

                  {/* Cert indicators */}
                  <div className="flex items-center gap-3 pt-1 border-t border-border">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><CertBadge status={rsaStatus} /><span>RSA</span></div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><CertBadge status={foodStatus} /><span>Food</span></div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground"><CertBadge status={firstAidStatus} /><span>First Aid</span></div>
                  </div>
                </CardContent>
              </Card>
            );
          }) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />No employees found
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Section</TableHead>
                  <TableHead>Classification</TableHead>
                  <TableHead>RSA</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? filtered.map((e: any) => (
                  <TableRow key={e.id} className="cursor-pointer" onClick={() => navigate(`/labour/people/directory/${e.id}`)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {rosteredUserIds.has(e.user_id) && <div className="w-2 h-2 rounded-full bg-green-500" />}
                        {getName(e)}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{getSection(e)}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.classification || "—"}</TableCell>
                    <TableCell><CertBadge status={getCertForUser(e.user_id, "RSA")} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.start_date ? format(new Date(e.start_date), "dd MMM yyyy") : "—"}</TableCell>
                    <TableCell><Badge variant={e.is_active ? "default" : "secondary"}>{e.is_active ? "Active" : "Departed"}</Badge></TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />No employees found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PeopleDirectory;
