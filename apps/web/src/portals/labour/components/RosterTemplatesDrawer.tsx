import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Copy, Save, LayoutTemplate } from "lucide-react";
import { toast } from "sonner";
import {
  useRosterTemplates,
  useCreateRosterTemplate,
  useDeleteRosterTemplate,
} from "@/lib/shared/queries/labourQueries";

interface RosterTemplatesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  currentShifts: Array<{
    user_id: string;
    date: string;
    start_time: string;
    end_time: string;
    break_minutes: number;
    section: string | null;
    shift_type: string;
  }>;
  weekStart: string;
  onApplyTemplate: (shifts: unknown[]) => void;
}

export default function RosterTemplatesDrawer({
  open,
  onOpenChange,
  orgId,
  currentShifts,
  weekStart,
  onApplyTemplate,
}: RosterTemplatesDrawerProps) {
  const [saveName, setSaveName] = useState("");
  const [saveDesc, setSaveDesc] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  const { data: templates, isLoading } = useRosterTemplates(orgId);
  const createTemplate = useCreateRosterTemplate();
  const deleteTemplate = useDeleteRosterTemplate();

  const handleSave = () => {
    if (!saveName.trim()) return;

    const weekStartDate = new Date(weekStart);
    const templateShifts = currentShifts.map((s) => {
      const shiftDate = new Date(s.date);
      const dayOffset = Math.round(
        (shiftDate.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        day_offset: dayOffset,
        start: s.start_time,
        end: s.end_time,
        break: s.break_minutes,
        section: s.section,
        type: s.shift_type,
      };
    });

    createTemplate.mutate(
      {
        org_id: orgId,
        name: saveName.trim(),
        description: saveDesc.trim() || null,
        shifts: templateShifts,
      },
      {
        onSuccess: () => {
          toast.success("Template saved");
          setSaveName("");
          setSaveDesc("");
          setShowSaveForm(false);
        },
        onError: () => toast.error("Failed to save template"),
      }
    );
  };

  const handleApply = (templateShifts: unknown[]) => {
    onApplyTemplate(templateShifts);
    onOpenChange(false);
    toast.success("Template applied");
  };

  const handleDelete = (id: string) => {
    deleteTemplate.mutate(id, {
      onSuccess: () => toast.success("Template deleted"),
      onError: () => toast.error("Failed to delete template"),
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[440px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <LayoutTemplate className="w-5 h-5" />
            Roster Templates
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Save current */}
          {!showSaveForm ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowSaveForm(true)}
              disabled={currentShifts.length === 0}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Current Roster as Template
            </Button>
          ) : (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1.5">
                  <Label>Template Name</Label>
                  <Input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="e.g. Busy Weekend"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    value={saveDesc}
                    onChange={(e) => setSaveDesc(e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave} disabled={!saveName.trim() || createTemplate.isPending}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowSaveForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Templates list */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Saved Templates</h3>
            {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
            {!isLoading && (!templates || templates.length === 0) && (
              <p className="text-sm text-muted-foreground py-4 text-center">No templates saved yet.</p>
            )}
            {templates?.map((t) => {
              const shifts = Array.isArray(t.shifts) ? t.shifts : [];
              return (
                <Card key={t.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-foreground">{t.name}</div>
                        {t.description && (
                          <div className="text-xs text-muted-foreground mt-0.5">{t.description}</div>
                        )}
                        <Badge variant="secondary" className="mt-1 text-[10px]">
                          {shifts.length} shifts
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleApply(shifts)}
                          title="Apply template"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(t.id)}
                          title="Delete template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
