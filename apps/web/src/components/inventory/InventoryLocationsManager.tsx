import { useState } from "react";
import { Plus, Pencil, Trash2, GripVertical, MapPin, X, Check } from "lucide-react";
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
import { useInventoryLocations, InventoryLocation } from "@/hooks/useInventoryLocations";
import { cn } from "@/lib/utils";

interface InventoryLocationsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COLORS = [
  "#6B7280", // Gray
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
];

const InventoryLocationsManager = ({ open, onOpenChange }: InventoryLocationsManagerProps) => {
  const { locations, addLocation, updateLocation, deleteLocation } = useInventoryLocations();
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationDescription, setNewLocationDescription] = useState("");
  const [editingLocation, setEditingLocation] = useState<InventoryLocation | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;
    await addLocation(newLocationName.trim(), newLocationDescription.trim());
    setNewLocationName("");
    setNewLocationDescription("");
  };

  const handleStartEdit = (location: InventoryLocation) => {
    setEditingLocation(location);
    setEditName(location.name);
    setEditDescription(location.description || "");
    setEditColor(location.color);
  };

  const handleSaveEdit = async () => {
    if (!editingLocation || !editName.trim()) return;
    await updateLocation(editingLocation.id, {
      name: editName.trim(),
      description: editDescription.trim() || null,
      color: editColor,
    });
    setEditingLocation(null);
  };

  const handleCancelEdit = () => {
    setEditingLocation(null);
  };

  const handleDelete = async (id: string) => {
    await deleteLocation(id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Manage Storage Locations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add new location */}
          <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
            <Label className="text-sm font-medium">Add New Location</Label>
            <Input
              placeholder="Location name..."
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
            />
            <Input
              placeholder="Description (optional)..."
              value={newLocationDescription}
              onChange={(e) => setNewLocationDescription(e.target.value)}
            />
            <Button 
              size="sm" 
              onClick={handleAddLocation}
              disabled={!newLocationName.trim()}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Location
            </Button>
          </div>

          {/* Existing locations */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Current Locations ({locations.length})
            </Label>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg"
                >
                  {editingLocation?.id === location.id ? (
                    // Edit mode
                    <div className="flex-1 space-y-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Location name"
                        autoFocus
                      />
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Description"
                      />
                      <div className="flex gap-1">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => setEditColor(color)}
                            className={cn(
                              "w-6 h-6 rounded-full border-2 transition-all",
                              editColor === color ? "border-foreground scale-110" : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Check className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: location.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{location.name}</p>
                        {location.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {location.description}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEdit(location)}
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDelete(location.id)}
                          className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              {locations.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No locations defined. Add your first location above.
                </p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryLocationsManager;
