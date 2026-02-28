import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Gauge,
  Loader2,
  Plus,
  Pencil,
  ShieldCheck,
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

interface TokenQuota {
  id: string;
  tier: string;
  product_key: string;
  monthly_tokens: number;
  ai_addon_bonus: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface QuotaForm {
  tier: string;
  product_key: string;
  monthly_tokens: string;
  ai_addon_bonus: string;
}

const EMPTY_FORM: QuotaForm = {
  tier: "",
  product_key: "",
  monthly_tokens: "",
  ai_addon_bonus: "0",
};

const TIER_OPTIONS = ["free", "basic", "pro", "enterprise"];
const PRODUCT_OPTIONS = ["chefos", "food_safety", "home_chef"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AdminQuotas = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<QuotaForm>(EMPTY_FORM);

  // ---- Fetch active quotas ----
  const { data: quotas, isLoading } = useQuery({
    queryKey: ["admin-ai-token-quotas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_token_quotas")
        .select("*")
        .eq("is_active", true)
        .order("tier")
        .order("product_key");
      if (error) throw error;
      return (data || []) as TokenQuota[];
    },
  });

  // ---- Upsert mutation ----
  const upsertMutation = useMutation({
    mutationFn: async (payload: {
      id?: string;
      tier: string;
      product_key: string;
      monthly_tokens: number;
      ai_addon_bonus: number;
    }) => {
      if (payload.id) {
        const { error } = await supabase
          .from("ai_token_quotas")
          .update({
            monthly_tokens: payload.monthly_tokens,
            ai_addon_bonus: payload.ai_addon_bonus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("ai_token_quotas").insert({
          tier: payload.tier,
          product_key: payload.product_key,
          monthly_tokens: payload.monthly_tokens,
          ai_addon_bonus: payload.ai_addon_bonus,
          is_active: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ai-token-quotas"] });
      toast.success(editingId ? "Quota updated successfully" : "Quota created successfully");
      closeDialog();
    },
    onError: (err: any) => {
      toast.error(`Failed to save quota: ${err.message}`);
    },
  });

  // ---- Helpers ----
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (q: TokenQuota) => {
    setEditingId(q.id);
    setForm({
      tier: q.tier,
      product_key: q.product_key,
      monthly_tokens: String(q.monthly_tokens),
      ai_addon_bonus: String(q.ai_addon_bonus),
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = () => {
    if (!form.tier || !form.product_key) {
      toast.error("Tier and Product are required");
      return;
    }
    const monthly = parseInt(form.monthly_tokens, 10);
    const addon = parseInt(form.ai_addon_bonus, 10) || 0;
    if (isNaN(monthly) || monthly < 0) {
      toast.error("Monthly tokens must be a valid positive number");
      return;
    }
    upsertMutation.mutate({
      id: editingId || undefined,
      tier: form.tier,
      product_key: form.product_key,
      monthly_tokens: monthly,
      ai_addon_bonus: addon,
    });
  };

  const tierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-muted text-muted-foreground";
      case "basic":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "pro":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "enterprise":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Gauge className="w-8 h-8 text-primary" />
            Token Quotas
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage monthly AI token quotas per tier and product
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Quota
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TIER_OPTIONS.map((tier) => {
          const count = quotas?.filter((q) => q.tier === tier).length || 0;
          return (
            <Card key={tier}>
              <CardContent className="p-4 flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    tier === "free"
                      ? "bg-muted"
                      : tier === "basic"
                      ? "bg-blue-500/10"
                      : tier === "pro"
                      ? "bg-purple-500/10"
                      : "bg-amber-500/10"
                  )}
                >
                  <ShieldCheck
                    className={cn(
                      "w-5 h-5",
                      tier === "free"
                        ? "text-muted-foreground"
                        : tier === "basic"
                        ? "text-blue-500"
                        : tier === "pro"
                        ? "text-purple-500"
                        : "text-amber-500"
                    )}
                  />
                </div>
                <div>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {tier} quotas
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quotas table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Quotas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !quotas || quotas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active quotas configured
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tier</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Monthly Tokens</TableHead>
                    <TableHead className="text-right">AI Addon Bonus</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotas.map((q) => (
                    <TableRow key={q.id}>
                      <TableCell>
                        <Badge variant="outline" className={cn("capitalize", tierColor(q.tier))}>
                          {q.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {q.product_key}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {q.monthly_tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {q.ai_addon_bonus.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={q.is_active ? "default" : "secondary"}>
                          {q.is_active ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(q)}
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
              {editingId ? "Edit Quota" : "Add New Quota"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tier</label>
              <Select
                value={form.tier}
                onValueChange={(v) => setForm({ ...form, tier: v })}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Product</label>
              <Select
                value={form.product_key}
                onValueChange={(v) => setForm({ ...form, product_key: v })}
                disabled={!!editingId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Monthly Tokens</label>
              <Input
                type="number"
                min={0}
                value={form.monthly_tokens}
                onChange={(e) =>
                  setForm({ ...form, monthly_tokens: e.target.value })
                }
                placeholder="e.g. 100000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">AI Addon Bonus</label>
              <Input
                type="number"
                min={0}
                value={form.ai_addon_bonus}
                onChange={(e) =>
                  setForm({ ...form, ai_addon_bonus: e.target.value })
                }
                placeholder="e.g. 50000"
              />
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

export default AdminQuotas;
