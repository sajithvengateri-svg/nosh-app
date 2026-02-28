import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Download, CheckCircle2, XCircle, Flag, StickyNote } from "lucide-react";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  qualified: { label: "Qualified", variant: "secondary" },
  credited: { label: "Credited", variant: "default" },
  voided: { label: "Voided", variant: "destructive" },
  completed: { label: "Completed", variant: "default" },
};

const AdminReferralManagement = () => {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchReferrals = async () => {
    setLoading(true);
    const { data } = await supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(200);
    setReferrals(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchReferrals(); }, []);

  const filtered = referrals.filter((r: any) => {
    if (statusFilter !== "all" && (r.reward_status || r.status) !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (r.referred_email || "").toLowerCase().includes(s) || (r.referral_code || "").toLowerCase().includes(s);
    }
    return true;
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("referrals").update({ reward_status: status }).eq("id", id);
    if (error) toast.error("Failed to update");
    else { toast.success(`Updated to ${status}`); fetchReferrals(); }
  };

  const bulkAction = async (action: string) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const status = action === "approve" ? "credited" : "voided";
    for (const id of ids) {
      await supabase.from("referrals").update({ reward_status: status }).eq("id", id);
    }
    toast.success(`${ids.length} referrals updated to ${status}`);
    setSelected(new Set());
    fetchReferrals();
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const exportCSV = () => {
    const headers = ["Referral Code", "Referred Email", "Channel", "Status", "Reward", "Date"];
    const rows = filtered.map((r: any) => [
      r.referral_code, r.referred_email || "", r.channel || "", r.reward_status || r.status, r.reward_value || "", r.created_at,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "referrals.csv"; a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Referral Management</h1>
        <p className="text-sm text-muted-foreground">View, credit, void, and manage all referrals.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search email or code..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="credited">Credited</SelectItem>
            <SelectItem value="voided">Voided</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCSV}><Download className="w-3 h-3 mr-1" /> CSV</Button>
        {selected.size > 0 && (
          <>
            <Button size="sm" onClick={() => bulkAction("approve")}><CheckCircle2 className="w-3 h-3 mr-1" /> Credit ({selected.size})</Button>
            <Button size="sm" variant="destructive" onClick={() => bulkAction("void")}><XCircle className="w-3 h-3 mr-1" /> Void ({selected.size})</Button>
          </>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Referred Email</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Reward</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No referrals found</TableCell></TableRow>
              ) : (
                filtered.map((r: any) => {
                  const status = r.reward_status || r.status || "pending";
                  const cfg = statusConfig[status] || statusConfig.pending;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} />
                      </TableCell>
                      <TableCell className="text-sm">{r.referred_email || "—"}</TableCell>
                      <TableCell className="text-sm capitalize">{r.channel || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(r.created_at), "dd MMM yyyy")}</TableCell>
                      <TableCell><Badge variant={cfg.variant}>{cfg.label}</Badge></TableCell>
                      <TableCell className="text-right text-sm">{r.reward_value ? `$${Number(r.reward_value).toFixed(2)}` : "—"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" title="Credit" onClick={() => updateStatus(r.id, "credited")}>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Void" onClick={() => updateStatus(r.id, "voided")}>
                            <XCircle className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReferralManagement;
