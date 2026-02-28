import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { useTraining } from "@/hooks/useTraining";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Safety", "Skills", "Certification", "Soft Skills", "Custom"] as const;
const ACCEPTED_TYPES = ".pdf,.jpg,.jpeg,.png,.webp,.docx,.txt";
const ACCEPTED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

interface TrainingUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TrainingUploadDialog({ open, onOpenChange }: TrainingUploadDialogProps) {
  const { createModule, uploadAndProcess, moduleLimit } = useTraining();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);

  const atLimit = moduleLimit.used >= moduleLimit.max;
  const canSubmit = title.trim() && category && file && !processing && !atLimit;

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setFile(null);
    setProcessing(false);
  };

  const handleFile = (f: File | undefined) => {
    if (f && ACCEPTED_MIME.includes(f.type)) {
      setFile(f);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setProcessing(true);
    try {
      const module = await createModule({ title: title.trim(), category });
      await uploadAndProcess({ materialId: module.id, file });
      resetForm();
      onOpenChange(false);
    } catch {
      setProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!processing) {
          resetForm();
          onOpenChange(v);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Training Module</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fire Safety Basics"
              disabled={processing}
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={processing}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File drop zone */}
          <div className="space-y-1.5">
            <Label className="text-xs">Material</Label>
            <button
              type="button"
              disabled={processing}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "w-full rounded-lg border-2 border-dashed p-6 text-center transition-colors",
                "hover:border-primary/50 hover:bg-muted/50",
                dragging && "border-primary bg-primary/5",
                file && "border-muted-foreground/30 bg-muted/30",
                processing && "pointer-events-none opacity-60"
              )}
            >
              {file ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 shrink-0" />
                  <span className="truncate max-w-[250px]">{file.name}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                  <Upload className="h-6 w-6" />
                  <span className="text-sm font-medium">
                    Drop file here or click to browse
                  </span>
                  <span className="text-xs">
                    PDF, images, DOCX, or TXT
                  </span>
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {/* Module limit indicator */}
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-xs">
            <span className="text-muted-foreground">
              {moduleLimit.used} of {moduleLimit.max} modules used
              <span className="ml-1 text-muted-foreground/70">({moduleLimit.tier} plan)</span>
            </span>
            {atLimit && (
              <span className="flex items-center gap-1 font-medium text-destructive">
                <AlertCircle className="h-3 w-3" />
                Upgrade to add more
              </span>
            )}
          </div>

          {/* Processing state */}
          {processing && (
            <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing with AI...
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Processing...
              </>
            ) : (
              "Create & Process"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
