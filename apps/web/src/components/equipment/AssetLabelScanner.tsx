import { useState, useRef } from "react";
import { Camera, Loader2, Upload, X, Scan, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExtractedData {
  name?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  voltage?: string;
  power?: string;
  manufacture_date?: string;
  warranty_info?: string;
  certifications?: string;
  additional_specs?: string;
  notes?: string;
}

interface AssetLabelScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataExtracted: (data: ExtractedData) => void;
}

export function AssetLabelScanner({ open, onOpenChange, onDataExtracted }: AssetLabelScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
      setExtractedData(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imagePreview) return;

    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("scan-asset-label", {
        body: { imageBase64: imagePreview },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setExtractedData(data.data);
      toast.success("Label scanned successfully!");
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Failed to scan label. Please try again.");
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
    onOpenChange(false);
  };

  const dataFields = [
    { key: "name", label: "Equipment Name" },
    { key: "manufacturer", label: "Manufacturer" },
    { key: "model", label: "Model" },
    { key: "serial_number", label: "Serial Number" },
    { key: "voltage", label: "Voltage" },
    { key: "power", label: "Power Rating" },
    { key: "manufacture_date", label: "Manufacture Date" },
    { key: "warranty_info", label: "Warranty Info" },
    { key: "certifications", label: "Certifications" },
    { key: "additional_specs", label: "Additional Specs" },
    { key: "notes", label: "Other Notes" },
  ];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Scan Asset Label
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Upload Area */}
          {!imagePreview ? (
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
              <Camera className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="font-medium">Upload Asset Label Photo</p>
              <p className="text-sm text-muted-foreground mt-1">
                Take a clear photo of the equipment label
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Image
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Asset label"
                  className="w-full rounded-lg max-h-48 object-contain bg-muted"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImagePreview(null);
                    setExtractedData(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {!extractedData && (
                <Button
                  onClick={handleScan}
                  disabled={scanning}
                  className="w-full"
                >
                  {scanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scanning Label...
                    </>
                  ) : (
                    <>
                      <Scan className="w-4 h-4 mr-2" />
                      Scan & Extract Data
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Extracted Data Preview */}
          {extractedData && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-medium">Data Extracted</span>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2 max-h-64 overflow-y-auto">
                {dataFields.map(({ key, label }) => {
                  const value = extractedData[key as keyof ExtractedData];
                  if (!value) return null;
                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{label}:</span>
                      <span className="font-medium text-right max-w-[60%]">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {extractedData && (
            <Button onClick={handleApply}>
              Apply to Form
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
