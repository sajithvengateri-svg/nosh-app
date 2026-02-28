import { format } from "date-fns";
import { Menu } from "@/types/menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Archive, ChevronDown, Eye, FolderOpen, RotateCcw } from "lucide-react";
import { useState, useMemo } from "react";

interface ArchivedCostingListProps {
  archivedMenus: Menu[];
  onViewArchived: (menu: Menu) => void;
  onUnarchive: (menuId: string) => void;
}

export default function ArchivedCostingList({ archivedMenus, onViewArchived, onUnarchive }: ArchivedCostingListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());

  // Group archived menus by month/year based on effectiveTo (archive date) or effectiveFrom
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, Menu[]> = {};
    archivedMenus.forEach(menu => {
      const dateKey = format(menu.effectiveTo || menu.effectiveFrom, "yyyy-MM");
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(menu);
    });
    // Sort keys descending (newest first)
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [archivedMenus]);

  const toggleMonth = (key: string) => {
    setOpenMonths(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (archivedMenus.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between py-3 h-auto">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-foreground text-xs font-semibold">
              <Archive className="w-3 h-3" />Archived Costing Sheets
            </span>
            <Badge variant="secondary" className="text-xs">{archivedMenus.length}</Badge>
          </div>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 pt-2">
          {groupedByMonth.map(([monthKey, menus]) => {
            const monthLabel = format(new Date(monthKey + "-01"), "MMMM yyyy");
            const isMonthOpen = openMonths.has(monthKey);

            return (
              <div key={monthKey}>
                <button
                  onClick={() => toggleMonth(monthKey)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors text-sm"
                >
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <span className="font-semibold">{monthLabel}</span>
                  <Badge variant="outline" className="text-xs ml-auto mr-2">{menus.length}</Badge>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isMonthOpen ? "rotate-180" : ""}`} />
                </button>

                {isMonthOpen && (
                  <div className="space-y-2 pl-6 pt-1 pb-2">
                    {menus.map(menu => {
                      const avgFc = menu.avgFoodCostPercent;
                      return (
                        <div key={menu.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{menu.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(menu.effectiveFrom, "dd MMM yyyy")}
                              {menu.effectiveTo && ` — ${format(menu.effectiveTo, "dd MMM yyyy")}`}
                              {" · "}{menu.totalItems} items
                              {avgFc > 0 && ` · FC% ${avgFc.toFixed(1)}%`}
                            </p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => onViewArchived(menu)} title="View">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => onUnarchive(menu.id)} title="Restore to Draft">
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
