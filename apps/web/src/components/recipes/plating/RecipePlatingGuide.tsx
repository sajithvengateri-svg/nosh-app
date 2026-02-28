import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import StepImageUpload from "../method/StepImageUpload";
import { useRecipePlatingSteps } from "@/hooks/useRecipePlatingSteps";

interface RecipePlatingGuideProps {
  recipeId: string;
  hasEditPermission: boolean;
}

const RecipePlatingGuide = ({ recipeId, hasEditPermission }: RecipePlatingGuideProps) => {
  const { steps, loading, addStep, updateStep, deleteStep } = useRecipePlatingSteps(recipeId);

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Utensils className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Plating Guide</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {steps.length} steps
          </span>
        </div>
        {hasEditPermission && (
          <Button size="sm" variant="outline" onClick={addStep}>
            <Plus className="w-4 h-4 mr-1" />
            Add Step
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : steps.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No plating steps yet. Add steps to guide your team on presentation.
        </p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {steps.map((step, idx) => (
              <motion.div
                key={step.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="flex items-start gap-3"
              >
                <span className="text-xs font-mono text-muted-foreground mt-2.5 w-6 flex-shrink-0 text-right">
                  {idx + 1}.
                </span>

                <Textarea
                  value={step.instruction}
                  onChange={(e) => updateStep(step.id, { instruction: e.target.value })}
                  placeholder="Describe plating step..."
                  className="min-h-[36px] text-sm resize-none flex-1"
                  rows={1}
                  disabled={!hasEditPermission}
                />

                <StepImageUpload
                  recipeId={recipeId}
                  stepId={step.id}
                  imageUrl={step.image_url}
                  onImageChange={(url) => updateStep(step.id, { image_url: url })}
                  bucketPath="plating"
                  disabled={!hasEditPermission}
                />

                {hasEditPermission && (
                  <button
                    onClick={() => deleteStep(step.id)}
                    className="p-1 mt-1.5 rounded hover:bg-destructive/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default RecipePlatingGuide;
