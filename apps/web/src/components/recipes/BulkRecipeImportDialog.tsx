import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileImage,
  FileText,
  X,
  Loader2,
  Check,
  AlertTriangle,
  Camera,
  File,
  ChefHat,
  CheckCircle2,
  XCircle,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useOrg } from "@/contexts/OrgContext";

interface FileWithStatus {
  file: File;
  id: string;
  status: "pending" | "processing" | "success" | "error";
  error?: string;
  recipeName?: string;
  recipeId?: string;
}

interface BulkRecipeImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (recipeIds: string[]) => void;
}

const VALID_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/heic",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/plain",
  "text/csv",
];

const VALID_EXTENSIONS = /\.(jpg|jpeg|png|webp|heic|pdf|doc|docx|txt|xlsx|xls|csv|numbers|pages)$/i;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const LARGE_FILE_THRESHOLD = 5 * 1024 * 1024;

function getFileTypeBadge(file: File): { label: string; variant: "default" | "secondary" | "outline" } {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv") || name.endsWith(".numbers")) return { label: "Spreadsheet", variant: "default" };
  if (name.endsWith(".docx") || name.endsWith(".doc") || name.endsWith(".pages")) return { label: "Document", variant: "secondary" };
  if (file.type === "application/pdf") return { label: "PDF", variant: "outline" };
  if (file.type.startsWith("image/")) return { label: "Image", variant: "outline" };
  return { label: "File", variant: "outline" };
}

type ImportStep = "upload" | "processing" | "complete";

const BulkRecipeImportDialog = ({ isOpen, onClose, onImportComplete }: BulkRecipeImportDialogProps) => {
  const { currentOrg } = useOrg();
  const [step, setStep] = useState<ImportStep>("upload");
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [ingredients, setIngredients] = useState<{ id: string; name: string; unit: string; cost_per_unit: number }[]>([]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(e.target.files || []));
  };

  const handleFiles = (newFiles: File[]) => {
    const validFiles: File[] = [];
    const skipped: string[] = [];

    for (const file of newFiles) {
      const typeOk = VALID_TYPES.includes(file.type) || file.name.match(VALID_EXTENSIONS);
      if (!typeOk) { skipped.push(`${file.name}: unsupported type`); continue; }
      if (file.size > MAX_FILE_SIZE) { skipped.push(`${file.name}: too large`); continue; }
      validFiles.push(file);
    }

    if (skipped.length > 0) {
      toast.warning(`${skipped.length} file(s) skipped. Try exporting to PDF or Excel.`);
    }

    const filesWithStatus: FileWithStatus[] = validFiles.map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      status: "pending",
    }));

    setFiles(prev => [...prev, ...filesWithStatus]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    setStep("processing");
    setCurrentIndex(0);

    const { data: ingData } = await supabase.from("ingredients").select("id, name, unit, cost_per_unit");
    setIngredients(ingData || []);
    const { data: { user } } = await supabase.auth.getUser();

    const updatedFiles = [...files];
    
    for (let i = 0; i < updatedFiles.length; i++) {
      setCurrentIndex(i);
      updatedFiles[i].status = "processing";
      setFiles([...updatedFiles]);

      try {
        const formData = new FormData();
        formData.append("file", updatedFiles[i].file);
        formData.append("ingredients", JSON.stringify(ingData || []));

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-recipe`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
            body: formData,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to extract recipe");
        }

        const result = await response.json();
        if (!result.success || !result.recipe) throw new Error("No recipe data extracted");

        const extractedRecipe = result.recipe;

        // Auto-create unmatched ingredients
        const unmatchedIngs = (extractedRecipe.ingredients || []).filter(
          (ing: any) => !ing.matched_ingredient_id && ing.name?.trim()
        );
        const updatedIngs = [...(extractedRecipe.ingredients || [])];

        if (unmatchedIngs.length > 0) {
          const toCreate = unmatchedIngs.map((ing: any) => ({
            name: ing.name.trim(),
            unit: ing.unit || "each",
            category: "Other",
            cost_per_unit: 0,
            org_id: currentOrg?.id,
          }));

          const { data: created, error: createErr } = await supabase
            .from("ingredients")
            .insert(toCreate as any)
            .select("id, name");

          if (!createErr && created) {
            for (const c of created) {
              const idx = updatedIngs.findIndex(
                (x: any) => !x.matched_ingredient_id && x.name?.trim().toLowerCase() === c.name.toLowerCase()
              );
              if (idx !== -1) {
                updatedIngs[idx] = { ...updatedIngs[idx], matched_ingredient_id: c.id, matched_ingredient_name: c.name };
              }
            }
          }
        }

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
            org_id: currentOrg?.id,
          } as any)
          .select()
          .single();

        if (recipeError) throw recipeError;

        // Insert recipe_ingredients
        const matchedIngredients = updatedIngs
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

        // Insert method steps
        if (extractedRecipe.instructions && extractedRecipe.instructions.length > 0) {
          const methodSteps = extractedRecipe.instructions
            .filter((inst: string) => inst.trim())
            .map((inst: string, idx: number) => ({
              org_id: currentOrg?.id,
              recipe_id: recipe.id,
              section_number: 1,
              section_title: "Method",
              step_number: idx + 1,
              instruction: inst.trim(),
              sort_order: idx,
            }));

          if (methodSteps.length > 0) {
            await supabase.from("recipe_method_steps").insert(methodSteps as any);
          }
        }

        updatedFiles[i].status = "success";
        updatedFiles[i].recipeName = extractedRecipe.name;
        updatedFiles[i].recipeId = recipe.id;
      } catch (err) {
        console.error(`Error processing ${updatedFiles[i].file.name}:`, err);
        updatedFiles[i].status = "error";
        updatedFiles[i].error = err instanceof Error ? err.message : "Unknown error";
      }

      setFiles([...updatedFiles]);
    }

    setStep("complete");
  };

  const handleClose = () => {
    const successIds = files.filter(f => f.status === "success" && f.recipeId).map(f => f.recipeId!);
    if (successIds.length > 0) onImportComplete(successIds);
    setStep("upload");
    setFiles([]);
    setCurrentIndex(0);
    onClose();
  };

  const getFileIcon = (file: File) => {
    const name = file.name.toLowerCase();
    if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv") || name.endsWith(".numbers")) return <FileSpreadsheet className="w-5 h-5" />;
    if (file.type.startsWith("image/")) return <FileImage className="w-5 h-5" />;
    if (file.type === "application/pdf") return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const successCount = files.filter(f => f.status === "success").length;
  const errorCount = files.filter(f => f.status === "error").length;
  const progress = files.length > 0 ? ((currentIndex + 1) / files.length) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Bulk Import Recipes
          </DialogTitle>
          <DialogDescription>
            Upload multiple recipe files to import them all at once
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Upload Step */}
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 flex-1 overflow-hidden flex flex-col"
            >
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-6 text-center transition-all",
                  dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                )}
              >
                <div className="space-y-3">
                  <div className="flex justify-center gap-3">
                    <div className="p-3 rounded-full bg-muted"><Camera className="w-6 h-6 text-muted-foreground" /></div>
                    <div className="p-3 rounded-full bg-muted"><FileImage className="w-6 h-6 text-muted-foreground" /></div>
                    <div className="p-3 rounded-full bg-muted"><FileSpreadsheet className="w-6 h-6 text-muted-foreground" /></div>
                  </div>
                  <div>
                    <p className="font-medium">Drop recipe files here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Photos, PDFs, Excel, Word, or text files (up to 10)
                    </p>
                  </div>
                  <label className="cursor-pointer inline-block">
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.xls,.csv,.numbers,.pages"
                      onChange={handleFileInput}
                      multiple
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span><Upload className="w-4 h-4 mr-2" />Browse Files</span>
                    </Button>
                  </label>
                </div>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <ScrollArea className="flex-1 max-h-[300px]">
                  <div className="space-y-2 pr-4">
                    {files.map((f) => (
                      <div key={f.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group">
                        <div className="text-muted-foreground">{getFileIcon(f.file)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate text-sm">{f.file.name}</p>
                            <Badge variant={getFileTypeBadge(f.file).variant} className="text-[10px] shrink-0">
                              {getFileTypeBadge(f.file).label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground">{(f.file.size / 1024).toFixed(1)} KB</p>
                            {f.file.size > LARGE_FILE_THRESHOLD && (
                              <p className="text-xs text-warning flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Large file
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFile(f.id)}
                          className="p-1.5 rounded-full hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button onClick={processFiles} disabled={files.length === 0}>
                  <ChefHat className="w-4 h-4 mr-2" />
                  Import {files.length} Recipe{files.length !== 1 ? "s" : ""}
                </Button>
              </DialogFooter>
            </motion.div>
          )}

          {/* Processing Step */}
          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 py-4"
            >
              <div className="text-center space-y-2">
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
                <p className="font-medium">Processing {currentIndex + 1} of {files.length}</p>
                <p className="text-sm text-muted-foreground truncate max-w-md mx-auto">{files[currentIndex]?.file.name}</p>
              </div>

              <Progress value={progress} className="w-full" />

              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2 pr-4">
                  {files.map((f) => (
                    <div key={f.id} className={cn(
                      "flex items-center gap-3 p-2 rounded-lg text-sm",
                      f.status === "processing" && "bg-primary/10",
                      f.status === "success" && "bg-success/10",
                      f.status === "error" && "bg-destructive/10"
                    )}>
                      <div className="w-5 h-5 flex items-center justify-center">
                        {f.status === "pending" && <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
                        {f.status === "processing" && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                        {f.status === "success" && <CheckCircle2 className="w-4 h-4 text-success" />}
                        {f.status === "error" && <XCircle className="w-4 h-4 text-destructive" />}
                      </div>
                      <span className="flex-1 truncate">{f.recipeName || f.file.name}</span>
                      {f.status === "error" && <span className="text-xs text-destructive truncate max-w-[150px]">{f.error}</span>}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </motion.div>
          )}

          {/* Complete Step */}
          {step === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 py-4"
            >
              <div className="text-center space-y-3">
                {errorCount === 0 ? (
                  <CheckCircle2 className="w-12 h-12 mx-auto text-success" />
                ) : successCount === 0 ? (
                  <XCircle className="w-12 h-12 mx-auto text-destructive" />
                ) : (
                  <AlertTriangle className="w-12 h-12 mx-auto text-warning" />
                )}
                <div>
                  <p className="text-lg font-medium">Import Complete</p>
                  <p className="text-sm text-muted-foreground">
                    {successCount} of {files.length} recipes imported successfully
                  </p>
                </div>
              </div>

              <ScrollArea className="max-h-[250px]">
                <div className="space-y-2 pr-4">
                  {files.map((f) => (
                    <div key={f.id} className={cn(
                      "flex items-center gap-3 p-3 rounded-lg",
                      f.status === "success" && "bg-success/10",
                      f.status === "error" && "bg-destructive/10"
                    )}>
                      <div className="w-5 h-5 flex items-center justify-center">
                        {f.status === "success" ? <CheckCircle2 className="w-5 h-5 text-success" /> : <XCircle className="w-5 h-5 text-destructive" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{f.recipeName || f.file.name}</p>
                        {f.status === "error" && <p className="text-xs text-destructive truncate">{f.error}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <DialogFooter>
                <Button onClick={handleClose}>
                  {successCount > 0 ? "View Imported Recipes" : "Close"}
                </Button>
              </DialogFooter>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default BulkRecipeImportDialog;
