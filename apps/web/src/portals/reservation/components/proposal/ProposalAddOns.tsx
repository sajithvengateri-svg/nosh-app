"use client";

import React, { useMemo } from "react";
import { Gift, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AddOn {
  id: string;
  name: string;
  description: string;
  price: number;
  photo_url: string | null;
  is_popular: boolean;
}

interface ProposalAddOnsProps {
  addOns: Array<AddOn>;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ProposalAddOns({
  addOns,
  selectedIds,
  onToggle,
}: ProposalAddOnsProps) {
  const selectedTotal = useMemo(() => {
    return addOns
      .filter((a) => selectedIds.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0);
  }, [addOns, selectedIds]);

  const selectedCount = selectedIds.length;

  return (
    <section className="space-y-8">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Extras & Add-Ons
          </h2>
          <p className="text-sm text-muted-foreground">
            Enhance your event with these curated options
          </p>
        </div>
      </div>

      {/* Add-on grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {addOns.map((addOn) => {
          const isSelected = selectedIds.includes(addOn.id);

          return (
            <Card
              key={addOn.id}
              className={cn(
                "relative cursor-pointer overflow-hidden transition-all duration-200",
                isSelected
                  ? "ring-2 ring-green-500 ring-offset-2"
                  : "hover:shadow-md",
              )}
              onClick={() => onToggle(addOn.id)}
            >
              {/* Photo */}
              {addOn.photo_url && (
                <div className="relative h-32 w-full overflow-hidden">
                  <img
                    src={addOn.photo_url}
                    alt={addOn.name}
                    className="h-full w-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                      <div className="rounded-full bg-green-500 p-1.5">
                        <Check className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Popular badge */}
              {addOn.is_popular && (
                <Badge
                  className={cn(
                    "absolute right-3 gap-1 border-amber-300 bg-amber-100 text-amber-800",
                    addOn.photo_url ? "top-3" : "top-4",
                  )}
                >
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </Badge>
              )}

              <CardHeader className={cn(addOn.photo_url ? "pt-4" : "")}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <CardTitle className="text-base">{addOn.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {addOn.description}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={isSelected}
                    onCheckedChange={() => onToggle(addOn.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Toggle ${addOn.name}`}
                  />
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    ${addOn.price.toFixed(2)}
                  </span>
                  {addOn.is_popular && !isSelected && (
                    <span className="text-xs text-muted-foreground">
                      A guest favourite -- don&apos;t miss out!
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Running total */}
      {selectedCount > 0 && (
        <div className="sticky bottom-4 z-10">
          <div className="mx-auto max-w-md rounded-full border bg-card px-6 py-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedCount} add-on{selectedCount !== 1 ? "s" : ""} selected
              </span>
              <span className="text-lg font-bold">
                + ${selectedTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
