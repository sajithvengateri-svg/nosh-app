import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import StepImageUpload from "./StepImageUpload";
import { useRecipeMethodSteps, type MethodSection } from "@/hooks/useRecipeMethodSteps";
import { cn } from "@/lib/utils";

interface RecipeMethodEditorProps {
  recipeId: string;
  hasEditPermission: boolean;
}

const RecipeMethodEditor = ({ recipeId, hasEditPermission }: RecipeMethodEditorProps) => {
  const {
    sections,
    loading,
    addSection,
    addStep,
    updateStep,
    deleteStep,
    updateSectionTitle,
    deleteSection,
  } = useRecipeMethodSteps(recipeId);

  const [openSections, setOpenSections] = useState<Set<number>>(new Set([1]));
  const [newSectionName, setNewSectionName] = useState("");
  const [expandedTips, setExpandedTips] = useState<Set<string>>(new Set());

  const toggleSection = (num: number) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      next.has(num) ? next.delete(num) : next.add(num);
      return next;
    });
  };

  const toggleTips = (id: string) => {
    setExpandedTips(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAddSection = async () => {
    const title = newSectionName.trim() || `Section ${sections.length + 1}`;
    await addSection(title);
    setNewSectionName("");
    // Auto-open the new section
    const nextNum = sections.length > 0 ? Math.max(...sections.map(s => s.section_number)) + 1 : 1;
    setOpenSections(prev => new Set(prev).add(nextNum));
  };

  const totalSteps = sections.reduce((acc, s) => acc + s.steps.length, 0);

  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Method</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {sections.length} {sections.length === 1 ? "section" : "sections"} · {totalSteps} steps
          </span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sections.map((section) => (
              <SectionBlock
                key={section.section_number}
                section={section}
                recipeId={recipeId}
                isOpen={openSections.has(section.section_number)}
                onToggle={() => toggleSection(section.section_number)}
                onAddStep={() => addStep(section.section_number, section.section_title)}
                onUpdateStep={updateStep}
                onDeleteStep={deleteStep}
                onUpdateTitle={(title) => updateSectionTitle(section.section_number, title)}
                onDeleteSection={() => deleteSection(section.section_number)}
                expandedTips={expandedTips}
                onToggleTips={toggleTips}
                hasEditPermission={hasEditPermission}
              />
            ))}
          </AnimatePresence>

          {hasEditPermission && (
            <div className="flex items-center gap-2 pt-2">
              <Input
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="New section name..."
                className="flex-1 h-9 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
              />
              <Button size="sm" variant="outline" onClick={handleAddSection}>
                <Plus className="w-4 h-4 mr-1" />
                Add Section
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Section Block ─────────────────────────────────

interface SectionBlockProps {
  section: MethodSection;
  recipeId: string;
  isOpen: boolean;
  onToggle: () => void;
  onAddStep: () => void;
  onUpdateStep: (id: string, updates: any) => void;
  onDeleteStep: (id: string) => void;
  onUpdateTitle: (title: string) => void;
  onDeleteSection: () => void;
  expandedTips: Set<string>;
  onToggleTips: (id: string) => void;
  hasEditPermission: boolean;
}

const SectionBlock = ({
  section,
  recipeId,
  isOpen,
  onToggle,
  onAddStep,
  onUpdateStep,
  onDeleteStep,
  onUpdateTitle,
  onDeleteSection,
  expandedTips,
  onToggleTips,
  hasEditPermission,
}: SectionBlockProps) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(section.section_title);

  const handleTitleSave = () => {
    if (titleValue.trim() && titleValue !== section.section_title) {
      onUpdateTitle(titleValue.trim());
    }
    setEditingTitle(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="rounded-lg border border-border bg-muted/30"
    >
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <div className="flex items-center gap-2 px-3 py-2">
          <CollapsibleTrigger asChild>
            <button className="p-1 hover:bg-muted rounded transition-colors">
              {isOpen ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>

          <span className="text-xs font-bold text-primary/70 w-6">
            {section.section_number}.
          </span>

          {editingTitle && hasEditPermission ? (
            <Input
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") setEditingTitle(false);
              }}
              className="h-7 text-sm font-medium flex-1"
              autoFocus
            />
          ) : (
            <button
              onClick={() => hasEditPermission && setEditingTitle(true)}
              className="text-sm font-medium text-foreground flex-1 text-left hover:text-primary transition-colors"
            >
              {section.section_title}
            </button>
          )}

          <span className="text-xs text-muted-foreground">
            {section.steps.length} {section.steps.length === 1 ? "step" : "steps"}
          </span>

          {hasEditPermission && (
            <button
              onClick={onDeleteSection}
              className="p-1 rounded hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
            </button>
          )}
        </div>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {section.steps.map((step, idx) => (
              <motion.div
                key={step.id}
                layout
                className="flex items-start gap-2 pl-7"
              >
                <span className="text-xs font-mono text-muted-foreground mt-2.5 w-8 flex-shrink-0">
                  {section.section_number}.{idx + 1}
                </span>

                <div className="flex-1 space-y-1">
                  <Textarea
                    value={step.instruction}
                    onChange={(e) => onUpdateStep(step.id, { instruction: e.target.value })}
                    placeholder="Describe this step..."
                    className="min-h-[36px] text-sm resize-none"
                    rows={1}
                    disabled={!hasEditPermission}
                  />

                  {/* Tips toggle */}
                    <button
                      onClick={() => onToggleTips(step.id)}
                      className={cn(
                        "flex items-center gap-1 text-xs transition-colors",
                        expandedTips.has(step.id) ? "text-accent-foreground" : "text-muted-foreground hover:text-accent-foreground"
                      )}
                    >
                      <Lightbulb className="w-3 h-3" />
                      {step.tips ? "Tips" : "Add tip"}
                  </button>

                  {expandedTips.has(step.id) && (
                    <Input
                      value={step.tips || ""}
                      onChange={(e) => onUpdateStep(step.id, { tips: e.target.value })}
                      placeholder="Chef notes / tips for this step..."
                      className="h-8 text-xs"
                      disabled={!hasEditPermission}
                    />
                  )}
                </div>

                <StepImageUpload
                  recipeId={recipeId}
                  stepId={step.id}
                  imageUrl={step.image_url}
                  onImageChange={(url) => onUpdateStep(step.id, { image_url: url })}
                  disabled={!hasEditPermission}
                />

                {hasEditPermission && (
                  <button
                    onClick={() => onDeleteStep(step.id)}
                    className="p-1 mt-1.5 rounded hover:bg-destructive/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-destructive/60" />
                  </button>
                )}
              </motion.div>
            ))}

            {hasEditPermission && (
              <button
                onClick={onAddStep}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary pl-7 py-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add step
              </button>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

export default RecipeMethodEditor;
