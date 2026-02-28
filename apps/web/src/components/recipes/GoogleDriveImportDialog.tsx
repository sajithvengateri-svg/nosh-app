import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HardDrive,
  Loader2,
  Check,
  XCircle,
  CheckCircle2,
  FileText,
  FileImage,
  File,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Google Picker script URL
const PICKER_SCRIPT = "https://apis.google.com/js/api.js";
const GIS_SCRIPT = "https://accounts.google.com/gsi/client";

interface PickedFile {
  id: string;
  name: string;
  mimeType: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
  recipeName?: string;
  recipeId?: string;
}

interface GoogleDriveImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (recipeIds: string[]) => void;
  apiKey: string;
  clientId: string;
}

type Step = "pick" | "processing" | "complete";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

const GoogleDriveImportDialog = ({
  isOpen,
  onClose,
  onImportComplete,
  apiKey,
  clientId,
}: GoogleDriveImportDialogProps) => {
  const [step, setStep] = useState<Step>("pick");
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pickerLoading, setPickerLoading] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep("pick");
      setFiles([]);
      setCurrentIndex(0);
    }
  }, [isOpen]);

  const openPicker = useCallback(async () => {
    setPickerLoading(true);
    try {
      await Promise.all([loadScript(PICKER_SCRIPT), loadScript(GIS_SCRIPT)]);

      // Request OAuth token via Google Identity Services
      const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/drive.readonly",
        callback: (response: any) => {
          if (response.error) {
            toast.error("Google sign-in failed");
            setPickerLoading(false);
            return;
          }

          setAccessToken(response.access_token);

          // Load Picker API and open
          (window as any).gapi.load("picker", () => {
            const docsView = new (window as any).google.picker.DocsView()
              .setIncludeFolders(true)
              .setSelectFolderEnabled(false)
              .setMimeTypes(
                "image/jpeg,image/png,image/webp,application/pdf,application/vnd.google-apps.document,application/vnd.google-apps.spreadsheet,text/plain"
              );

            const picker = new (window as any).google.picker.PickerBuilder()
              .addView(docsView)
              .setOAuthToken(response.access_token)
              .setDeveloperKey(apiKey)
              .enableFeature((window as any).google.picker.Feature.MULTISELECT_ENABLED)
              .setTitle("Select recipe files to import")
              .setCallback((data: any) => {
                if (data.action === "picked") {
                  const picked: PickedFile[] = data.docs.map((doc: any) => ({
                    id: doc.id,
                    name: doc.name,
                    mimeType: doc.mimeType,
                    status: "pending" as const,
                  }));
                  setFiles(picked);
                }
                setPickerLoading(false);
              })
              .build();

            picker.setVisible(true);
          });
        },
      });

      tokenClient.requestAccessToken();
    } catch (err) {
      console.error("Failed to load Google Picker:", err);
      toast.error("Failed to load Google Drive picker");
      setPickerLoading(false);
    }
  }, [apiKey, clientId]);

  const processFiles = async () => {
    if (files.length === 0 || !accessToken) return;
    setStep("processing");
    setCurrentIndex(0);

    // Fetch ingredients for matching
    const { data: ingData } = await supabase
      .from("ingredients")
      .select("id, name, unit, cost_per_unit");

    const { data: { user } } = await supabase.auth.getUser();

    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      setCurrentIndex(i);
      updatedFiles[i].status = "processing";
      setFiles([...updatedFiles]);

      try {
        // Call gdrive-download edge function which downloads + extracts
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gdrive-download?ingredients=${encodeURIComponent(JSON.stringify(ingData || []))}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileId: updatedFiles[i].id,
              accessToken,
              mimeType: updatedFiles[i].mimeType,
              fileName: updatedFiles[i].name,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to process file");
        }

        const result = await response.json();

        if (!result.success || !result.recipe) {
          throw new Error("No recipe data extracted");
        }

        const extractedRecipe = result.recipe;

        // Save recipe to database
        const { data: recipe, error: recipeError } = await supabase
          .from("recipes")
          .insert({
            name: extractedRecipe.name,
            description: extractedRecipe.description,
            category: extractedRecipe.category,
            servings: extractedRecipe.servings,
            prep_time: extractedRecipe.prep_time,
            cook_time: extractedRecipe.cook_time,
            instructions: extractedRecipe.instructions,
            allergens: extractedRecipe.allergens,
            created_by: user?.id,
          })
          .select()
          .single();

        if (recipeError) throw recipeError;

        // Insert matched ingredients
        const matchedIngredients = extractedRecipe.ingredients
          .filter((ing: any) => ing.matched_ingredient_id)
          .map((ing: any) => ({
            recipe_id: recipe.id,
            ingredient_id: ing.matched_ingredient_id,
            quantity: ing.quantity,
            unit: ing.unit,
            notes: ing.name !== ing.matched_ingredient_name ? `Original: ${ing.name}` : null,
          }));

        if (matchedIngredients.length > 0) {
          await supabase.from("recipe_ingredients").insert(matchedIngredients);
        }

        updatedFiles[i].status = "success";
        updatedFiles[i].recipeName = extractedRecipe.name;
        updatedFiles[i].recipeId = recipe.id;
      } catch (err) {
        console.error(`Error processing ${updatedFiles[i].name}:`, err);
        updatedFiles[i].status = "error";
        updatedFiles[i].error = err instanceof Error ? err.message : "Unknown error";
      }

      setFiles([...updatedFiles]);
    }

    setStep("complete");
  };

  const handleClose = () => {
    const successIds = files
      .filter((f) => f.status === "success" && f.recipeId)
      .map((f) => f.recipeId!);
    if (successIds.length > 0) {
      onImportComplete(successIds);
    }
    setStep("pick");
    setFiles([]);
    setCurrentIndex(0);
    setAccessToken(null);
    onClose();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <FileImage className="w-5 h-5" />;
    if (mimeType.includes("pdf") || mimeType.includes("document"))
      return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const progress = files.length > 0 ? ((currentIndex + 1) / files.length) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Import from Google Drive
          </DialogTitle>
          <DialogDescription>
            {step === "pick" && "Select recipe files from your Google Drive"}
            {step === "processing" && "Processing your files through AI extraction..."}
            {step === "complete" && "Import complete!"}
          </DialogDescription>
        </DialogHeader>

        {/* Pick step */}
        {step === "pick" && (
          <div className="space-y-4">
            {files.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <HardDrive className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  Browse your Google Drive and select recipe photos, PDFs, or documents
                </p>
                <Button onClick={openPicker} disabled={pickerLoading}>
                  {pickerLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <HardDrive className="w-4 h-4 mr-2" />
                  )}
                  Open Google Drive
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="max-h-60">
                  <div className="space-y-2">
                    {files.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        {getFileIcon(f.mimeType)}
                        <span className="text-sm truncate flex-1">{f.name}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={openPicker} disabled={pickerLoading}>
                    Pick More
                  </Button>
                  <Button onClick={processFiles} className="flex-1">
                    Import {files.length} file{files.length !== 1 && "s"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Processing step */}
        {step === "processing" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Processing {currentIndex + 1} of {files.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
            <ScrollArea className="max-h-60">
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div
                    key={f.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg",
                      f.status === "processing" && "bg-primary/10",
                      f.status === "success" && "bg-emerald-500/10",
                      f.status === "error" && "bg-destructive/10"
                    )}
                  >
                    {f.status === "processing" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                    {f.status === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {f.status === "error" && <XCircle className="w-4 h-4 text-destructive" />}
                    {f.status === "pending" && <div className="w-4 h-4" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{f.name}</p>
                      {f.recipeName && (
                        <p className="text-xs text-muted-foreground">→ {f.recipeName}</p>
                      )}
                      {f.error && <p className="text-xs text-destructive">{f.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Complete step */}
        {step === "complete" && (
          <div className="space-y-4 text-center py-4">
            {successCount > 0 ? (
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
            ) : (
              <AlertTriangle className="w-12 h-12 mx-auto text-amber-500" />
            )}
            <div>
              <p className="text-lg font-medium">
                {successCount} recipe{successCount !== 1 && "s"} imported
              </p>
              {errorCount > 0 && (
                <p className="text-sm text-destructive">{errorCount} failed</p>
              )}
            </div>
            <ScrollArea className="max-h-40">
              <div className="space-y-1">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 text-sm">
                    {f.status === "success" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-destructive" />
                    )}
                    <span className="truncate">{f.recipeName || f.name}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          {step === "complete" && (
            <Button onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GoogleDriveImportDialog;
