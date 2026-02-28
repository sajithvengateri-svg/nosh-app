import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { DEFAULT_SECTIONS, useGlobalMobileNavAdmin, type MobileNavSection } from "@/hooks/useMobileNavSections";
import { ALL_CHEF_NAV } from "@/lib/chefNavItems";
import {
  Save, RefreshCw, Loader2, X, Plus, Smartphone,
  Home, ChefHat, Utensils, Shield, Settings, BookOpen, Package,
  ClipboardList, Factory, Store, AlertTriangle, Wrench, LayoutGrid,
  Trash2, GraduationCap, Receipt, Users, Calendar, Activity, Menu,
  ListChecks, Gift, Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Home, ChefHat, Utensils, Shield, Settings, BookOpen, Package,
  ClipboardList, Factory, Store, AlertTriangle, Wrench, LayoutGrid,
  Trash2, GraduationCap, Receipt, Users, Calendar, Activity, Menu,
  ListChecks, Gift, Lightbulb, Smartphone,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const ALL_MODULE_PATHS = [
  ...ALL_CHEF_NAV.map((n) => ({ path: n.path, label: n.label, icon: n.icon })),
];

const MobileNavConfigurator = () => {
  const [localSections, setLocalSections] = useState<Omit<MobileNavSection, "id">[]>([]);
  const { sections, isLoading, saveSections, isSaving } = useGlobalMobileNavAdmin();

  // Sync sections on load
  useEffect(() => {
    if (!isLoading && sections) {
      setLocalSections(sections.map(({ id, ...rest }) => rest));
    }
  }, [sections, isLoading]);

  const assignedPaths = new Set(localSections.flatMap((s) => s.module_paths || []));
  const unassignedModules = ALL_MODULE_PATHS.filter((m) => !assignedPaths.has(m.path));

  const updateSection = (idx: number, patch: Partial<Omit<MobileNavSection, "id">>) => {
    setLocalSections((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const addModuleToSection = (sectionIdx: number, path: string) => {
    setLocalSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx ? { ...s, module_paths: [...(s.module_paths || []), path] } : s
      )
    );
  };

  const removeModuleFromSection = (sectionIdx: number, path: string) => {
    setLocalSections((prev) =>
      prev.map((s, i) =>
        i === sectionIdx ? { ...s, module_paths: (s.module_paths || []).filter((p) => p !== path) } : s
      )
    );
  };

  const handleSave = async () => {
    try {
      await saveSections(localSections);
      toast.success("Global mobile nav saved!");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    }
  };

  const handleReset = () => {
    setLocalSections(DEFAULT_SECTIONS.map((s) => ({ ...s, org_id: null })));
    toast.info("Reset to defaults (unsaved)");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Global Mobile Navigation
          </CardTitle>
          <CardDescription>
            Configure the 5-tab Pro mobile bottom navigation for all users.
            Drag modules into section hubs. This layout applies globally.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 5 Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {localSections.map((section, idx) => {
          const SectionIcon = ICON_MAP[section.icon_name] || Menu;
          const isHub = !section.direct_path;
          return (
            <Card key={section.section_key} className={cn("relative", isHub && "border-primary/30")}>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <SectionIcon className="w-4 h-4 text-primary" />
                  <Input
                    value={section.label}
                    onChange={(e) => updateSection(idx, { label: e.target.value })}
                    className="h-7 text-sm font-semibold px-1"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Label className="text-[10px] text-muted-foreground">Icon:</Label>
                  <Select
                    value={section.icon_name}
                    onValueChange={(v) => updateSection(idx, { icon_name: v })}
                  >
                    <SelectTrigger className="h-6 text-xs w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map((name) => {
                        const I = ICON_MAP[name];
                        return (
                          <SelectItem key={name} value={name}>
                            <span className="flex items-center gap-1.5">
                              <I className="w-3 h-3" /> {name}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                {isHub ? (
                  <Badge variant="outline" className="text-[9px] w-fit mt-1">Hub Section</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[9px] w-fit mt-1">Direct → {section.direct_path}</Badge>
                )}
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                {isHub && (
                  <>
                    {(section.module_paths || []).map((path) => {
                      const mod = ALL_MODULE_PATHS.find((m) => m.path === path);
                      return (
                        <div
                          key={path}
                          className="flex items-center justify-between bg-muted/50 rounded px-2 py-1 text-xs"
                        >
                          <span className="truncate">{mod?.label || path}</span>
                          <button
                            onClick={() => removeModuleFromSection(idx, path)}
                            className="text-destructive hover:text-destructive/80 ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                    {unassignedModules.length > 0 && (
                      <Select onValueChange={(v) => addModuleToSection(idx, v)}>
                        <SelectTrigger className="h-6 text-[10px] mt-1">
                          <Plus className="w-3 h-3 mr-1" />
                          <SelectValue placeholder="Add module..." />
                        </SelectTrigger>
                        <SelectContent>
                          {unassignedModules.map((m) => (
                            <SelectItem key={m.path} value={m.path}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Live Preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-card border rounded-2xl overflow-hidden max-w-sm mx-auto">
            <div className="flex border-t">
              {localSections.map((s) => {
                const I = ICON_MAP[s.icon_name] || Menu;
                return (
                  <div key={s.section_key} className="flex-1 flex flex-col items-center py-2">
                    <I className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[9px] text-muted-foreground mt-0.5">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Configuration
        </Button>
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Reset to Defaults
        </Button>
      </div>
    </div>
  );
};

export default MobileNavConfigurator;
