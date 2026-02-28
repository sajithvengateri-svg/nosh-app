import React, { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FLOOR_TEMPLATES, type FloorTemplate } from "../data/floorTemplates";

interface TemplatePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: FloorTemplate) => void;
}

export function TemplatePickerDialog({
  open,
  onOpenChange,
  onSelectTemplate,
}: TemplatePickerDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedTemplate = FLOOR_TEMPLATES.find((t) => t.id === selectedId);

  const handleLoad = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      setSelectedId(null);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSelectedId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Load Floor Template</DialogTitle>
          <DialogDescription>
            Choose a pre-built layout to get started quickly. This will replace
            your current floor plan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4 sm:grid-cols-3">
          {FLOOR_TEMPLATES.map((template) => {
            const isSelected = selectedId === template.id;

            return (
              <Card
                key={template.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => setSelectedId(template.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(template.id);
                  }
                }}
                className={[
                  "cursor-pointer transition-colors hover:bg-accent",
                  isSelected
                    ? "border-2 border-primary ring-2 ring-primary/20"
                    : "border border-border",
                ].join(" ")}
              >
                <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                  {/* Thumbnail emoji */}
                  <span className="text-4xl" aria-hidden="true">
                    {template.thumbnail}
                  </span>

                  {/* Name */}
                  <p className="text-sm font-semibold leading-tight">
                    {template.name}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>

                  {/* Table count badge */}
                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    {template.tables.length}{" "}
                    {template.tables.length === 1 ? "table" : "tables"}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button disabled={!selectedTemplate} onClick={handleLoad}>
            Load Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
