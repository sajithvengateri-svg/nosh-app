import { useState, useRef } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface StepImageUploadProps {
  recipeId: string;
  stepId: string;
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  bucketPath?: string;
  disabled?: boolean;
}

const StepImageUpload = ({
  recipeId,
  stepId,
  imageUrl,
  onImageChange,
  bucketPath = "methods",
  disabled = false,
}: StepImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${bucketPath}/${recipeId}/${stepId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("recipe-images")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Failed to upload image");
      console.error(uploadError);
      setUploading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage
      .from("recipe-images")
      .getPublicUrl(path);

    onImageChange(publicUrl.publicUrl);
    setUploading(false);
  };

  const handleDelete = async () => {
    if (!imageUrl) return;
    // Extract path from URL
    const parts = imageUrl.split("/recipe-images/");
    if (parts[1]) {
      await supabase.storage.from("recipe-images").remove([parts[1]]);
    }
    onImageChange(null);
  };

  if (imageUrl) {
    return (
      <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border group flex-shrink-0">
        <img src={imageUrl} alt="Step" className="w-full h-full object-cover" />
        {!disabled && (
          <button
            onClick={handleDelete}
            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleUpload}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        className={cn(
          "w-16 h-16 rounded-lg border-2 border-dashed border-muted-foreground/30",
          "flex items-center justify-center flex-shrink-0",
          "hover:border-primary/50 hover:bg-primary/5 transition-colors",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        ) : (
          <Camera className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
    </>
  );
};

export default StepImageUpload;
