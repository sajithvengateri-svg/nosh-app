import { useState } from "react";
import { useOrgTags } from "../hooks/useOrgTags";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagPickerProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

type TagCategory = "general" | "dietary" | "vip" | "occasion" | "operational";

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

export default function TagPicker({
  selectedTags,
  onChange,
  className,
}: TagPickerProps) {
  const { data: tags = [] } = useOrgTags();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTags = tags.filter((tag: { name: string }) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const groupedTags = CATEGORIES.reduce(
    (acc, category) => {
      const categoryTags = filteredTags.filter(
        (t: { category: TagCategory }) => t.category === category
      );
      if (categoryTags.length > 0) {
        acc[category] = categoryTags;
      }
      return acc;
    },
    {} as Record<TagCategory, { id: string; name: string; color: string; category: TagCategory }[]>
  );

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onChange([...selectedTags, tagName]);
    }
  };

  const removeTag = (tagName: string) => {
    onChange(selectedTags.filter((t) => t !== tagName));
  };

  const getTagColor = (tagName: string): string => {
    const tag = tags.find((t: { name: string }) => t.name === tagName);
    return tag?.color ?? "#6b7280";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selectedTags.length > 0
              ? `${selectedTags.length} tag${selectedTags.length === 1 ? "" : "s"} selected`
              : "Add tags..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 border-0 p-0 shadow-none focus-visible:ring-0"
            />
          </div>

          {/* Tag List */}
          <div className="max-h-[280px] overflow-y-auto p-1">
            {Object.keys(groupedTags).length === 0 && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No tags found.
              </div>
            )}

            {CATEGORIES.map((category) => {
              const categoryTags = groupedTags[category];
              if (!categoryTags || categoryTags.length === 0) return null;

              return (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {CATEGORY_LABELS[category]}
                  </div>
                  {categoryTags.map(
                    (tag: {
                      id: string;
                      name: string;
                      color: string;
                      category: TagCategory;
                    }) => {
                      const isSelected = selectedTags.includes(tag.name);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer transition-colors",
                            "hover:bg-accent hover:text-accent-foreground",
                            isSelected && "bg-accent/50"
                          )}
                          onClick={() => toggleTag(tag.name)}
                        >
                          <div
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded-sm border",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/30"
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="flex-1 text-left">{tag.name}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected Tags as Chips */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tagName) => (
            <Badge
              key={tagName}
              variant="secondary"
              className="gap-1 pr-1 font-normal"
              style={{
                borderColor: getTagColor(tagName),
                borderWidth: "1px",
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: getTagColor(tagName) }}
              />
              {tagName}
              <button
                type="button"
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                onClick={() => removeTag(tagName)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
