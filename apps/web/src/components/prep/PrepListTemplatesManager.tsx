import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Calendar,
  Loader2,
  Flag,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePrepTemplates, PrepListTemplate, PrepTemplateItem } from "@/hooks/usePrepTemplates";
import { useSectionLeaderStatus } from "@/hooks/useSectionLeaderStatus";
import { supabase } from "@/integrations/supabase/client";

type UrgencyLevel = "priority" | "end_of_day" | "within_48h";

const URGENCY_CONFIG: Record<UrgencyLevel, { color: string; label: string }> = {
  priority: { color: "text-red-600", label: "Before Next Service" },
  end_of_day: { color: "text-yellow-600", label: "End of Day" },
  within_48h: { color: "text-green-600", label: "48 Hours" },
};

const DAYS_OF_WEEK = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
];

interface KitchenSection {
  id: string;
  name: string;
  color: string | null;
}

export function PrepListTemplatesManager() {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate } = usePrepTemplates();
  const { canManageTemplates, isHeadChef, leaderSectionIds } = useSectionLeaderStatus();
  const [sections, setSections] = useState<KitchenSection[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrepListTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<PrepListTemplate | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    section_id: "" as string | null,
    schedule_type: "weekly" as "daily" | "weekly" | "one_time",
    schedule_days: [] as string[],
    default_assignee_name: "",
    items: [] as PrepTemplateItem[],
    is_active: true,
    auto_generate_enabled: false,
    auto_generate_time: "21:00",
  });

  const [newTask, setNewTask] = useState({
    task: "",
    quantity: "",
    urgency: "within_48h" as UrgencyLevel,
  });

  useEffect(() => {
    const fetchSections = async () => {
      const { data } = await supabase
        .from("kitchen_sections")
        .select("id, name, color")
        .eq("is_active", true)
        .order("sort_order");
      setSections(data || []);
    };
    fetchSections();
  }, []);

  const resetForm = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setFormData({
      name: "",
      section_id: isHeadChef ? null : leaderSectionIds[0] || null,
      schedule_type: "weekly",
      schedule_days: [],
      default_assignee_name: "",
      items: [],
      is_active: true,
      auto_generate_enabled: false,
      auto_generate_time: "21:00",
    });
    setNewTask({ task: "", quantity: "", urgency: "within_48h" });
  };

  const openEditDialog = (template: PrepListTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      section_id: template.section_id,
      schedule_type: template.schedule_type,
      schedule_days: template.schedule_days,
      default_assignee_name: template.default_assignee_name || "",
      items: template.items,
      is_active: template.is_active,
      auto_generate_enabled: template.auto_generate_enabled || false,
      auto_generate_time: template.auto_generate_time || "21:00",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, formData);
    } else {
      await createTemplate(formData);
    }
    resetForm();
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    await deleteTemplate(deletingTemplate.id);
    setDeleteDialogOpen(false);
    setDeletingTemplate(null);
  };

  const addTaskToForm = () => {
    if (!newTask.task.trim()) return;
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          id: crypto.randomUUID(),
          task: newTask.task,
          quantity: newTask.quantity,
          urgency: newTask.urgency,
        },
      ],
    });
    setNewTask({ task: "", quantity: "", urgency: "within_48h" });
  };

  const removeTaskFromForm = (taskId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.id !== taskId),
    });
  };

  const toggleDay = (day: string) => {
    const newDays = formData.schedule_days.includes(day)
      ? formData.schedule_days.filter((d) => d !== day)
      : [...formData.schedule_days, day];
    setFormData({ ...formData, schedule_days: newDays });
  };

  // Filter sections based on user role
  const availableSections = isHeadChef
    ? sections
    : sections.filter((s) => leaderSectionIds.includes(s.id));

  // Group templates by section
  const groupedTemplates = templates.reduce((acc, template) => {
    const sectionId = template.section_id || "kitchen-wide";
    if (!acc[sectionId]) {
      acc[sectionId] = [];
    }
    acc[sectionId].push(template);
    return acc;
  }, {} as Record<string, PrepListTemplate[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Prep List Templates</h2>
          <p className="text-sm text-muted-foreground">
            Create recurring templates for daily and weekly prep work
          </p>
        </div>
        {canManageTemplates && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {/* Templates grouped by section */}
      {Object.entries(groupedTemplates).length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">No templates created yet</p>
          {canManageTemplates && (
            <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Template
            </Button>
          )}
        </div>
      ) : (
        Object.entries(groupedTemplates).map(([sectionId, sectionTemplates]) => {
          const section = sections.find((s) => s.id === sectionId);
          const sectionName = section?.name || "Kitchen-Wide";
          const sectionColor = section?.color || "#6B7280";

          return (
            <Collapsible key={sectionId} defaultOpen>
              <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: sectionColor }}
                />
                <span className="font-medium">{sectionName}</span>
                <Badge variant="secondary" className="ml-2">
                  {sectionTemplates.length}
                </Badge>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                {sectionTemplates.map((template, index) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-elevated p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{template.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {template.schedule_type === "daily"
                              ? "Daily"
                              : template.schedule_type === "weekly"
                              ? "Weekly"
                              : "One-time"}
                          </Badge>
                          {template.auto_generate_enabled && (
                            <Badge variant="secondary" className="text-xs gap-1 bg-success/10 text-success">
                              ⚡ Auto {template.auto_generate_time?.slice(0, 5) || "21:00"}
                            </Badge>
                          )}
                        </div>
                        {template.schedule_type === "weekly" && template.schedule_days.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {DAYS_OF_WEEK.map((day) => (
                              <span
                                key={day.value}
                                className={cn(
                                  "px-2 py-0.5 rounded text-xs",
                                  template.schedule_days.includes(day.value)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {day.label}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-sm text-muted-foreground mt-2">
                          {template.items.length} tasks
                        </p>
                      </div>
                      {canManageTemplates && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditDialog(template)}
                            className="p-2 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingTemplate(template);
                              setDeleteDialogOpen(true);
                            }}
                            className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={resetForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "New Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Monday AM Prep"
              />
            </div>

            {availableSections.length > 0 && (
              <div className="space-y-2">
                <Label>Section</Label>
                <Select
                  value={formData.section_id || "kitchen-wide"}
                  onValueChange={(v) =>
                    setFormData({ ...formData, section_id: v === "kitchen-wide" ? null : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isHeadChef && (
                      <SelectItem value="kitchen-wide">Kitchen-Wide</SelectItem>
                    )}
                    {availableSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: section.color || "#6B7280" }}
                          />
                          {section.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Schedule Type</Label>
              <Select
                value={formData.schedule_type}
                onValueChange={(v: "daily" | "weekly" | "one_time") =>
                  setFormData({ ...formData, schedule_type: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="one_time">One-time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.schedule_type === "weekly" && (
              <div className="space-y-2">
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                        formData.schedule_days.includes(day.value)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Default Assignee</Label>
              <Input
                value={formData.default_assignee_name}
                onChange={(e) =>
                  setFormData({ ...formData, default_assignee_name: e.target.value })
                }
                placeholder="e.g., Morning Crew"
              />
            </div>

            {/* Auto-Generate Toggle */}
            <div className="space-y-3 p-3 rounded-lg border border-border bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">Auto-Generate</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically create tomorrow's prep list
                  </p>
                </div>
                <Checkbox
                  checked={formData.auto_generate_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, auto_generate_enabled: !!checked })
                  }
                />
              </div>
              {formData.auto_generate_enabled && (
                <div className="space-y-2">
                  <Label className="text-xs">Generate Time</Label>
                  <Input
                    type="time"
                    value={formData.auto_generate_time}
                    onChange={(e) =>
                      setFormData({ ...formData, auto_generate_time: e.target.value })
                    }
                    className="w-32"
                  />
                </div>
              )}
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              <Label>Tasks</Label>
              <div className="space-y-2">
                {formData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted"
                  >
                    <Flag
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        URGENCY_CONFIG[item.urgency].color
                      )}
                    />
                    <span className="flex-1 text-sm">{item.task}</span>
                    {item.quantity && (
                      <span className="text-xs text-muted-foreground">
                        {item.quantity}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeTaskFromForm(item.id)}
                      className="p-1 rounded hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Input
                  placeholder="Task name"
                  className="flex-1 min-w-[150px]"
                  value={newTask.task}
                  onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
                />
                <Input
                  placeholder="Qty"
                  className="w-20"
                  value={newTask.quantity}
                  onChange={(e) => setNewTask({ ...newTask, quantity: e.target.value })}
                />
                <Select
                  value={newTask.urgency}
                  onValueChange={(v: UrgencyLevel) =>
                    setNewTask({ ...newTask, urgency: v })
                  }
                >
                  <SelectTrigger className="w-[140px]">
                    <div className="flex items-center gap-2">
                      <Flag
                        className={cn("w-3 h-3", URGENCY_CONFIG[newTask.urgency].color)}
                      />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="end_of_day">End of Day</SelectItem>
                    <SelectItem value="within_48h">48 Hours</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={addTaskToForm}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingTemplate ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">
            Are you sure you want to delete "{deletingTemplate?.name}"? This action
            cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
