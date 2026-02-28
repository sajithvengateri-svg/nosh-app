import { useState, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Upload, Loader2, X, Scan, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScannedIngredientData {
  name?: string;
  category?: string;
  suggested_unit?: string;
  estimated_cost_per_unit?: number;
  allergens?: string[];
  notes?: string;
  barcode_value?: string;
}

interface IngredientScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataExtracted: (data: ScannedIngredientData) => void;
}

export default function IngredientScanner({ open, onOpenChange, onDataExtracted }: IngredientScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"photo" | "barcode">("photo");
  const [extractedData, setExtractedData] = useState<ScannedIngredientData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
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
      const { data, error } = await supabase.functions.invoke("scan-ingredient", {
        body: { imageBase64: imagePreview, scanMode: scanMode === "barcode" ? "barcode" : "produce" },
      });
      if (error) throw error;
      if (data.error) { toast.error(data.error); return; }
      setExtractedData(data.data);
      toast.success("Ingredient identified!");
    } catch (err) {
      console.error("Scan error:", err);
      toast.error("Failed to scan. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleApply = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setImagePreview(null);
    setExtractedData(null);
    setScanMode("photo");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Scan Ingredient
          </DialogTitle>
          <DialogDescription>
            Point your camera at an ingredient or barcode to auto-identify it
          </DialogDescription>
        </DialogHeader>

        <Tabs value={scanMode} onValueChange={(v) => setScanMode(v as "photo" | "barcode")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photo">📸 Photo</TabsTrigger>
            <TabsTrigger value="barcode">🔖 Barcode</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {!imagePreview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Camera className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="font-medium text-foreground">
                {scanMode === "photo" ? "Photograph the ingredient" : "Scan a barcode"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {scanMode === "photo"
                  ? "Works with produce, meats, packaged goods & more"
                  : "Point at the barcode on any packaged product"}
              </p>
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
                  {scanMode === "photo" ? "Photo" : "Barcode"}
                </Badge>
              </div>
              {!extractedData && (
                <Button onClick={handleScan} disabled={scanning} className="w-full">
                  {scanning ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Identifying...</>
                  ) : (
                    <><Scan className="w-4 h-4 mr-2" />Identify Ingredient</>
                  )}
                </Button>
              )}
            </div>
          )}

          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

          {extractedData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Ingredient Identified</span>
              </div>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                {extractedData.name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{extractedData.name}</span>
                  </div>
                )}
                {extractedData.category && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Category:</span>
                    <span className="font-medium">{extractedData.category}</span>
                  </div>
                )}
                {extractedData.suggested_unit && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Unit:</span>
                    <span className="font-medium">{extractedData.suggested_unit}</span>
                  </div>
                )}
                {extractedData.estimated_cost_per_unit != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Est. Cost:</span>
                    <span className="font-medium">${extractedData.estimated_cost_per_unit}</span>
                  </div>
                )}
                {extractedData.allergens && extractedData.allergens.length > 0 && (
                  <div className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground">Allergens:</span>
                    <span className="font-medium text-right">{extractedData.allergens.join(", ")}</span>
                  </div>
                )}
                {extractedData.barcode_value && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Barcode:</span>
                    <span className="font-medium font-mono text-xs">{extractedData.barcode_value}</span>
                  </div>
                )}
                {extractedData.notes && (
                  <div className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground">Notes:</span>
                    <span className="font-medium text-right max-w-[60%]">{extractedData.notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          {extractedData && (
            <Button onClick={handleApply}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Apply to Form
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
