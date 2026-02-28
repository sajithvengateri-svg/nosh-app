import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { findSimilarIngredients, IngredientMatch } from "@/lib/ingredientMatcher";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  category: string;
}

interface IngredientComboboxProps {
  ingredients: Ingredient[];
  value: string;
  onChange: (ingredientId: string) => void;
  onCreateNew: (searchTerm: string, matches: IngredientMatch[]) => void;
  excludeIds?: string[];
  placeholder?: string;
}

const IngredientCombobox = ({
  ingredients,
  value,
  onChange,
  onCreateNew,
  excludeIds = [],
  placeholder = "Search ingredients...",
}: IngredientComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedIngredient = ingredients.find((i) => i.id === value);

  // Filter available ingredients (excluding already added)
  const availableIngredients = useMemo(() => {
    return ingredients.filter((i) => !excludeIds.includes(i.id));
  }, [ingredients, excludeIds]);

  // Find matches based on search
  const { filteredIngredients, similarMatches, showCreateOption } = useMemo(() => {
    if (!search.trim()) {
      return {
        filteredIngredients: availableIngredients,
        similarMatches: [],
        showCreateOption: false,
      };
    }

    const searchLower = search.toLowerCase().trim();
    
    // Direct filter for dropdown
    const filtered = availableIngredients.filter((i) =>
      i.name.toLowerCase().includes(searchLower)
    );

    // Get similar matches for the "create new" flow
    const matches = findSimilarIngredients(search, availableIngredients);
    
    // Show create option if no exact match exists
    const hasExactMatch = matches.some(
      (m) => m.matchType === "exact" || m.similarity >= 0.95
    );
    
    return {
      filteredIngredients: filtered,
      similarMatches: matches,
      showCreateOption: search.length >= 2 && !hasExactMatch,
    };
  }, [search, availableIngredients]);

  const handleSelect = (ingredientId: string) => {
    onChange(ingredientId);
    setOpen(false);
    setSearch("");
  };

  const handleCreateNew = () => {
    onCreateNew(search.trim(), similarMatches);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selectedIngredient ? (
            <span className="truncate">{selectedIngredient.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search or add new..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="py-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                No ingredients found
              </p>
              {search.length >= 2 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateNew}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add "{search}"
                </Button>
              )}
            </CommandEmpty>

            {filteredIngredients.length > 0 && (
              <CommandGroup heading="Ingredients">
                {filteredIngredients.slice(0, 50).map((ingredient) => (
                  <CommandItem
                    key={ingredient.id}
                    value={ingredient.id}
                    onSelect={() => handleSelect(ingredient.id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === ingredient.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{ingredient.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs font-normal">
                      {ingredient.category}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* Create new option */}
            {showCreateOption && filteredIngredients.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleCreateNew}
                    className="gap-2 text-primary"
                  >
                    <Plus className="h-4 w-4" />
                    <span>
                      Add new: <strong>"{search}"</strong>
                    </span>
                    {similarMatches.length > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {similarMatches.length} similar found
                      </Badge>
                    )}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default IngredientCombobox;
