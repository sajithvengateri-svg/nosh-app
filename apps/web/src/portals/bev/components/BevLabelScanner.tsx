import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Loader2, X, Scan, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ScanType = "wine_label" | "spirit_label" | "beer_label" | "equipment_tag" | "barcode" | "invoice";

interface BevLabelScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanType: ScanType;
  title: string;
  onDataExtracted?: (data: Record<string, unknown>) => void;
}

export function BevLabelScanner({
  open, onOpenChange, scanType, title, onDataExtracted,
}: BevLabelScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      onDataExtracted?.(extractedData);
      handleClose();
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription>Take a photo or upload an image to scan with AI</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="font-medium text-foreground">Upload Image</p>
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
                <Badge className="absolute top-2 left-2" variant="secondary">{title}</Badge>
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
              <CheckCircle2 className="w-4 h-4 mr-2" /> Apply Data
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BevLabelScanner;
