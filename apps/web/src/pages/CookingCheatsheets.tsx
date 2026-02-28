import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Thermometer,
  Flame,
  Clock,
  Droplets,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

interface Cheatsheet {
  id: string;
  title: string;
  category: string;
  content: string;
  image_url: string | null;
}

interface ChartItem {
  id: string;
  item: string;
  temp: string;
  time: string;
  notes: string;
  category: string;
}

// Default data for seeding
const defaultSousVideCharts: Omit<ChartItem, "id">[] = [
  { item: "Beef Steak (Rare)", temp: "52°C / 126°F", time: "1-2 hrs", notes: "Tender, ruby red center", category: "Sous Vide" },
  { item: "Beef Steak (Medium-Rare)", temp: "54°C / 130°F", time: "1-2 hrs", notes: "Most popular doneness", category: "Sous Vide" },
  { item: "Beef Steak (Medium)", temp: "57°C / 135°F", time: "1-2 hrs", notes: "Pink center", category: "Sous Vide" },
  { item: "Pork Chops", temp: "58°C / 136°F", time: "1-2 hrs", notes: "Juicy and tender", category: "Sous Vide" },
  { item: "Chicken Breast", temp: "63°C / 146°F", time: "1-2 hrs", notes: "Juicy, not rubbery", category: "Sous Vide" },
  { item: "Salmon", temp: "52°C / 126°F", time: "30-45 min", notes: "Silky texture", category: "Sous Vide" },
  { item: "Eggs (Soft)", temp: "63°C / 145°F", time: "45-60 min", notes: "Runny yolk, set white", category: "Sous Vide" },
];

const defaultOvenCharts: Omit<ChartItem, "id">[] = [
  { item: "Prime Rib Roast", temp: "120°C / 250°F", time: "3-4 hrs", notes: "Low and slow", category: "Oven" },
  { item: "Whole Chicken", temp: "180°C / 350°F", time: "1-1.5 hrs", notes: "Until 74°C internal", category: "Oven" },
  { item: "Lamb Leg", temp: "160°C / 325°F", time: "2-3 hrs", notes: "Medium: 63°C internal", category: "Oven" },
  { item: "Pork Belly", temp: "220°C / 425°F", time: "30 min + 90 min at 160°C", notes: "Start high for skin", category: "Oven" },
  { item: "Roasted Vegetables", temp: "200°C / 400°F", time: "30-45 min", notes: "High heat caramelization", category: "Oven" },
];

const defaultSteamCharts: Omit<ChartItem, "id">[] = [
  { item: "Asparagus", temp: "100°C / 212°F", time: "2-4 min", notes: "Tender-crisp", category: "Steam" },
  { item: "Broccoli Florets", temp: "100°C / 212°F", time: "3-4 min", notes: "Vibrant color", category: "Steam" },
  { item: "Green Beans", temp: "100°C / 212°F", time: "4-5 min", notes: "Snap when bent", category: "Steam" },
  { item: "Fish Fillet", temp: "100°C / 212°F", time: "6-8 min", notes: "Flakes easily", category: "Steam" },
  { item: "Dim Sum", temp: "100°C / 212°F", time: "8-12 min", notes: "Wrapper translucent", category: "Steam" },
];

const categoryOptions = ["Sous Vide", "Oven", "Steam", "Sauces", "Prep", "General"];

const CookingCheatsheets = () => {
  const { canEdit } = useAuth();
  const { currentOrg } = useOrg();
  const [searchQuery, setSearchQuery] = useState("");
  const [cheatsheets, setCheatsheets] = useState<Cheatsheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [chartDialogOpen, setChartDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSheet, setEditingSheet] = useState<Cheatsheet | null>(null);
  const [editingChart, setEditingChart] = useState<ChartItem | null>(null);
  const [deletingSheet, setDeletingSheet] = useState<Cheatsheet | null>(null);
  const [deletingChart, setDeletingChart] = useState<ChartItem | null>(null);
  const [activeChartCategory, setActiveChartCategory] = useState<string>("Sous Vide");

  const [formData, setFormData] = useState({
    title: "",
    category: "General",
    content: "",
  });

  const [chartFormData, setChartFormData] = useState({
    item: "",
    temp: "",
    time: "",
    notes: "",
    category: "Sous Vide",
  });

  const hasEditPermission = canEdit("cheatsheets");

  useEffect(() => {
    fetchCheatsheets();
  }, []);

  const fetchCheatsheets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cheatsheets")
      .select("*")
      .order("category")
      .order("title");

    if (error) {
      console.error("Error fetching cheatsheets:", error);
    } else {
      // If no chart data exists for the cooking categories, seed with defaults
      const sousVideItems = (data || []).filter(s => s.category === "Sous Vide");
      const ovenItems = (data || []).filter(s => s.category === "Oven");
      const steamItems = (data || []).filter(s => s.category === "Steam");

      if (sousVideItems.length === 0 && ovenItems.length === 0 && steamItems.length === 0) {
        await seedDefaultCharts();
        // Refetch after seeding
        const { data: refreshedData } = await supabase
          .from("cheatsheets")
          .select("*")
          .order("category")
          .order("title");
        setCheatsheets(refreshedData || []);
      } else {
        setCheatsheets(data || []);
      }
    }
    setLoading(false);
  };

  const seedDefaultCharts = async () => {
    const allDefaults = [
      ...defaultSousVideCharts,
      ...defaultOvenCharts,
      ...defaultSteamCharts,
    ];

    const toInsert = allDefaults.map(d => ({
      title: d.item,
      category: d.category,
      content: JSON.stringify({ temp: d.temp, time: d.time, notes: d.notes }),
      org_id: currentOrg?.id,
    }));

    await supabase.from("cheatsheets").insert(toInsert);
  };

  const parseChartContent = (sheet: Cheatsheet): ChartItem => {
    try {
      const parsed = JSON.parse(sheet.content);
      return {
        id: sheet.id,
        item: sheet.title,
        temp: parsed.temp || "",
        time: parsed.time || "",
        notes: parsed.notes || "",
        category: sheet.category,
      };
    } catch {
      return {
        id: sheet.id,
        item: sheet.title,
        temp: "",
        time: "",
        notes: sheet.content,
        category: sheet.category,
      };
    }
  };

  const getChartItems = (category: string): ChartItem[] => {
    return cheatsheets
      .filter(s => s.category === category)
      .map(parseChartContent);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    if (editingSheet) {
      const { error } = await supabase
        .from("cheatsheets")
        .update({
          title: formData.title,
          category: formData.category,
          content: formData.content,
        })
        .eq("id", editingSheet.id);

      if (error) {
        toast.error("Failed to update cheatsheet");
        return;
      }
      toast.success("Cheatsheet updated");
    } else {
      const { error } = await supabase.from("cheatsheets").insert({
        title: formData.title,
        category: formData.category,
        content: formData.content,
        org_id: currentOrg?.id,
      });

      if (error) {
        toast.error("Failed to create cheatsheet");
        return;
      }
      toast.success("Cheatsheet created");
    }

    resetForm();
    fetchCheatsheets();
  };

  const handleChartSubmit = async () => {
    if (!chartFormData.item.trim()) {
      toast.error("Item name is required");
      return;
    }

    const content = JSON.stringify({
      temp: chartFormData.temp,
      time: chartFormData.time,
      notes: chartFormData.notes,
    });

    if (editingChart) {
      const { error } = await supabase
        .from("cheatsheets")
        .update({
          title: chartFormData.item,
          category: chartFormData.category,
          content: content,
        })
        .eq("id", editingChart.id);

      if (error) {
        toast.error("Failed to update entry");
        return;
      }
      toast.success("Entry updated");
    } else {
      const { error } = await supabase.from("cheatsheets").insert({
        title: chartFormData.item,
        category: chartFormData.category,
        content: content,
        org_id: currentOrg?.id,
      });

      if (error) {
        toast.error("Failed to add entry");
        return;
      }
      toast.success("Entry added");
    }

    resetChartForm();
    fetchCheatsheets();
  };

  const handleDelete = async () => {
    if (deletingSheet) {
      const { error } = await supabase.from("cheatsheets").delete().eq("id", deletingSheet.id);
      if (error) {
        toast.error("Failed to delete cheatsheet");
        return;
      }
      toast.success("Cheatsheet deleted");
      setDeletingSheet(null);
    } else if (deletingChart) {
      const { error } = await supabase.from("cheatsheets").delete().eq("id", deletingChart.id);
      if (error) {
        toast.error("Failed to delete entry");
        return;
      }
      toast.success("Entry deleted");
      setDeletingChart(null);
    }

    setDeleteDialogOpen(false);
    fetchCheatsheets();
  };

  const openEditDialog = (sheet: Cheatsheet) => {
    setEditingSheet(sheet);
    setFormData({
      title: sheet.title,
      category: sheet.category,
      content: sheet.content,
    });
    setDialogOpen(true);
  };

  const openChartEditDialog = (chart: ChartItem) => {
    setEditingChart(chart);
    setChartFormData({
      item: chart.item,
      temp: chart.temp,
      time: chart.time,
      notes: chart.notes,
      category: chart.category,
    });
    setChartDialogOpen(true);
  };

  const openAddChartDialog = (category: string) => {
    setActiveChartCategory(category);
    setChartFormData({
      item: "",
      temp: "",
      time: "",
      notes: "",
      category: category,
    });
    setChartDialogOpen(true);
  };

  const resetForm = () => {
    setDialogOpen(false);
    setEditingSheet(null);
    setFormData({
      title: "",
      category: "General",
      content: "",
    });
  };

  const resetChartForm = () => {
    setChartDialogOpen(false);
    setEditingChart(null);
    setChartFormData({
      item: "",
      temp: "",
      time: "",
      notes: "",
      category: "Sous Vide",
    });
  };

  const filterCharts = (charts: ChartItem[]) => {
    if (!searchQuery) return charts;
    return charts.filter(c => 
      c.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.notes.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const EditableChartTable = ({ 
    category, 
    icon: Icon, 
    color 
  }: { 
    category: string;
    icon: typeof Thermometer; 
    color: string;
  }) => {
    const data = filterCharts(getChartItems(category));
    
    return (
      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Item</th>
                <th className="px-4 py-3 font-medium">Temperature</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                {hasEditPermission && <th className="px-4 py-3 font-medium w-20">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", color)} />
                      <span className="font-medium">{row.item}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{row.temp}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{row.time}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">{row.notes}</td>
                  {hasEditPermission && (
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => openChartEditDialog(row)}
                          className="p-1.5 rounded hover:bg-muted transition-colors"
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => {
                            setDeletingChart(row);
                            setDeleteDialogOpen(true);
                          }}
                          className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={hasEditPermission ? 5 : 4} className="px-4 py-8 text-center text-muted-foreground">
                    No items match your search
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {hasEditPermission && (
          <div className="p-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => openAddChartDialog(category)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Filter custom cheatsheets (exclude chart categories)
  const customSheets = cheatsheets.filter(
    s => !["Sous Vide", "Oven", "Steam"].includes(s.category)
  );

  const customByCategory = customSheets.reduce((acc, sheet) => {
    if (!acc[sheet.category]) acc[sheet.category] = [];
    acc[sheet.category].push(sheet);
    return acc;
  }, {} as Record<string, Cheatsheet[]>);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title font-display">Cooking Cheatsheets</h1>
            <p className="page-subtitle">Quick reference for temperatures and cooking times</p>
          </div>
          {hasEditPermission && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Cheatsheet
            </Button>
          )}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="sous-vide" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="sous-vide" className="flex items-center gap-2">
                  <Droplets className="w-4 h-4" />
                  <span className="hidden sm:inline">Sous Vide</span>
                </TabsTrigger>
                <TabsTrigger value="oven" className="flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  <span className="hidden sm:inline">Oven</span>
                </TabsTrigger>
                <TabsTrigger value="steam" className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4" />
                  <span className="hidden sm:inline">Steam</span>
                </TabsTrigger>
                <TabsTrigger value="custom" className="flex items-center gap-2">
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Custom</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sous-vide">
                <div className="space-y-4">
                  <div className="card-elevated p-4 border-l-4 border-l-primary">
                    <div className="flex items-center gap-3">
                      <Droplets className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold">Sous Vide Temperature Guide</p>
                        <p className="text-sm text-muted-foreground">
                          Precision water bath cooking temperatures and times
                        </p>
                      </div>
                    </div>
                  </div>
                  <EditableChartTable category="Sous Vide" icon={Droplets} color="text-primary" />
                </div>
              </TabsContent>

              <TabsContent value="oven">
                <div className="space-y-4">
                  <div className="card-elevated p-4 border-l-4 border-l-warning">
                    <div className="flex items-center gap-3">
                      <Flame className="w-5 h-5 text-warning" />
                      <div>
                        <p className="font-semibold">Oven & Slow Cooking Guide</p>
                        <p className="text-sm text-muted-foreground">
                          Roasting, braising, and slow cooking temperatures
                        </p>
                      </div>
                    </div>
                  </div>
                  <EditableChartTable category="Oven" icon={Flame} color="text-warning" />
                </div>
              </TabsContent>

              <TabsContent value="steam">
                <div className="space-y-4">
                  <div className="card-elevated p-4 border-l-4 border-l-success">
                    <div className="flex items-center gap-3">
                      <Thermometer className="w-5 h-5 text-success" />
                      <div>
                        <p className="font-semibold">Steam Times Guide</p>
                        <p className="text-sm text-muted-foreground">
                          Steaming times for vegetables, seafood, and more
                        </p>
                      </div>
                    </div>
                  </div>
                  <EditableChartTable category="Steam" icon={Thermometer} color="text-success" />
                </div>
              </TabsContent>

              <TabsContent value="custom">
                <div className="space-y-6">
                  {customSheets.length === 0 ? (
                    <div className="card-elevated p-12 text-center">
                      <Edit className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                      <p className="text-muted-foreground">No custom cheatsheets yet</p>
                      {hasEditPermission && (
                        <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Cheatsheet
                        </Button>
                      )}
                    </div>
                  ) : (
                    Object.entries(customByCategory).map(([category, sheets]) => (
                      <div key={category}>
                        <h3 className="text-sm font-medium text-muted-foreground mb-3">{category}</h3>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sheets.map((sheet) => (
                            <div key={sheet.id} className="card-elevated p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-semibold">{sheet.title}</h4>
                                {hasEditPermission && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => openEditDialog(sheet)}
                                      className="p-1 rounded hover:bg-muted"
                                    >
                                      <Edit className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeletingSheet(sheet);
                                        setDeleteDialogOpen(true);
                                      }}
                                      className="p-1 rounded hover:bg-destructive/10"
                                    >
                                      <Trash2 className="w-4 h-4 text-destructive" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{sheet.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </motion.div>

        {/* Add/Edit Custom Cheatsheet Dialog */}
        <Dialog open={dialogOpen} onOpenChange={resetForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSheet ? "Edit Cheatsheet" : "New Cheatsheet"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Mother Sauces"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.filter(c => !["Sous Vide", "Oven", "Steam"].includes(c)).map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Content *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter your cheatsheet content..."
                  rows={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmit}>
                {editingSheet ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add/Edit Chart Entry Dialog */}
        <Dialog open={chartDialogOpen} onOpenChange={resetChartForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingChart ? `Edit ${editingChart.category} Entry` : `Add ${chartFormData.category} Entry`}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input
                  value={chartFormData.item}
                  onChange={(e) => setChartFormData({ ...chartFormData, item: e.target.value })}
                  placeholder="e.g., Beef Tenderloin"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Temperature</Label>
                  <Input
                    value={chartFormData.temp}
                    onChange={(e) => setChartFormData({ ...chartFormData, temp: e.target.value })}
                    placeholder="e.g., 54°C / 130°F"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    value={chartFormData.time}
                    onChange={(e) => setChartFormData({ ...chartFormData, time: e.target.value })}
                    placeholder="e.g., 1-2 hrs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={chartFormData.notes}
                  onChange={(e) => setChartFormData({ ...chartFormData, notes: e.target.value })}
                  placeholder="e.g., Perfect medium-rare"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetChartForm}>Cancel</Button>
              <Button onClick={handleChartSubmit}>
                {editingChart ? "Save Changes" : "Add Entry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={() => {
          setDeleteDialogOpen(false);
          setDeletingSheet(null);
          setDeletingChart(null);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {deletingChart ? "Entry" : "Cheatsheet"}</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground">
              Are you sure you want to delete "{deletingChart?.item || deletingSheet?.title}"? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDeleteDialogOpen(false);
                setDeletingSheet(null);
                setDeletingChart(null);
              }}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default CookingCheatsheets;
