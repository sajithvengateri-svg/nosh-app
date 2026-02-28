import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Receipt, Upload, Archive, FileText, Loader2, Eye, Scan, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import InvoiceScannerDialog from "@/components/inventory/InvoiceScannerDialog";

const BevInvoices = () => {
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const { profile } = useAuth();
  const orgId = currentOrg?.id;
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await supabase
      .from("invoice_scans")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(50);
    setInvoices(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !orgId) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${orgId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("invoices").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(path);
      await supabase.from("invoice_scans").insert({
        org_id: orgId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        status: "archived",
        portal: "bev",
        scanned_by: profile?.user_id,
      } as any);
      toast.success("Invoice archived");
      load();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const recentInvoices = invoices.filter(i => {
    const d = new Date(i.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  });

  const archivedInvoices = invoices.filter(i => {
    const d = new Date(i.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d < weekAgo;
  });

  const filtered = (list: any[]) =>
    searchQuery ? list.filter(i => i.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) || i.supplier_name?.toLowerCase().includes(searchQuery.toLowerCase())) : list;

  const InvoiceCard = ({ inv }: { inv: any }) => (
    <Card key={inv.id}>
      <CardContent className="pt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{inv.supplier_name || inv.file_name || "Invoice"}</p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(inv.created_at), "dd MMM yyyy")}
              {inv.total ? ` · $${inv.total.toFixed(2)}` : ""}
              {inv.items_extracted ? ` · ${inv.items_extracted} items` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={inv.status === "completed" ? "default" : inv.status === "failed" ? "destructive" : "secondary"}>
            {inv.status}
          </Badge>
          {inv.file_url && (
            <Button size="sm" variant="ghost" asChild>
              <a href={inv.file_url} target="_blank" rel="noopener noreferrer"><Eye className="w-4 h-4" /></a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Beverage Invoices</h1>
          <p className="text-sm text-muted-foreground">Scan, upload, and archive supplier invoices</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setScannerOpen(true)}>
            <Camera className="w-4 h-4 mr-2" /> Scan Invoice
          </Button>
          <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            Archive
          </Button>
        </div>
      </motion.div>

      {/* Scan type quick-actions */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="card-elevated p-6">
        <h3 className="font-semibold mb-3 text-foreground">Quick Scan</h3>
        <p className="text-sm text-muted-foreground mb-4">Use AI-powered OCR to scan labels, tags, and codes</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Invoice", icon: FileText, type: "invoice", route: "" },
            { label: "Wine", icon: "🍷", type: "wine_label", route: "/bev/wine-intelligence" },
            { label: "Spirit", icon: "🥃", type: "spirit_label", route: "/bev/cellar" },
            { label: "Beer", icon: "🍺", type: "beer_label", route: "/bev/draught" },
            { label: "Equipment", icon: "🔧", type: "equipment_tag", route: "/bev/equipment" },
            { label: "Inventory", icon: "📱", type: "barcode", route: "/bev/stocktake" },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => {
                if (item.type === "invoice") {
                  setScannerOpen(true);
                } else {
                  navigate(item.route);
                }
              }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-background hover:bg-muted hover:border-primary/50 transition-colors"
            >
              {typeof item.icon === "string" ? (
                <span className="text-2xl">{item.icon}</span>
              ) : (
                <item.icon className="w-6 h-6 text-primary" />
              )}
              <span className="text-xs font-medium text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <Input placeholder="Search invoices..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="max-w-sm" />

      <Tabs defaultValue="recent">
        <TabsList>
          <TabsTrigger value="recent"><Receipt className="w-4 h-4 mr-1" /> Recent ({recentInvoices.length})</TabsTrigger>
          <TabsTrigger value="archive"><Archive className="w-4 h-4 mr-1" /> Archive ({archivedInvoices.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-3 mt-4">
          {loading ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
          ) : filtered(recentInvoices).length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No recent invoices. Upload or scan your first invoice.</CardContent></Card>
          ) : (
            filtered(recentInvoices).map(inv => <InvoiceCard key={inv.id} inv={inv} />)
          )}
        </TabsContent>

        <TabsContent value="archive" className="space-y-3 mt-4">
          {filtered(archivedInvoices).length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No archived invoices.</CardContent></Card>
          ) : (
            filtered(archivedInvoices).map(inv => <InvoiceCard key={inv.id} inv={inv} />)
          )}
        </TabsContent>
      </Tabs>

      <InvoiceScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} onComplete={load} />
    </div>
  );
};

export default BevInvoices;
