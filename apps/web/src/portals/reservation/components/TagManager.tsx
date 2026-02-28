import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { useOrgTags } from "../hooks/useOrgTags";
import {
  createOrgTag,
  updateOrgTag,
  deleteOrgTag,
} from "@/lib/shared/queries/resQueries";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { ResTag, TagCategory } from "@/lib/shared/types/res.types";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
];

const CATEGORIES: TagCategory[] = [
  "general",
  "dietary",
  "vip",
  "occasion",
  "operational",
];

const CATEGORY_LABELS: Record<TagCategory, string> = {
  general: "General",
  dietary: "Dietary",
  vip: "VIP",
  occasion: "Occasion",
  operational: "Operational",
};

const DEFAULT_TAGS: { name: string; color: string; category: TagCategory }[] = [
  { name: "VIP", color: "#f59e0b", category: "vip" },
  { name: "VVIP", color: "#ef4444", category: "vip" },
  { name: "Regular", color: "#3b82f6", category: "vip" },
  { name: "Birthday", color: "#ec4899", category: "occasion" },
  { name: "Anniversary", color: "#a855f7", category: "occasion" },
  { name: "Date Night", color: "#6366f1", category: "occasion" },
  { name: "Business Dinner", color: "#3b82f6", category: "occasion" },
  { name: "Vegetarian", color: "#22c55e", category: "dietary" },
  { name: "Vegan", color: "#22c55e", category: "dietary" },
  { name: "Gluten-Free", color: "#f59e0b", category: "dietary" },
  { name: "Nut Allergy", color: "#ef4444", category: "dietary" },
  { name: "Halal", color: "#6366f1", category: "dietary" },
  { name: "Kosher", color: "#6366f1", category: "dietary" },
  { name: "Window Seat", color: "#3b82f6", category: "operational" },
  { name: "Highchair Needed", color: "#f97316", category: "operational" },
  { name: "Wheelchair Access", color: "#f97316", category: "operational" },
];

export default function TagManager() {
  const { currentOrg } = useOrg();
  const queryClient = useQueryClient();
  const { data: tags = [], isLoading } = useOrgTags();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [newCategory, setNewCategory] = useState<TagCategory>("general");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editCategory, setEditCategory] = useState<TagCategory>("general");

  const invalidateOrgTags = {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgTags"] });
    },
  };

  const createMutation = useMutation({
    mutationFn: (data: { name: string; color: string; category: TagCategory }) =>
      createOrgTag(currentOrg!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgTags"] });
      toast.success("Tag created");
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
      setNewCategory("general");
      setShowAddForm(false);
    },
    onError: () => {
      toast.error("Failed to create tag");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      tagId,
      data,
    }: {
      tagId: string;
      data: { name: string; color: string; category: TagCategory };
    }) => updateOrgTag(currentOrg!.id, tagId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgTags"] });
      toast.success("Tag updated");
      setEditingId(null);
    },
    onError: () => {
      toast.error("Failed to update tag");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (tagId: string) => deleteOrgTag(currentOrg!.id, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgTags"] });
      toast.success("Tag deleted");
    },
    onError: () => {
      toast.error("Failed to delete tag");
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      for (const tag of DEFAULT_TAGS) {
        await createOrgTag(currentOrg!.id, tag);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgTags"] });
      toast.success("Default tags created");
    },
    onError: () => {
      toast.error("Failed to seed default tags");
    },
  });

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error("Tag name is required");
      return;
    }
    createMutation.mutate({ name: trimmed, color: newColor, category: newCategory });
  };

  const handleStartEdit = (tag: ResTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
    setEditCategory(tag.category);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error("Tag name is required");
      return;
    }
    updateMutation.mutate({
      tagId: editingId,
      data: { name: trimmed, color: editColor, category: editCategory },
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = (tagId: string) => {
    if (window.confirm("Delete tag?")) {
      deleteMutation.mutate(tagId);
    }
  };

  const handleSeed = () => {
    seedMutation.mutate();
  };

  const groupedTags = CATEGORIES.reduce(
    (acc, category) => {
      const categoryTags = tags.filter((t: ResTag) => t.category === category);
      if (categoryTags.length > 0) {
        acc[category] = categoryTags;
      }
      return acc;
    },
    {} as Record<TagCategory, ResTag[]>
  );

  const ColorPicker = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (color: string) => void;
  }) => (
    <div className="flex gap-1.5">
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          className={`w-6 h-6 rounded-full border-2 transition-transform ${
            value === color
              ? "border-gray-900 dark:border-white scale-110"
              : "border-transparent hover:scale-105"
          }`}
          style={{ backgroundColor: color }}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-muted-foreground">Loading tags...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Tags</CardTitle>
        <div className="flex gap-2">
          {tags.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seedMutation.isPending}
            >
              {seedMutation.isPending ? "Seeding..." : "Seed Default Tags"}
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Tag
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add Tag Form */}
        {showAddForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex gap-2">
              <Input
                placeholder="Tag name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                className="flex-1"
              />
              <Select
                value={newCategory}
                onValueChange={(v) => setNewCategory(v as TagCategory)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <ColorPicker value={newColor} onChange={setNewColor} />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Tag List Grouped by Category */}
        {tags.length === 0 && !showAddForm && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No tags defined yet.</p>
            <p className="text-sm mt-1">
              Create your first tag or seed default tags to get started.
            </p>
          </div>
        )}

        {CATEGORIES.map((category) => {
          const categoryTags = groupedTags[category];
          if (!categoryTags || categoryTags.length === 0) return null;

          return (
            <div key={category} className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide px-1">
                {CATEGORY_LABELS[category]}
              </h3>
              <div className="space-y-1">
                {categoryTags.map((tag: ResTag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 group"
                  >
                    {editingId === tag.id ? (
                      /* Edit Mode */
                      <>
                        <div className="flex-1 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                              className="flex-1 h-8"
                              autoFocus
                            />
                            <Select
                              value={editCategory}
                              onValueChange={(v) =>
                                setEditCategory(v as TagCategory)
                              }
                            >
                              <SelectTrigger className="w-[130px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {CATEGORIES.map((cat) => (
                                  <SelectItem key={cat} value={cat}>
                                    {CATEGORY_LABELS[cat]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <ColorPicker
                            value={editColor}
                            onChange={setEditColor}
                          />
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleCancelEdit}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={handleSaveEdit}
                            disabled={updateMutation.isPending}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* Display Mode */
                      <>
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="flex-1 text-sm font-medium">
                          {tag.name}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORY_LABELS[tag.category]}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleStartEdit(tag)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(tag.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
