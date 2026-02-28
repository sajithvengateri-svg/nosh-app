import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Loader2,
  Pencil,
  Palette
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRecipeSections, RecipeSection } from "@/hooks/useRecipeSections";
import { cn } from "@/lib/utils";

interface RecipeSectionsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = [
  "#6B7280", // gray
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#14B8A6", // teal
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899", // pink
];

const RecipeSectionsManager = ({ open, onOpenChange }: RecipeSectionsManagerProps) => {
  const { sections, loading, addSection, updateSection, deleteSection } = useRecipeSections();
  const [newSectionName, setNewSectionName] = useState("");
  const [newSectionColor, setNewSectionColor] = useState("#6B7280");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!newSectionName.trim()) return;
    setAdding(true);
    await addSection(newSectionName.trim(), newSectionColor);
    setNewSectionName("");
    setNewSectionColor("#6B7280");
    setAdding(false);
  };

  const handleStartEdit = (section: RecipeSection) => {
    setEditingId(section.id);
    setEditingName(section.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    const success = await updateSection(id, { name: editingName.trim() });
    if (success) {
      setEditingId(null);
      setEditingName("");
    }
  };

  const handleColorChange = async (id: string, color: string) => {
    await updateSection(id, { color });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Recipe Sections</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Add new section */}
            <div className="space-y-2">
              <Label>Add New Section</Label>
              <div className="flex gap-2">
                <Input
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="e.g., Pastry, Brunch, Specials..."
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <div className="relative">
                  <button
                    className="w-10 h-10 rounded-md border border-input flex items-center justify-center"
                    style={{ backgroundColor: newSectionColor }}
                    onClick={() => {
                      const idx = COLORS.indexOf(newSectionColor);
                      setNewSectionColor(COLORS[(idx + 1) % COLORS.length]);
                    }}
                  >
                    <Palette className="w-4 h-4 text-white drop-shadow" />
                  </button>
                </div>
                <Button onClick={handleAdd} disabled={!newSectionName.trim() || adding}>
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Section list */}
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {sections.map((section) => (
                  <motion.div
                    key={section.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg",
                      "bg-muted/50 hover:bg-muted transition-colors"
                    )}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                    
                    <button
                      className="w-6 h-6 rounded-full flex-shrink-0 border-2 border-background shadow-sm"
                      style={{ backgroundColor: section.color }}
                      onClick={() => {
                        const idx = COLORS.indexOf(section.color);
                        handleColorChange(section.id, COLORS[(idx + 1) % COLORS.length]);
                      }}
                    />

                    {editingId === section.id ? (
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => handleSaveEdit(section.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(section.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-8 flex-1"
                        autoFocus
                      />
                    ) : (
                      <span className="flex-1 text-left text-sm font-medium text-foreground">
                        {section.name}
                      </span>
                    )}

                    <button
                      onClick={() => handleStartEdit(section)}
                      className="p-1.5 rounded hover:bg-muted-foreground/10 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>

                    <button
                      onClick={() => deleteSection(section.id)}
                      className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <p className="text-xs text-muted-foreground">
              Click the pencil to edit a section name, click the color to change it.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeSectionsManager;
