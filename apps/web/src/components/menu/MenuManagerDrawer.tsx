import { useState } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Menu as MenuIcon,
  Archive,
  ArchiveRestore,
  Trash2,
  Copy,
  Edit2,
  Check,
  X,
  Plus,
  GitCompare,
  Calendar,
  ChevronRight,
  MoreHorizontal,
  Star,
} from "lucide-react";
import { useMenus } from "@/hooks/useMenus";
import { useMenuStore } from "@/stores/menuStore";
import { Menu } from "@/types/menu";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MenuManagerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MenuManagerDrawer = ({ open, onOpenChange }: MenuManagerDrawerProps) => {
  const {
    menus,
    getActiveMenu,
    getArchivedMenus,
    getDraftMenus,
    createMenu,
    renameMenu,
    archiveMenu,
    unarchiveMenu,
    deleteMenu,
    activateMenu,
    duplicateMenu,
  } = useMenus();
  const { currentOrg } = useOrg();

  // Use store for compareMenus (can be computed locally)
  const { compareMenus } = useMenuStore();

  const activeMenu = getActiveMenu();
  const archivedMenus = getArchivedMenus();
  const draftMenus = getDraftMenus();

  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isNewMenuDialogOpen, setIsNewMenuDialogOpen] = useState(false);
  const [newMenuName, setNewMenuName] = useState("");
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateSourceId, setDuplicateSourceId] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);
  const [compareMenu1, setCompareMenu1] = useState<string>("");
  const [compareMenu2, setCompareMenu2] = useState<string>("");
  const [comparisonResult, setComparisonResult] = useState<ReturnType<typeof compareMenus> | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<Menu | null>(null);

  const handleStartRename = (menu: Menu) => {
    setEditingMenuId(menu.id);
    setEditingName(menu.name);
  };

  const handleSaveRename = () => {
    if (editingMenuId && editingName.trim()) {
      renameMenu({ menuId: editingMenuId, newName: editingName.trim() });
      toast.success("Menu renamed");
    }
    setEditingMenuId(null);
    setEditingName("");
  };

  const handleCancelRename = () => {
    setEditingMenuId(null);
    setEditingName("");
  };

  const handleCreateMenu = async () => {
    if (newMenuName.trim() && currentOrg?.id) {
      try {
        const menu = await createMenu({ name: newMenuName.trim(), orgId: currentOrg.id });
        toast.success(`Created "${menu.name}"`);
        setNewMenuName("");
        setIsNewMenuDialogOpen(false);
      } catch (err) {
        toast.error("Failed to create menu");
      }
    }
  };

  const handleDuplicate = (menu: Menu) => {
    setDuplicateSourceId(menu.id);
    setDuplicateName(`${menu.name} (Copy)`);
    setIsDuplicateDialogOpen(true);
  };

  const handleConfirmDuplicate = async () => {
    if (duplicateSourceId && duplicateName.trim()) {
      try {
        const newMenu = await duplicateMenu({ menuId: duplicateSourceId, newName: duplicateName.trim() });
        toast.success(`Duplicated as "${newMenu?.name}"`);
        setIsDuplicateDialogOpen(false);
        setDuplicateSourceId(null);
        setDuplicateName("");
      } catch (err) {
        toast.error("Failed to duplicate menu");
      }
    }
  };

  const handleArchive = (menu: Menu) => {
    archiveMenu(menu.id);
    toast.success(`"${menu.name}" archived`);
  };

  const handleUnarchive = (menu: Menu) => {
    unarchiveMenu(menu.id);
    toast.success(`"${menu.name}" restored to drafts`);
  };

  const handleActivate = (menu: Menu) => {
    activateMenu(menu.id);
    toast.success(`"${menu.name}" is now active`);
  };

  const handleDeleteClick = (menu: Menu) => {
    setMenuToDelete(menu);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (menuToDelete) {
      deleteMenu(menuToDelete.id);
      toast.success(`"${menuToDelete.name}" deleted`);
      setIsDeleteConfirmOpen(false);
      setMenuToDelete(null);
    }
  };

  const handleCompare = () => {
    if (compareMenu1 && compareMenu2) {
      const result = compareMenus(compareMenu1, compareMenu2);
      setComparisonResult(result);
    }
  };

  const MenuCard = ({ menu, showActions = true }: { menu: Menu; showActions?: boolean }) => {
    const isEditing = editingMenuId === menu.id;
    const isActive = menu.status === "active";
    const isDraft = menu.status === "draft";
    const isArchived = menu.status === "archived";

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "p-4 rounded-xl border transition-all",
          isActive && "border-success bg-success/5",
          isDraft && "border-primary/50 bg-primary/5",
          isArchived && "border-muted bg-muted/30"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div
              className={cn(
                "p-2 rounded-lg shrink-0",
                isActive && "bg-success/10",
                isDraft && "bg-primary/10",
                isArchived && "bg-muted"
              )}
            >
              {isArchived ? (
                <Archive className="w-4 h-4 text-muted-foreground" />
              ) : (
                <MenuIcon className={cn("w-4 h-4", isActive ? "text-success" : "text-primary")} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveRename();
                      if (e.key === "Escape") handleCancelRename();
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveRename}>
                    <Check className="w-4 h-4 text-success" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelRename}>
                    <X className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{menu.name}</span>
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className={cn(
                        "text-[10px] shrink-0",
                        isActive && "bg-success text-success-foreground"
                      )}
                    >
                      {menu.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>{format(new Date(menu.createdAt), "MMM d, yyyy")}</span>
                    <span>•</span>
                    <span>{menu.items.length} items</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {showActions && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!isActive && !isArchived && (
                  <DropdownMenuItem onClick={() => handleActivate(menu)}>
                    <Star className="w-4 h-4 mr-2" />
                    Set as Active
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleStartRename(menu)}>
                  <Edit2 className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(menu)}>
                  <Copy className="w-4 h-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isArchived ? (
                  <DropdownMenuItem onClick={() => handleUnarchive(menu)}>
                    <ArchiveRestore className="w-4 h-4 mr-2" />
                    Restore
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => handleArchive(menu)}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(menu)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="p-6 border-b border-border">
            <SheetTitle className="flex items-center gap-2">
              <MenuIcon className="w-5 h-5" />
              Menu Manager
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-6 space-y-6">
              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={() => setIsNewMenuDialogOpen(true)} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  New Menu
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCompareDialogOpen(true)}
                  disabled={menus.length < 2}
                >
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare
                </Button>
              </div>

              {/* Active Menu */}
              {activeMenu && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">Active Menu</h3>
                  <MenuCard menu={activeMenu} />
                </div>
              )}

              {/* Draft Menus */}
              {draftMenus.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Drafts ({draftMenus.length})
                  </h3>
                  <AnimatePresence mode="popLayout">
                    {draftMenus.map((menu) => (
                      <MenuCard key={menu.id} menu={menu} />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Archived Menus */}
              {archivedMenus.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Archived ({archivedMenus.length})
                  </h3>
                  <AnimatePresence mode="popLayout">
                    {archivedMenus.map((menu) => (
                      <MenuCard key={menu.id} menu={menu} />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {menus.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <MenuIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No menus yet</p>
                  <p className="text-sm">Create your first menu to get started</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* New Menu Dialog */}
      <Dialog open={isNewMenuDialogOpen} onOpenChange={setIsNewMenuDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Menu</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newMenuName}
              onChange={(e) => setNewMenuName(e.target.value)}
              placeholder="e.g., Spring Menu 2026, Weekend Brunch..."
              onKeyDown={(e) => e.key === "Enter" && handleCreateMenu()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMenuDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateMenu} disabled={!newMenuName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={isDuplicateDialogOpen} onOpenChange={setIsDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Menu</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              placeholder="New menu name..."
              onKeyDown={(e) => e.key === "Enter" && handleConfirmDuplicate()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmDuplicate} disabled={!duplicateName.trim()}>
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Menu</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{menuToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="w-5 h-5" />
              Compare Menus
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">First Menu</label>
              <Select value={compareMenu1} onValueChange={setCompareMenu1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select menu..." />
                </SelectTrigger>
                <SelectContent>
                  {menus.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Second Menu</label>
              <Select value={compareMenu2} onValueChange={setCompareMenu2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select menu..." />
                </SelectTrigger>
                <SelectContent>
                  {menus
                    .filter((m) => m.id !== compareMenu1)
                    .map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.status})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleCompare}
            disabled={!compareMenu1 || !compareMenu2}
            className="w-full"
          >
            Compare
          </Button>

          {comparisonResult && comparisonResult.menu1 && comparisonResult.menu2 && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-semibold">{comparisonResult.menu1.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {comparisonResult.menu1.items.length} items
                  </p>
                </div>
                <div>
                  <p className="font-semibold">{comparisonResult.menu2.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {comparisonResult.menu2.items.length} items
                  </p>
                </div>
              </div>

              {comparisonResult.addedItems.length > 0 && (
                <div>
                  <h4 className="font-medium text-success mb-2 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Added Items ({comparisonResult.addedItems.length})
                  </h4>
                  <div className="space-y-1">
                    {comparisonResult.addedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between p-2 bg-success/10 rounded text-sm"
                      >
                        <span>{item.name}</span>
                        <span className="font-medium">${item.sellPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {comparisonResult.removedItems.length > 0 && (
                <div>
                  <h4 className="font-medium text-destructive mb-2 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" />
                    Removed Items ({comparisonResult.removedItems.length})
                  </h4>
                  <div className="space-y-1">
                    {comparisonResult.removedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between p-2 bg-destructive/10 rounded text-sm"
                      >
                        <span>{item.name}</span>
                        <span className="font-medium">${item.sellPrice.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {comparisonResult.priceChanges.length > 0 && (
                <div>
                  <h4 className="font-medium text-primary mb-2 flex items-center gap-2">
                    <ChevronRight className="w-4 h-4" />
                    Price Changes ({comparisonResult.priceChanges.length})
                  </h4>
                  <div className="space-y-1">
                    {comparisonResult.priceChanges.map((change) => (
                      <div
                        key={change.item.id}
                        className="flex justify-between p-2 bg-primary/10 rounded text-sm"
                      >
                        <span>{change.item.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground line-through">
                            ${change.oldPrice.toFixed(2)}
                          </span>
                          <ChevronRight className="w-3 h-3" />
                          <span className="font-medium">${change.newPrice.toFixed(2)}</span>
                          <Badge
                            variant={change.change > 0 ? "default" : "secondary"}
                            className={cn(
                              "text-xs",
                              change.change > 0 ? "bg-success" : "bg-destructive"
                            )}
                          >
                            {change.change > 0 ? "+" : ""}
                            {change.change.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {comparisonResult.addedItems.length === 0 &&
                comparisonResult.removedItems.length === 0 &&
                comparisonResult.priceChanges.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No differences found between these menus.
                  </p>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MenuManagerDrawer;
