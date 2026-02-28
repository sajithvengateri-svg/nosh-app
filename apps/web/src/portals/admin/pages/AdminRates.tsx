import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Cpu,
  Loader2,
  Plus,
  Pencil,
  RefreshCw,
  DollarSign,
  Zap,
  ImageIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AiCostRate {
  id: string;
  provider: string;
  model: string;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  image_cost_per_call: number | null;
  source: string | null;
  effective_from: string;
  effective_until: string | null;
  created_at: string;
}

interface RateForm {
  provider: string;
  model: string;
  input_cost_per_1k: string;
  output_cost_per_1k: string;
  image_cost_per_call: string;
  source: string;
}

const EMPTY_FORM: RateForm = {
  provider: "",
  model: "",
  input_cost_per_1k: "",
  output_cost_per_1k: "",
  image_cost_per_call: "",
  source: "manual",
};

const PROVIDER_OPTIONS = ["openai", "anthropic", "google", "mistral", "cohere", "other"];
const SOURCE_OPTIONS = ["manual", "api_sync", "pricing_page"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AdminRates = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RateForm>(EMPTY_FORM);
  const [syncing, setSyncing] = useState(false);

  // ---- Fetch current rates (effective_until IS NULL) ----
  const { data: rates, isLoading } = useQuery({
    queryKey: ["admin-ai-cost-rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_cost_rates")
        .select("*")
        .is("effective_until", null)
        .order("provider")
        .order("model");
      if (error) throw error;
      return (data || []) as AiCostRate[];
    },
  });

  // ---- Upsert mutation (for add: insert new row; for edit: expire old, insert new) ----
  const upsertMutation = useMutation({
    mutationFn: async (payload: {
      id?: string;
      provider: string;
      model: string;
      input_cost_per_1k: number;
      output_cost_per_1k: number;
      image_cost_per_call: number | null;
      source: string | null;
    }) => {
      const now = new Date().toISOString();

      if (payload.id) {
        // Expire the old rate
        const { error: expireErr } = await supabase
          .from("ai_cost_rates")
          .update({ effective_until: now })
          .eq("id", payload.id);
        if (expireErr) throw expireErr;
      }

      // Insert the new rate
      const { error: insertErr } = await supabase.from("ai_cost_rates").insert({
        provider: payload.provider,
        model: payload.model,
        input_cost_per_1k: payload.input_cost_per_1k,
        output_cost_per_1k: payload.output_cost_per_1k,
        image_cost_per_call: payload.image_cost_per_call,
        source: payload.source,
        effective_from: now,
        effective_until: null,
      });
      if (insertErr) throw insertErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ai-cost-rates"] });
      toast.success(editingId ? "Rate updated successfully" : "Rate created successfully");
      closeDialog();
    },
    onError: (err: any) => {
      toast.error(`Failed to save rate: ${err.message}`);
    },
  });

  // ---- Sync rates from edge function ----
  const handleSyncRates = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("sync-ai-rates");
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["admin-ai-cost-rates"] });
      toast.success("Rates synced successfully from provider APIs");
    } catch (err: any) {
      toast.error(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  // ---- Helpers ----
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (r: AiCostRate) => {
    setEditingId(r.id);
    setForm({
      provider: r.provider,
      model: r.model,
      input_cost_per_1k: String(r.input_cost_per_1k),
      output_cost_per_1k: String(r.output_cost_per_1k),
      image_cost_per_call: r.image_cost_per_call != null ? String(r.image_cost_per_call) : "",
      source: r.source || "manual",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = () => {
    if (!form.provider.trim()) {
      toast.error("Provider is required");
      return;
    }
    if (!form.model.trim()) {
      toast.error("Model is required");
      return;
    }
    const inputCost = parseFloat(form.input_cost_per_1k);
    const outputCost = parseFloat(form.output_cost_per_1k);
    if (isNaN(inputCost) || inputCost < 0) {
      toast.error("Input cost must be a valid non-negative number");
      return;
    }
    if (isNaN(outputCost) || outputCost < 0) {
      toast.error("Output cost must be a valid non-negative number");
      return;
    }
    const imageCost = form.image_cost_per_call
      ? parseFloat(form.image_cost_per_call)
      : null;
    if (imageCost !== null && (isNaN(imageCost) || imageCost < 0)) {
      toast.error("Image cost must be a valid non-negative number");
      return;
    }

    upsertMutation.mutate({
      id: editingId || undefined,
      provider: form.provider.trim(),
      model: form.model.trim(),
      input_cost_per_1k: inputCost,
      output_cost_per_1k: outputCost,
      image_cost_per_call: imageCost,
      source: form.source || null,
    });
  };

  const providerColor = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "openai":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "anthropic":
        return "bg-orange-500/10 text-orange-600 border-orange-500/20";
      case "google":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "mistral":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "cohere":
        return "bg-pink-500/10 text-pink-600 border-pink-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // ---- Summary stats ----
  const providerCount = new Set(rates?.map((r) => r.provider)).size;
  const modelCount = rates?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Cpu className="w-8 h-8 text-primary" />
            AI Cost Rates
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage per-model AI cost rates for accurate usage billing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSyncRates} disabled={syncing}>
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync Rates
          </Button>
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add Rate
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Providers</p>
                <p className="text-3xl font-bold">{providerCount}</p>
              </div>
              <Zap className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Models</p>
                <p className="text-3xl font-bold">{modelCount}</p>
              </div>
              <Cpu className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  With Image Pricing
                </p>
                <p className="text-3xl font-bold">
                  {rates?.filter(
                    (r) => r.image_cost_per_call != null && r.image_cost_per_call > 0
                  ).length || 0}
                </p>
              </div>
              <ImageIcon className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rates table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Rates</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !rates || rates.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active rates configured. Add a rate or sync from providers.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Input $/1K</TableHead>
                    <TableHead className="text-right">Output $/1K</TableHead>
                    <TableHead className="text-right">Image $/call</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Effective From</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rates.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("capitalize", providerColor(r.provider))}
                        >
                          {r.provider}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">{r.model}</span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${r.input_cost_per_1k.toFixed(6)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${r.output_cost_per_1k.toFixed(6)}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.image_cost_per_call != null
                          ? `$${r.image_cost_per_call.toFixed(4)}`
                          : "--"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {r.source || "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(r.effective_from), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Rate" : "Add New Rate"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Provider</label>
              <Select
                value={form.provider}
                onValueChange={(v) => setForm({ ...form, provider: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="e.g. gpt-4o, claude-3-opus"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Input $/1K tokens</label>
                <Input
                  type="number"
                  min={0}
                  step="0.000001"
                  value={form.input_cost_per_1k}
                  onChange={(e) =>
                    setForm({ ...form, input_cost_per_1k: e.target.value })
                  }
                  placeholder="e.g. 0.005"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Output $/1K tokens</label>
                <Input
                  type="number"
                  min={0}
                  step="0.000001"
                  value={form.output_cost_per_1k}
                  onChange={(e) =>
                    setForm({ ...form, output_cost_per_1k: e.target.value })
                  }
                  placeholder="e.g. 0.015"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Image $/call{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </label>
              <Input
                type="number"
                min={0}
                step="0.0001"
                value={form.image_cost_per_call}
                onChange={(e) =>
                  setForm({ ...form, image_cost_per_call: e.target.value })
                }
                placeholder="e.g. 0.04"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Source</label>
              <Select
                value={form.source}
                onValueChange={(v) => setForm({ ...form, source: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={upsertMutation.isPending}
              >
                {upsertMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRates;
