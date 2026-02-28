import React, { useState, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Loader2, Plus, Search, DollarSign, TrendingUp, Users, Clock,
  Building2, CalendarDays, Flame, Thermometer, Snowflake, GripVertical,
  Filter, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  VF_PIPELINE_STAGES,
  type VFPipelineStage,
  type VFPipelineStageConfig,
  type VFLeadTemperature,
} from "@/lib/shared/types/venueflow.types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENT_TYPES = ["WEDDING", "CORPORATE", "BIRTHDAY", "PRIVATE", "CUSTOM"] as const;

const ROOM_COLORS: Record<string, string> = {
  PRIVATE_DINING: "#6366f1",
  CHEFS_TABLE: "#d97706",
  TERRACE: "#059669",
  GARDEN: "#16a34a",
  MAIN_DINING: "#2563eb",
  WINE_CELLAR: "#9333ea",
  ROOFTOP: "#0891b2",
};

const TEMPERATURE_ICON: Record<VFLeadTemperature, React.ReactNode> = {
  HOT: <Flame className="w-3 h-3 text-red-500" />,
  WARM: <Thermometer className="w-3 h-3 text-amber-500" />,
  COLD: <Snowflake className="w-3 h-3 text-blue-400" />,
};

const ACTIVE_STAGES = VF_PIPELINE_STAGES.filter(
  (s) => s.value !== "LOST" && s.value !== "COMPLETED" && s.value !== "POST_EVENT",
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
  return `$${amount.toLocaleString()}`;
}

function daysInStage(updatedAt: string | null): number {
  if (!updatedAt) return 0;
  return differenceInDays(new Date(), parseISO(updatedAt));
}

function getDaysInStageBadgeColor(days: number): string {
  if (days <= 3) return "bg-emerald-500/10 text-emerald-700";
  if (days <= 7) return "bg-amber-500/10 text-amber-700";
  return "bg-red-500/10 text-red-700";
}

// ---------------------------------------------------------------------------
// Quick-add form initial state
// ---------------------------------------------------------------------------

const EMPTY_FORM = {
  contact_name: "",
  company_name: "",
  email: "",
  phone: "",
  event_type: "CUSTOM",
  event_date: "",
  party_size: "",
  notes: "",
  temperature: "WARM" as VFLeadTemperature,
};

// ---------------------------------------------------------------------------
// Component: VFPipeline
// ---------------------------------------------------------------------------

const VFPipeline: React.FC = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  // -- Local state ----------------------------------------------------------
  const [search, setSearch] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [quickForm, setQuickForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [dragClientId, setDragClientId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<VFPipelineStage | null>(null);

  // Filter state
  const [filterRoom, setFilterRoom] = useState<string>("ALL");
  const [filterTemperature, setFilterTemperature] = useState<string>("ALL");
  const [filterEventType, setFilterEventType] = useState<string>("ALL");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Ref for preventing repeated drops
  const dropProcessing = useRef(false);

  // -- Data fetching --------------------------------------------------------

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["vf_pipeline_clients", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("res_function_clients")
        .select("*")
        .eq("org_id", orgId!)
        .is("archived_at", null)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Fetch venue spaces for room filter and card badges
  const { data: venueSpaces = [] } = useQuery({
    queryKey: ["res_venue_spaces", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("res_venue_spaces")
        .select("*")
        .eq("org_id", orgId!)
        .eq("is_active", true)
        .order("sort_order");
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // Fetch associated functions (events) for extra card data (event_date, party_size, room)
  const { data: functions = [] } = useQuery({
    queryKey: ["vf_pipeline_functions", orgId],
    queryFn: async () => {
      const { data } = await supabase
        .from("res_functions")
        .select("*")
        .eq("org_id", orgId!)
        .order("event_date", { ascending: true });
      return data ?? [];
    },
    enabled: !!orgId,
  });

  // -- Derived data ---------------------------------------------------------

  // Build a lookup: client_id -> latest function
  const functionByClient = useMemo(() => {
    const map: Record<string, any> = {};
    for (const fn of functions) {
      const cid = fn.client_id;
      if (!cid) continue;
      // Keep the upcoming/latest function
      if (!map[cid] || new Date(fn.event_date) > new Date(map[cid].event_date)) {
        map[cid] = fn;
      }
    }
    return map;
  }, [functions]);

  // Room lookup
  const spaceMap = useMemo(() => {
    const map: Record<string, any> = {};
    for (const s of venueSpaces) map[s.id] = s;
    return map;
  }, [venueSpaces]);

  // Apply search + filters
  const filtered = useMemo(() => {
    return clients.filter((c: any) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        const matchesSearch =
          c.contact_name?.toLowerCase().includes(q) ||
          c.company_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }

      // Temperature filter
      if (filterTemperature !== "ALL" && c.temperature !== filterTemperature) return false;

      // Event type filter (from associated function)
      if (filterEventType !== "ALL") {
        const fn = functionByClient[c.id];
        if (!fn || fn.event_type !== filterEventType) return false;
      }

      // Room filter (from associated function)
      if (filterRoom !== "ALL") {
        const fn = functionByClient[c.id];
        if (!fn || fn.venue_space_id !== filterRoom) return false;
      }

      // Date range filter (from associated function)
      if (filterDateFrom || filterDateTo) {
        const fn = functionByClient[c.id];
        if (!fn) return false;
        if (filterDateFrom && fn.event_date < filterDateFrom) return false;
        if (filterDateTo && fn.event_date > filterDateTo) return false;
      }

      return true;
    });
  }, [clients, search, filterTemperature, filterEventType, filterRoom, filterDateFrom, filterDateTo, functionByClient]);

  // Group by pipeline stage
  const stageGroups = useMemo(() => {
    return VF_PIPELINE_STAGES.map((stage) => {
      const stageClients = filtered.filter((c: any) => c.pipeline_stage === stage.value);
      const stageTotal = stageClients.reduce(
        (sum: number, c: any) => sum + (Number(c.total_spend) || 0),
        0,
      );
      return { ...stage, clients: stageClients, total: stageTotal };
    });
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const activeClients = clients.filter(
      (c: any) => !["COMPLETED", "LOST", "POST_EVENT"].includes(c.pipeline_stage),
    );
    const totalPipelineValue = activeClients.reduce(
      (s: number, c: any) => s + (Number(c.total_spend) || 0),
      0,
    );
    const totalDeals = clients.length;
    const completedDeals = clients.filter((c: any) => c.pipeline_stage === "COMPLETED").length;
    const lostDeals = clients.filter((c: any) => c.pipeline_stage === "LOST").length;
    const closedDeals = completedDeals + lostDeals;
    const conversionRate = closedDeals > 0 ? Math.round((completedDeals / closedDeals) * 100) : 0;

    return {
      totalPipelineValue,
      activeDeals: activeClients.length,
      totalDeals,
      conversionRate,
    };
  }, [clients]);

  const hasActiveFilters =
    filterRoom !== "ALL" ||
    filterTemperature !== "ALL" ||
    filterEventType !== "ALL" ||
    filterDateFrom !== "" ||
    filterDateTo !== "";

  // -- Handlers -------------------------------------------------------------

  const clearFilters = useCallback(() => {
    setFilterRoom("ALL");
    setFilterTemperature("ALL");
    setFilterEventType("ALL");
    setFilterDateFrom("");
    setFilterDateTo("");
  }, []);

  const handleQuickAdd = async () => {
    if (!orgId || !quickForm.contact_name.trim()) {
      toast.error("Contact name is required");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("res_function_clients").insert({
      org_id: orgId,
      contact_name: quickForm.contact_name.trim(),
      company_name: quickForm.company_name.trim() || null,
      email: quickForm.email.trim() || null,
      phone: quickForm.phone.trim() || null,
      pipeline_stage: "INQUIRY",
      temperature: quickForm.temperature,
      notes: quickForm.notes.trim() || null,
    } as any);

    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    // If event details provided, create a function too
    if (quickForm.event_date) {
      // Get the newly created client to link
      const { data: newClients } = await supabase
        .from("res_function_clients")
        .select("id")
        .eq("org_id", orgId)
        .eq("contact_name", quickForm.contact_name.trim())
        .order("created_at", { ascending: false })
        .limit(1);

      if (newClients?.[0]) {
        await supabase.from("res_functions").insert({
          org_id: orgId,
          client_id: newClients[0].id,
          client_name: quickForm.contact_name.trim(),
          client_email: quickForm.email.trim() || null,
          client_phone: quickForm.phone.trim() || null,
          event_date: quickForm.event_date,
          event_type: quickForm.event_type,
          party_size: quickForm.party_size ? Number(quickForm.party_size) : 20,
          status: "ENQUIRY",
        } as any);
      }
    }

    setSaving(false);
    toast.success("Lead added to Inquiry");
    setShowQuickAdd(false);
    setQuickForm(EMPTY_FORM);
    qc.invalidateQueries({ queryKey: ["vf_pipeline_clients"] });
    qc.invalidateQueries({ queryKey: ["vf_pipeline_functions"] });
  };

  const handleStageChange = useCallback(
    async (clientId: string, fromStage: string, toStage: VFPipelineStage) => {
      if (fromStage === toStage || dropProcessing.current) return;
      dropProcessing.current = true;

      // Optimistic update
      qc.setQueryData(["vf_pipeline_clients", orgId], (old: any[]) =>
        old?.map((c) => (c.id === clientId ? { ...c, pipeline_stage: toStage } : c)),
      );

      const { error } = await supabase
        .from("res_function_clients")
        .update({ pipeline_stage: toStage, updated_at: new Date().toISOString() } as any)
        .eq("id", clientId);

      if (error) {
        toast.error("Failed to move deal: " + error.message);
        qc.invalidateQueries({ queryKey: ["vf_pipeline_clients"] });
        dropProcessing.current = false;
        return;
      }

      // Log activity
      await supabase.from("vf_pipeline_activities").insert({
        org_id: orgId,
        client_id: clientId,
        activity_type: "STAGE_CHANGE",
        from_stage: fromStage,
        to_stage: toStage,
        subject: `Moved from ${fromStage} to ${toStage}`,
        metadata: {},
      } as any).then(({ error: logError }) => {
        if (logError) console.warn("Activity log failed:", logError.message);
      });

      const stageLabel = VF_PIPELINE_STAGES.find((s) => s.value === toStage)?.label ?? toStage;
      toast.success(`Moved to ${stageLabel}`);
      qc.invalidateQueries({ queryKey: ["vf_pipeline_clients"] });
      dropProcessing.current = false;
    },
    [orgId, qc],
  );

  // -- Drag & Drop ----------------------------------------------------------

  const handleDragStart = useCallback(
    (e: React.DragEvent, clientId: string) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", clientId);
      setDragClientId(clientId);
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, stage: VFPipelineStage) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverStage(stage);
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverStage(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toStage: VFPipelineStage) => {
      e.preventDefault();
      setDragOverStage(null);
      const clientId = e.dataTransfer.getData("text/plain");
      if (!clientId) return;

      const client = clients.find((c: any) => c.id === clientId);
      if (!client) return;

      handleStageChange(clientId, (client as any).pipeline_stage, toStage);
      setDragClientId(null);
    },
    [clients, handleStageChange],
  );

  const handleDragEnd = useCallback(() => {
    setDragClientId(null);
    setDragOverStage(null);
  }, []);

  // -- Render ---------------------------------------------------------------

  if (!orgId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Select an organization to view the pipeline.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="shrink-0 px-4 lg:px-6 pt-4 lg:pt-6 pb-3 space-y-4 bg-vf-cream/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-vf-navy flex items-center justify-center">
              <Building2 className="w-5 h-5 text-vf-gold" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-vf-navy font-display">VenueFlow Pipeline</h1>
              <p className="text-xs text-muted-foreground">
                {stats.activeDeals} active deal{stats.activeDeals !== 1 ? "s" : ""} across {VF_PIPELINE_STAGES.length} stages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filters
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-vf-gold" />
              )}
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-vf-navy/10">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-vf-navy/5 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-vf-navy" />
              </div>
              <div>
                <p className="text-lg font-bold text-vf-navy">{formatCurrency(stats.totalPipelineValue)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pipeline Value</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-vf-navy/10">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-vf-gold/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-vf-gold" />
              </div>
              <div>
                <p className="text-lg font-bold text-vf-navy">{stats.activeDeals}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Active Deals</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-vf-navy/10">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-vf-navy">{stats.conversionRate}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Conversion</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-vf-navy/10">
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-vf-navy">{stats.totalDeals}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Deals</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, or email..."
            className="pl-9 bg-white border-vf-navy/10 focus-visible:ring-vf-gold/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter bar */}
        {showFilters && (
          <div className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-white border border-vf-navy/10 animate-fade-in">
            <div className="min-w-[140px]">
              <Label className="text-xs text-muted-foreground">Room</Label>
              <Select value={filterRoom} onValueChange={setFilterRoom}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All rooms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All rooms</SelectItem>
                  {venueSpaces.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[120px]">
              <Label className="text-xs text-muted-foreground">Temperature</Label>
              <Select value={filterTemperature} onValueChange={setFilterTemperature}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="HOT">Hot</SelectItem>
                  <SelectItem value="WARM">Warm</SelectItem>
                  <SelectItem value="COLD">Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[130px]">
              <Label className="text-xs text-muted-foreground">Event Type</Label>
              <Select value={filterEventType} onValueChange={setFilterEventType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All types</SelectItem>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input
                type="date"
                className="h-8 text-xs w-[130px]"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input
                type="date"
                className="h-8 text-xs w-[130px]"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
              />
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={clearFilters}>
                <X className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pipeline Kanban Board */}
      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-vf-navy" />
        </div>
      ) : (
        <>
          {/* Desktop: horizontal scroll kanban */}
          <div className="hidden md:block flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full w-full">
              <div className="flex gap-3 px-4 lg:px-6 pb-6 pt-2 min-w-max">
                {stageGroups.map((stage) => (
                  <PipelineColumn
                    key={stage.value}
                    stage={stage}
                    functionByClient={functionByClient}
                    spaceMap={spaceMap}
                    dragClientId={dragClientId}
                    dragOverStage={dragOverStage}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    onCardClick={(id) => navigate(`/reservation/functions/crm/${id}`)}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Mobile: horizontal scrollable pipeline */}
          <div className="md:hidden flex-1 min-h-0 overflow-x-auto overflow-y-auto px-4 pb-24 pt-2">
            <div className="flex gap-3 min-w-max pb-4">
              {stageGroups.map((stage) => (
                <PipelineColumn
                  key={stage.value}
                  stage={stage}
                  functionByClient={functionByClient}
                  spaceMap={spaceMap}
                  dragClientId={dragClientId}
                  dragOverStage={dragOverStage}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  onCardClick={(id) => navigate(`/reservation/functions/crm/${id}`)}
                  isMobile
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Quick-add FAB */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-vf-navy text-white shadow-lg hover:bg-vf-navy-light active:scale-95 transition-all flex items-center justify-center group"
        aria-label="Add new lead"
      >
        <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Quick-add dialog */}
      <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-vf-navy font-display">Quick Add Lead</DialogTitle>
            <DialogDescription>Add a new inquiry to your pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Contact Name *</Label>
              <Input
                value={quickForm.contact_name}
                onChange={(e) => setQuickForm((p) => ({ ...p, contact_name: e.target.value }))}
                placeholder="e.g. Sarah Johnson"
                autoFocus
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={quickForm.company_name}
                onChange={(e) => setQuickForm((p) => ({ ...p, company_name: e.target.value }))}
                placeholder="e.g. Acme Corp"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={quickForm.email}
                  onChange={(e) => setQuickForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={quickForm.phone}
                  onChange={(e) => setQuickForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+61 4..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Event Type</Label>
                <Select
                  value={quickForm.event_type}
                  onValueChange={(v) => setQuickForm((p) => ({ ...p, event_type: v }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Temperature</Label>
                <Select
                  value={quickForm.temperature}
                  onValueChange={(v) => setQuickForm((p) => ({ ...p, temperature: v as VFLeadTemperature }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HOT">Hot</SelectItem>
                    <SelectItem value="WARM">Warm</SelectItem>
                    <SelectItem value="COLD">Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Event Date</Label>
                <Input
                  type="date"
                  value={quickForm.event_date}
                  onChange={(e) => setQuickForm((p) => ({ ...p, event_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Party Size</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="e.g. 50"
                  value={quickForm.party_size}
                  onChange={(e) => setQuickForm((p) => ({ ...p, party_size: e.target.value }))}
                />
              </div>
            </div>
            <Button
              className="w-full bg-vf-navy hover:bg-vf-navy-light text-white"
              onClick={handleQuickAdd}
              disabled={saving}
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Add to Pipeline</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Sub-component: PipelineColumn
// ---------------------------------------------------------------------------

interface PipelineColumnProps {
  stage: VFPipelineStageConfig & { clients: any[]; total: number };
  functionByClient: Record<string, any>;
  spaceMap: Record<string, any>;
  dragClientId: string | null;
  dragOverStage: VFPipelineStage | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, stage: VFPipelineStage) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, stage: VFPipelineStage) => void;
  onDragEnd: () => void;
  onCardClick: (id: string) => void;
  isMobile?: boolean;
}

const PipelineColumn: React.FC<PipelineColumnProps> = React.memo(({
  stage,
  functionByClient,
  spaceMap,
  dragClientId,
  dragOverStage,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onCardClick,
  isMobile,
}) => {
  const isDragTarget = dragOverStage === stage.value;
  const columnWidth = isMobile ? "w-[240px]" : "w-[260px]";

  return (
    <div
      className={`${columnWidth} shrink-0 flex flex-col`}
      onDragOver={(e) => onDragOver(e, stage.value)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, stage.value)}
    >
      {/* Column header */}
      <div className={`rounded-t-lg px-3 py-2 ${stage.bgColor} border border-b-0 border-current/5`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold uppercase tracking-wide ${stage.color}`}>
              {stage.label}
            </span>
            <Badge
              variant="secondary"
              className={`text-[10px] px-1.5 h-4 ${stage.bgColor} ${stage.color} border-0`}
            >
              {stage.clients.length}
            </Badge>
          </div>
          {stage.total > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground">
              {formatCurrency(stage.total)}
            </span>
          )}
        </div>
      </div>

      {/* Cards area */}
      <div
        className={`flex-1 rounded-b-lg border border-t-0 p-2 space-y-2 min-h-[120px] transition-colors duration-150 ${
          isDragTarget
            ? "bg-vf-gold/10 border-vf-gold/40"
            : "bg-muted/20 border-border/60"
        }`}
      >
        {stage.clients.map((client: any) => (
          <PipelineCard
            key={client.id}
            client={client}
            fn={functionByClient[client.id]}
            spaceMap={spaceMap}
            isDragging={dragClientId === client.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={() => onCardClick(client.id)}
          />
        ))}
        {stage.clients.length === 0 && (
          <div className="flex items-center justify-center h-20 border border-dashed rounded-md text-xs text-muted-foreground">
            No deals
          </div>
        )}
      </div>
    </div>
  );
});
PipelineColumn.displayName = "PipelineColumn";

// ---------------------------------------------------------------------------
// Sub-component: PipelineCard
// ---------------------------------------------------------------------------

interface PipelineCardProps {
  client: any;
  fn: any | undefined;
  spaceMap: Record<string, any>;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onClick: () => void;
}

const PipelineCard: React.FC<PipelineCardProps> = React.memo(({
  client,
  fn,
  spaceMap,
  isDragging,
  onDragStart,
  onDragEnd,
  onClick,
}) => {
  const room = fn?.venue_space_id ? spaceMap[fn.venue_space_id] : null;
  const roomColor = room?.color_code || (room?.room_type ? ROOM_COLORS[room.room_type] : null);
  const days = daysInStage(client.updated_at);
  const temperature: VFLeadTemperature | null = client.temperature || null;
  const spend = Number(client.total_spend) || 0;

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, client.id)}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`cursor-grab active:cursor-grabbing transition-all select-none group ${
        isDragging
          ? "opacity-40 scale-95 ring-2 ring-vf-gold"
          : "hover:border-vf-navy/30 hover:shadow-sm"
      }`}
      style={{
        borderLeftWidth: "3px",
        borderLeftColor: roomColor || "transparent",
      }}
    >
      <CardContent className="p-2.5">
        {/* Top row: name + temperature */}
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm truncate text-vf-navy">{client.contact_name}</p>
            {client.company_name && (
              <p className="text-[11px] text-muted-foreground truncate">{client.company_name}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {temperature && TEMPERATURE_ICON[temperature]}
            <GripVertical className="w-3 h-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Event details */}
        {fn && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <CalendarDays className="w-3 h-3 shrink-0" />
            <span>{format(parseISO(fn.event_date), "d MMM yyyy")}</span>
            {fn.party_size && (
              <>
                <span className="text-border">|</span>
                <Users className="w-3 h-3 shrink-0" />
                <span>{fn.party_size} pax</span>
              </>
            )}
          </div>
        )}

        {/* Bottom row: room badge, value, days-in-stage */}
        <div className="mt-2 flex items-center justify-between gap-1">
          <div className="flex items-center gap-1 min-w-0">
            {room && (
              <Badge
                variant="outline"
                className="text-[9px] px-1.5 h-4 truncate max-w-[80px]"
                style={{
                  borderColor: roomColor || undefined,
                  color: roomColor || undefined,
                }}
              >
                {room.name}
              </Badge>
            )}
            {fn?.event_type && !room && (
              <Badge variant="outline" className="text-[9px] px-1.5 h-4 truncate max-w-[80px]">
                {fn.event_type}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {spend > 0 && (
              <span className="text-[11px] font-semibold text-emerald-600">
                ${spend.toLocaleString()}
              </span>
            )}
            {days > 0 && (
              <Badge
                variant="secondary"
                className={`text-[9px] px-1 h-4 border-0 ${getDaysInStageBadgeColor(days)}`}
              >
                <Clock className="w-2.5 h-2.5 mr-0.5" />
                {days}d
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
PipelineCard.displayName = "PipelineCard";

export default VFPipeline;
