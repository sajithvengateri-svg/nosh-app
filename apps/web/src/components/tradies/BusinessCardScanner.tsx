import { useState, useRef } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { scanBusinessCard } from "@/hooks/useTradies";
import { toast } from "sonner";

interface BusinessCardScannerProps {
  onExtracted: (data: {
    name?: string;
    company?: string;
    phone?: string;
    email?: string;
    website?: string;
    abn?: string;
    address?: string;
    category?: string;
    notes?: string;
  }) => void;
}

export default function BusinessCardScanner({ onExtracted }: BusinessCardScannerProps) {
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setScanning(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await scanBusinessCard(base64);
      if (result) {
        onExtracted(result);
        toast.success("Card scanned successfully");
      } else {
        toast.error("Could not extract data from card");
      }
    } catch (err) {
      toast.error("Scan failed");
      console.error(err);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        disabled={scanning}
        onClick={() => inputRef.current?.click()}
      >
        {scanning ? (
          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
        ) : (
          <Camera className="w-3 h-3 mr-1.5" />
        )}
        {scanning ? "Scanning..." : "Scan Business Card"}
      </Button>
    </div>
  );
}
