import { useState, useEffect } from "react";
import { FileText, Download, Loader2, Filter, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InvoiceScan {
  id: string;
  file_name: string | null;
  file_url: string | null;
  invoice_type: string;
  supplier_name: string | null;
  total_amount: number | null;
  items_extracted: number;
  items_matched: number;
  prices_updated: number;
  status: string;
  created_at: string;
  notes: string | null;
}

const typeColors: Record<string, string> = {
  food: "bg-success/10 text-success border-success/20",
  equipment: "bg-primary/10 text-primary border-primary/20",
  cleaning: "bg-accent/10 text-accent-foreground border-accent/20",
  other: "bg-muted text-muted-foreground border-border",
};

const InvoiceArchive = () => {
  const [scans, setScans] = useState<InvoiceScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    const { data, error } = await supabase
      .from("invoice_scans")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setScans((data as any[]) || []);
    }
    setLoading(false);
  };

  const getDownloadUrl = async (fileUrl: string) => {
    const { data } = await supabase.storage.from("invoices").createSignedUrl(fileUrl, 3600);
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  const filtered = typeFilter === "all" ? scans : scans.filter(s => s.invoice_type === typeFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="equipment">Equipment</SelectItem>
            <SelectItem value="cleaning">Cleaning</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} invoices</span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">No archived invoices</p>
          <p className="text-sm text-muted-foreground mt-1">Scanned invoices will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((scan) => (
            <div key={scan.id} className="card-elevated p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-muted">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-medium truncate">{scan.file_name || "Untitled"}</p>
                  <Badge variant="outline" className={cn("text-xs capitalize", typeColors[scan.invoice_type] || typeColors.other)}>
                    {scan.invoice_type}
                  </Badge>
                  {scan.status === "archived" && (
                    <Badge variant="secondary" className="text-xs">Saved only</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{format(new Date(scan.created_at), "dd MMM yyyy, HH:mm")}</span>
                  {scan.supplier_name && <span>· {scan.supplier_name}</span>}
                  {scan.total_amount != null && <span>· ${Number(scan.total_amount).toFixed(2)}</span>}
                  {scan.items_extracted > 0 && <span>· {scan.items_extracted} items</span>}
                </div>
              </div>
              {scan.file_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => getDownloadUrl(scan.file_url!)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceArchive;
