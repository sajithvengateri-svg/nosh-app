import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2, BookOpen, Eye, Search, RefreshCw } from "lucide-react";
import { useAllHelpArticles, useUpsertHelpArticle, useDeleteHelpArticle, type HelpArticle, type HelpStep } from "@/hooks/useHelpArticles";
import { HelpArticleViewer } from "@/components/help/HelpArticleViewer";
import { toast } from "sonner";
import { APP_NAV_ITEMS } from "@/lib/shared/appNavItems";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/shared/supabaseClient";

const moduleOptions = [
  "chefos","bevos","restos","labouros","clockos","moneyos","reservationos","overheados","growthos","supplyos","quietaudit",
  "homecook","vendoros","foodsafety"
];

const categoryOptions = ["getting-started","feature","workflow","troubleshooting","faq"];

/** Maps APP_NAV_ITEMS keys to help article module names */
const APP_KEY_TO_MODULE: Record<string, string> = {
  chef: "chefos",
  bevos: "bevos",
  posos: "restos",
  reservation: "reservationos",
  labour: "labouros",
  supply: "supplyos",
  growth: "growthos",
  overhead: "overheados",
  money: "moneyos",
  quiet: "quietaudit",
  vendor: "vendoros",
};

export default function AdminHelpCenter() {
  const { data: articles = [], isLoading } = useAllHelpArticles();
  const upsert = useUpsertHelpArticle();
  const deleteMut = useDeleteHelpArticle();
  const { user } = useAuth();

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<HelpArticle> | null>(null);
  const [previewing, setPreviewing] = useState<HelpArticle | null>(null);
  const [moduleFilter, setModuleFilter] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  // Fetch the most recent help_refresh_log entry
  const fetchLastRefresh = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("help_refresh_log")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (data?.created_at) setLastRefresh(data.created_at);
    } catch {
      // ignore — table may not exist yet
    }
  }, []);

  useEffect(() => {
    fetchLastRefresh();
  }, [fetchLastRefresh]);

  // Coverage stats computed from articles
  const coverageStats = (() => {
    const total = articles.length;
    const published = articles.filter((a) => a.is_published).length;
    const perModule: Record<string, number> = {};
    for (const mod of moduleOptions) {
      perModule[mod] = articles.filter((a) => a.module === mod).length;
    }
    return { total, published, perModule };
  })();

  // Refresh Help — create draft stubs for nav items missing help articles
  const handleRefreshHelp = async () => {
    setIsRefreshing(true);
    try {
      let createdCount = 0;
      const modulesRefreshed: string[] = [];

      for (const [appKey, navItems] of Object.entries(APP_NAV_ITEMS)) {
        const moduleName = APP_KEY_TO_MODULE[appKey];
        if (!moduleName) continue;

        const moduleArticles = articles.filter((a) => a.module === moduleName);

        for (const navItem of navItems) {
          // Check if a matching article already exists (by module + title similarity)
          const expectedTitle = `${navItem.label} Guide`;
          const alreadyExists = moduleArticles.some(
            (a) =>
              a.title.toLowerCase() === expectedTitle.toLowerCase() ||
              a.title.toLowerCase().includes(navItem.label.toLowerCase())
          );
          if (alreadyExists) continue;

          // Create a draft stub article
          await upsert.mutateAsync({
            module: moduleName,
            title: expectedTitle,
            subtitle: `Learn how to use ${navItem.label}`,
            icon: navItem.icon,
            category: "feature",
            steps: [
              {
                step_number: 1,
                title: "Overview",
                instruction: `This guide covers ${navItem.label}. Content coming soon.`,
                tips: "",
              },
            ],
            tags: [navItem.slug],
            is_published: false,
          } as any);

          createdCount++;
          if (!modulesRefreshed.includes(moduleName)) {
            modulesRefreshed.push(moduleName);
          }
        }
      }

      // Log to help_refresh_log
      if (user?.id) {
        await supabase.from("help_refresh_log").insert({
          triggered_by: user.id,
          modules_refreshed: modulesRefreshed,
          articles_created: createdCount,
        });
        await fetchLastRefresh();
      }

      toast.success(`Created ${createdCount} draft articles`);
    } catch (err) {
      toast.error("Failed to refresh help articles");
    } finally {
      setIsRefreshing(false);
    }
  };

  const filtered = articles.filter((a) => {
    if (moduleFilter && a.module !== moduleFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return a.title.toLowerCase().includes(s) || a.module.includes(s);
    }
    return true;
  });

  const handleSave = async () => {
    if (!editing?.title || !editing?.module) {
      toast.error("Title and module are required");
      return;
    }
    try {
      await upsert.mutateAsync(editing as any);
      toast.success("Article saved");
      setEditing(null);
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this help article?")) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const addStep = () => {
    if (!editing) return;
    const steps = (editing.steps || []) as HelpStep[];
    setEditing({
      ...editing,
      steps: [...steps, { step_number: steps.length + 1, title: "", instruction: "", tips: "" }],
    });
  };

  const updateStep = (idx: number, field: keyof HelpStep, value: string | number) => {
    if (!editing) return;
    const steps = [...((editing.steps || []) as HelpStep[])];
    steps[idx] = { ...steps[idx], [field]: value };
    setEditing({ ...editing, steps });
  };

  const removeStep = (idx: number) => {
    if (!editing) return;
    const steps = ((editing.steps || []) as HelpStep[]).filter((_, i) => i !== idx);
    setEditing({ ...editing, steps: steps.map((s, i) => ({ ...s, step_number: i + 1 })) });
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6" /> Help Center Admin
          </h1>
          <p className="text-sm text-muted-foreground">{articles.length} articles total</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefreshHelp} disabled={isRefreshing}>
            <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh Help"}
          </Button>
          <Button onClick={() => setEditing({ module: "chefos", category: "feature", steps: [], tags: [], is_published: true })}>
            <Plus className="w-4 h-4 mr-1" /> New Article
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={moduleFilter || "all"} onValueChange={(v) => setModuleFilter(v === "all" ? "" : v)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All modules" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            {moduleOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Coverage Stats */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Coverage Stats</h3>
            <span className="text-xs text-muted-foreground">
              {coverageStats.published} published / {coverageStats.total} total articles
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(coverageStats.perModule).map(([mod, count]) => (
              <Badge
                key={mod}
                variant={count === 0 ? "destructive" : "secondary"}
                className="text-[10px]"
              >
                {mod}: {count} article{count !== 1 ? "s" : ""}
              </Badge>
            ))}
          </div>
          {lastRefresh && (
            <p className="text-[11px] text-muted-foreground">
              Last refresh: {new Date(lastRefresh).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      ) : (
        <div className="grid gap-2">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground truncate">{a.title}</p>
                    {!a.is_published && <Badge variant="secondary" className="text-[10px]">Draft</Badge>}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{a.module}</Badge>
                    <Badge variant="outline" className="text-[10px]">{a.category}</Badge>
                    <span className="text-[10px] text-muted-foreground">{(a.steps as any[]).length} steps</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewing(a)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(a)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Article" : "New Article"}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 pr-4">
            {editing && (
              <div className="space-y-4 pb-4">
                <Input placeholder="Title" value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                <Input placeholder="Subtitle" value={editing.subtitle || ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <Select value={editing.module || ""} onValueChange={(v) => setEditing({ ...editing, module: v })}>
                    <SelectTrigger><SelectValue placeholder="Module" /></SelectTrigger>
                    <SelectContent>{moduleOptions.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={editing.category || ""} onValueChange={(v) => setEditing({ ...editing, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>{categoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Input placeholder="Page slug" value={editing.page || ""} onChange={(e) => setEditing({ ...editing, page: e.target.value })} className="flex-1" />
                  <Input placeholder="Icon" value={editing.icon || ""} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} className="w-32" />
                </div>
                <Input
                  placeholder="Tags (comma-separated)"
                  value={(editing.tags || []).join(", ")}
                  onChange={(e) => setEditing({ ...editing, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                />
                <div className="flex items-center gap-2">
                  <Switch checked={editing.is_published ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} />
                  <span className="text-sm text-muted-foreground">Published</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Steps</h4>
                    <Button variant="outline" size="sm" onClick={addStep}><Plus className="w-3 h-3 mr-1" /> Add Step</Button>
                  </div>
                  {((editing.steps || []) as HelpStep[]).map((step, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-muted-foreground">Step {step.step_number}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeStep(idx)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <Input placeholder="Step title" value={step.title} onChange={(e) => updateStep(idx, "title", e.target.value)} className="h-8 text-sm" />
                        <Textarea placeholder="Instruction" value={step.instruction} onChange={(e) => updateStep(idx, "instruction", e.target.value)} className="text-sm min-h-[60px]" />
                        <Input placeholder="Tips (optional)" value={step.tips || ""} onChange={(e) => updateStep(idx, "tips", e.target.value)} className="h-8 text-sm" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </ScrollArea>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      {previewing && (
        <HelpArticleViewer
          title={previewing.title}
          steps={previewing.steps}
          onClose={() => setPreviewing(null)}
        />
      )}
    </div>
  );
}
