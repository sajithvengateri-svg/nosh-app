import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, Upload, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createFloorLayout, createTable } from "@/lib/shared/queries/resQueries";

interface RoomScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DetectedTable {
  suggested_name: string;
  zone: string;
  min_capacity: number;
  max_capacity: number;
  x_percent: number;
  y_percent: number;
  shape: string;
  width_percent: number;
  height_percent: number;
}

interface ScanResult {
  tables: DetectedTable[];
  room_dimensions: { aspect_ratio: number };
  zones: string[];
  features: string[];
}

const RoomScanDialog = ({ open, onOpenChange }: RoomScanDialogProps) => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [applying, setApplying] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScan = async () => {
    if (!imageData) return;
    setScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke("scan-room-layout", {
        body: { imageBase64: imageData },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Scan failed");
      setResult(data.data as ScanResult);
      toast.success(`Detected ${data.data.tables?.length || 0} tables`);
    } catch (err: any) {
      toast.error(err.message || "Scan failed");
    }
    setScanning(false);
  };

  const handleApply = async () => {
    if (!result || !orgId || !imageData) return;
    setApplying(true);
    try {
      // Upload image to storage
      const fileName = `${orgId}/${Date.now()}.jpg`;
      const base64Data = imageData.split(",")[1];
      const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      
      const { error: uploadError } = await supabase.storage
        .from("floor-layouts")
        .upload(fileName, binaryData, { contentType: "image/jpeg" });
      
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("floor-layouts").getPublicUrl(fileName);

      // Create floor layout
      const canvasW = 1200;
      const canvasH = Math.round(canvasW / (result.room_dimensions?.aspect_ratio || 1.5));
      await createFloorLayout({
        org_id: orgId,
        name: "Main Floor",
        canvas_width: canvasW,
        canvas_height: canvasH,
        background_url: urlData.publicUrl,
        is_active: true,
      });

      // Create tables from detected positions
      for (const dt of result.tables) {
        await createTable({
          org_id: orgId,
          name: dt.suggested_name,
          zone: dt.zone || "INDOOR",
          min_capacity: dt.min_capacity || 1,
          max_capacity: dt.max_capacity || 2,
          x_position: Math.round(dt.x_percent * canvasW),
          y_position: Math.round(dt.y_percent * canvasH),
          width: Math.round((dt.width_percent || 0.07) * canvasW),
          height: Math.round((dt.height_percent || 0.07) * canvasH),
          shape: dt.shape || "ROUND",
        });
      }

      qc.invalidateQueries({ queryKey: ["res_tables"] });
      qc.invalidateQueries({ queryKey: ["res_floor_layouts"] });
      toast.success("Floor layout applied! Fine-tune table positions below.");
      onOpenChange(false);
      setImageData(null);
      setResult(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to apply layout");
    }
    setApplying(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Room Scan</DialogTitle>
          <DialogDescription>
            Take a photo of your venue and AI will detect tables and create your floor plan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!imageData ? (
            <div
              className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Take a photo or upload an image of your venue</p>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
            </div>
          ) : (
            <>
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <img src={imageData} alt="Venue" className="w-full max-h-[400px] object-contain" />
                {result && (
                  <div className="absolute inset-0">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                      {result.tables.map((t, i) => (
                        <g key={i}>
                          <rect
                            x={t.x_percent * 100 - (t.width_percent || 0.04) * 50}
                            y={t.y_percent * 100 - (t.height_percent || 0.04) * 50}
                            width={(t.width_percent || 0.04) * 100}
                            height={(t.height_percent || 0.04) * 100}
                            fill="rgba(59,130,246,0.3)"
                            stroke="rgb(59,130,246)"
                            strokeWidth="0.5"
                            rx="1"
                          />
                          <text
                            x={t.x_percent * 100}
                            y={t.y_percent * 100}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize="2.5"
                            fontWeight="bold"
                          >
                            {t.suggested_name}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                )}
              </div>

              {result && (
                <div className="text-sm text-muted-foreground">
                  Detected <strong>{result.tables.length}</strong> tables across {result.zones?.join(", ") || "indoor"} zones.
                  {result.features?.length > 0 && ` Features: ${result.features.join(", ")}.`}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => { setImageData(null); setResult(null); }}>
                  Re-take
                </Button>
                {!result ? (
                  <Button onClick={handleScan} disabled={scanning}>
                    {scanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : "Scan Room"}
                  </Button>
                ) : (
                  <Button onClick={handleApply} disabled={applying}>
                    {applying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Applying...</> : <><Check className="w-4 h-4 mr-2" /> Apply Layout</>}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomScanDialog;
