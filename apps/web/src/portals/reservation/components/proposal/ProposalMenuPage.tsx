"use client";

import React from "react";
import { UtensilsCrossed, Leaf, Wheat, Milk } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MenuItem {
  name: string;
  description: string;
}

interface MenuSection {
  title: string;
  description: string | null;
  per_head_price: number;
  items: Array<MenuItem>;
}

interface MediaItem {
  url: string;
  caption: string | null;
}

interface ProposalMenuPageProps {
  menuSections: Array<MenuSection>;
  mediaItems: Array<MediaItem>;
}

// ---------------------------------------------------------------------------
// Dietary helpers
// ---------------------------------------------------------------------------

interface DietaryFlag {
  label: string;
  code: string;
  icon: React.ReactNode;
  className: string;
}

const DIETARY_FLAGS: DietaryFlag[] = [
  {
    label: "Vegetarian",
    code: "(V)",
    icon: <Leaf className="h-3 w-3" />,
    className: "bg-green-100 text-green-800 border-green-200",
  },
  {
    label: "Vegan",
    code: "(VG)",
    icon: <Leaf className="h-3 w-3" />,
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  {
    label: "Gluten Free",
    code: "(GF)",
    icon: <Wheat className="h-3 w-3" />,
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    label: "Dairy Free",
    code: "(DF)",
    icon: <Milk className="h-3 w-3" />,
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
];

function getDietaryFlags(text: string): DietaryFlag[] {
  return DIETARY_FLAGS.filter((flag) => text.includes(flag.code));
}

function stripDietaryCodes(text: string): string {
  let result = text;
  for (const flag of DIETARY_FLAGS) {
    result = result.replace(flag.code, "").trim();
  }
  return result;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MenuItemRow({ item }: { item: MenuItem }) {
  const flags = getDietaryFlags(item.name + " " + item.description);
  const cleanName = stripDietaryCodes(item.name);
  const cleanDescription = stripDietaryCodes(item.description);

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{cleanName}</span>
          {flags.map((flag) => (
            <Badge
              key={flag.code}
              variant="outline"
              className={cn("gap-1 text-[10px]", flag.className)}
            >
              {flag.icon}
              {flag.label}
            </Badge>
          ))}
        </div>
        {cleanDescription && (
          <p className="mt-0.5 text-sm text-muted-foreground">
            {cleanDescription}
          </p>
        )}
      </div>
    </div>
  );
}

function PhotoGallery({ items }: { items: MediaItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {items.map((item, idx) => (
        <div key={idx} className="group relative overflow-hidden rounded-lg">
          <img
            src={item.url}
            alt={item.caption ?? `Food photo ${idx + 1}`}
            className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {item.caption && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
              <p className="text-xs text-white">{item.caption}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ProposalMenuPage({
  menuSections,
  mediaItems,
}: ProposalMenuPageProps) {
  // Insert gallery after the first section if there are multiple sections
  const galleryInsertIndex = menuSections.length > 1 ? 1 : menuSections.length;

  return (
    <section className="space-y-8">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Menu</h2>
      </div>

      {/* Menu sections */}
      {menuSections.map((section, idx) => (
        <React.Fragment key={idx}>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  {section.description && (
                    <CardDescription>{section.description}</CardDescription>
                  )}
                </div>
                <div className="flex-shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                  ${section.per_head_price.toFixed(2)}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    / head
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {section.items.map((item, itemIdx) => (
                  <MenuItemRow key={itemIdx} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Photo gallery after designated section */}
          {idx + 1 === galleryInsertIndex && mediaItems.length > 0 && (
            <PhotoGallery items={mediaItems} />
          )}
        </React.Fragment>
      ))}

      {/* If only one section or no sections, show gallery at the end */}
      {galleryInsertIndex === menuSections.length && mediaItems.length > 0 && (
        <PhotoGallery items={mediaItems} />
      )}
    </section>
  );
}
