import { useState, useEffect } from "react";
import { FileText, Loader2, CheckCircle2, XCircle, Clock, Archive, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface InvoiceScan {
  id: string;
  file_name: string | null;
  file_url: string | null;
  invoice_type: string;
  items_extracted: number;
  items_matched: number;
  prices_updated: number;
  status: string;
  created_at: string;
}

const typeColors: Record<string, string> = {
  food: "bg-success/10 text-success",
  equipment: "bg-primary/10 text-primary",
  cleaning: "bg-accent/10 text-accent-foreground",
  other: "bg-muted text-muted-foreground",
};

const RecentScans = () => {
  const [scans, setScans] = useState<InvoiceScan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScans = async () => {
      const { data, error } = await supabase
        .from("invoice_scans")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error) setScans((data as any[]) || []);
      setLoading(false);
    };
    fetchScans();
  }, []);

  const statusConfig: Record<string, { icon: typeof CheckCircle2; className: string; label: string }> = {
    completed: { icon: CheckCircle2, className: "text-success", label: "Completed" },
    failed: { icon: XCircle, className: "text-destructive", label: "Failed" },
    processing: { icon: Clock, className: "text-warning", label: "Processing" },
    archived: { icon: Archive, className: "text-muted-foreground", label: "Archived" },
  };

  const getDownloadUrl = async (fileUrl: string) => {
    const { data } = await supabase.storage.from("invoices").createSignedUrl(fileUrl, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (loading) return (
    <div className="card-elevated p-6">
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    </div>
  );

  if (scans.length === 0) return null;

  return (
    <div className="card-elevated p-6">
      <h3 className="font-semibold mb-4">Recent Scans</h3>
      <div className="space-y-3">
        {scans.map((scan) => {
          const config = statusConfig[scan.status] || statusConfig.processing;
          const StatusIcon = config.icon;

          return (
            <div key={scan.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="p-2 rounded-lg bg-background">
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium truncate">{scan.file_name || "Untitled scan"}</p>
                  <Badge variant="outline" className={cn("text-[10px] capitalize px-1.5 py-0", typeColors[scan.invoice_type] || "")}>
                    {scan.invoice_type}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(scan.created_at), "dd MMM yyyy, HH:mm")}
                  {scan.items_extracted > 0 && ` · ${scan.items_extracted} items extracted · ${scan.items_matched} matched`}
                </p>
              </div>
              {scan.file_url && (
                <button onClick={() => getDownloadUrl(scan.file_url!)} className="p-1.5 rounded hover:bg-muted">
                  <Download className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
              <div className={cn("flex items-center gap-1 text-xs font-medium", config.className)}>
                <StatusIcon className="w-3.5 h-3.5" />
                {config.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentScans;
