import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Camera, Upload, Loader2, X, Scan, CheckCircle2, Wine, Beer, GlassWater,
  QrCode, Wrench, FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type ScanType = "wine_label" | "spirit_label" | "beer_label" | "equipment_tag" | "barcode" | "invoice";

const SCAN_TYPE_CONFIG: Record<ScanType, { label: string; icon: React.ElementType; color: string; route: string }> = {
  wine_label: { label: "Wine Label", icon: Wine, color: "text-rose-500", route: "/bev/wine-intelligence" },
  spirit_label: { label: "Spirit Label", icon: GlassWater, color: "text-amber-500", route: "/bev/cellar" },
  beer_label: { label: "Beer Label", icon: Beer, color: "text-yellow-500", route: "/bev/draught" },
  equipment_tag: { label: "Equipment Tag", icon: Wrench, color: "text-blue-500", route: "/bev/equipment" },
  barcode: { label: "QR / Barcode", icon: QrCode, color: "text-green-500", route: "/bev/stocktake" },
  invoice: { label: "Invoice OCR", icon: FileText, color: "text-purple-500", route: "/bev/invoices" },
};

interface BevUniversalScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultScanType?: ScanType;
  onDataExtracted?: (data: Record<string, unknown>, scanType: ScanType) => void;
  /** If true, navigates to the relevant page after applying data */
  navigateOnApply?: boolean;
}

export function BevUniversalScanner({
  open, onOpenChange, defaultScanType, onDataExtracted, navigateOnApply = true,
}: BevUniversalScannerProps) {
  const [scanType, setScanType] = useState<ScanType>(defaultScanType || "wine_label");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Please select an image or PDF file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string);
      setExtractedData(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imagePreview) return;
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("scan-bev-label", {
        body: { imageBase64: imagePreview, scanType },
      });
      if (error) throw error;
      if (data.error) { toast.error(data.error); return; }
      setExtractedData(data.data);
      toast.success("Scan complete!");
    } catch (err) {
      console.error("Scan error:", err);
      toast.error("Failed to scan. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleApply = () => {
    if (extractedData) {
      onDataExtracted?.(extractedData, scanType);
      const targetRoute = SCAN_TYPE_CONFIG[scanType].route;
      handleClose();
      if (navigateOnApply) {
        toast.success(`Navigating to ${SCAN_TYPE_CONFIG[scanType].label} section`);
        navigate(targetRoute);
      }
    }
  };

  const handleClose = () => {
    setImagePreview(null);
    setExtractedData(null);
    onOpenChange(false);
  };

  const renderExtractedData = (data: Record<string, unknown>) => {
    const entries = Object.entries(data).filter(([, v]) => v != null && v !== "");
    return (
      <div className="bg-muted/50 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
        {entries.map(([key, value]) => {
          if (key === "items" && Array.isArray(value)) {
            return (
              <div key={key} className="space-y-1">
                <span className="text-sm font-medium text-foreground">Items ({value.length}):</span>
                {value.map((item: any, i: number) => (
                  <div key={i} className="pl-3 text-xs border-l-2 border-primary/30 py-1">
                    <span className="font-medium">{item.name}</span>
                    {item.quantity && <span className="text-muted-foreground"> × {item.quantity} {item.unit}</span>}
                    {item.unit_price != null && <span className="text-muted-foreground"> @ ${item.unit_price}</span>}
                  </div>
                ))}
              </div>
            );
          }
          return (
            <div key={key} className="flex justify-between text-sm gap-2">
              <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}:</span>
              <span className="font-medium text-right max-w-[60%] truncate">{String(value)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const ActiveIcon = SCAN_TYPE_CONFIG[scanType].icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            AI Scanner
          </DialogTitle>
          <DialogDescription>Scan labels, tags, barcodes, or invoices with AI-powered OCR</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scan Type Selector */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(SCAN_TYPE_CONFIG) as [ScanType, typeof SCAN_TYPE_CONFIG[ScanType]][]).map(([type, cfg]) => {
              const Icon = cfg.icon;
              return (
                <button
                  key={type}
                  onClick={() => { setScanType(type); setExtractedData(null); }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-lg border text-xs font-medium transition-colors",
                    scanType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={cn("w-5 h-5", scanType === type ? cfg.color : "")} />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Destination hint */}
          <p className="text-xs text-muted-foreground text-center">
            Results will open in <span className="font-medium text-foreground">{SCAN_TYPE_CONFIG[scanType].route.replace("/bev/", "").replace("-", " ")}</span>
          </p>

          {/* Image Upload */}
          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <ActiveIcon className={cn("w-12 h-12 mx-auto mb-3", SCAN_TYPE_CONFIG[scanType].color, "opacity-50")} />
              <p className="font-medium text-foreground">Upload {SCAN_TYPE_CONFIG[scanType].label}</p>
              <p className="text-sm text-muted-foreground mt-1">Take a photo or choose an image</p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  <Upload className="w-4 h-4 mr-1" /> Choose File
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <img src={imagePreview} alt="Scan preview" className="w-full rounded-lg max-h-48 object-contain bg-muted" />
                <Button variant="secondary" size="icon" className="absolute top-2 right-2"
                  onClick={() => { setImagePreview(null); setExtractedData(null); }}>
                  <X className="w-4 h-4" />
                </Button>
                <Badge className="absolute top-2 left-2" variant="secondary">
                  {SCAN_TYPE_CONFIG[scanType].label}
                </Badge>
              </div>
              {!extractedData && (
                <Button onClick={handleScan} disabled={scanning} className="w-full">
                  {scanning ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scanning...</>
                  ) : (
                    <><Scan className="w-4 h-4 mr-2" />Scan & Extract</>
                  )}
                </Button>
              )}
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*,.pdf" capture="environment" className="hidden" onChange={handleFileSelect} />

          {/* Results */}
          {extractedData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Data Extracted</span>
              </div>
              {renderExtractedData(extractedData)}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          {extractedData && (
            <Button onClick={handleApply}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Apply & Go
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BevUniversalScanner;
