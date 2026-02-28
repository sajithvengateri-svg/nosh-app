import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollText, Search, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface ActivityEntry {
  id: string;
  user_name: string | null;
  action_type: string;
  entity_type: string;
  entity_name: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

const actionColors: Record<string, string> = {
  create: "bg-emerald-500/20 text-emerald-400",
  update: "bg-blue-500/20 text-blue-400",
  delete: "bg-red-500/20 text-red-400",
  complete: "bg-green-500/20 text-green-400",
  assign: "bg-purple-500/20 text-purple-400",
  import: "bg-amber-500/20 text-amber-400",
};

const AuditLogSettings = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [entityFilter, setEntityFilter] = useState("All");

  useEffect(() => {
    if (!user) return;
    const fetchLogs = async () => {
      setLoading(true);
      // Get user's org
      const { data: orgData } = await supabase.rpc("get_user_primary_org_id", { _user_id: user.id });
      if (!orgData) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("activity_log")
        .select("id, user_name, action_type, entity_type, entity_name, details, created_at")
        .eq("org_id", orgData)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data) setLogs(data as ActivityEntry[]);
      setLoading(false);
    };
    fetchLogs();
  }, [user]);

  const actionTypes = ["All", ...Array.from(new Set(logs.map(l => l.action_type)))];
  const entityTypes = ["All", ...Array.from(new Set(logs.map(l => l.entity_type)))];

  const filtered = logs.filter((l) => {
    const matchSearch =
      (l.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.entity_name || "").toLowerCase().includes(search.toLowerCase());
    const matchAction = actionFilter === "All" || l.action_type === actionFilter;
    const matchEntity = entityFilter === "All" || l.entity_type === entityFilter;
    return matchSearch && matchAction && matchEntity;
  });

  const handleExport = () => {
    const csv = [
      "Timestamp,User,Action,Entity Type,Entity Name,Details",
      ...filtered.map(l =>
        `${l.created_at},"${l.user_name || ""}",${l.action_type},${l.entity_type},"${l.entity_name || ""}","${JSON.stringify(l.details || {}).replace(/"/g, '""')}"`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="w-5 h-5" />
              Audit Log
            </CardTitle>
            <CardDescription>Append-only trail of who changed what across your organisation</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" /> Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by user or entity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              {actionTypes.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              {entityTypes.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ScrollText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No activity logged yet</p>
          </div>
        ) : (
          <div className="rounded-md border overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">When</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(l.created_at), "dd MMM yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">{l.user_name || "System"}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={actionColors[l.action_type] || "bg-muted text-muted-foreground"}
                      >
                        {l.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{l.entity_type}</TableCell>
                    <TableCell>{l.entity_name || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {logs.length} events • Last 200 entries
        </p>
      </CardContent>
    </Card>
  );
};

export default AuditLogSettings;
