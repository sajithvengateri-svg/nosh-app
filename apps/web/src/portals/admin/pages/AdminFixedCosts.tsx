import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Receipt,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  Building2,
  Server,
  Globe,
  Package,
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

interface FixedCost {
  id: string;
  name: string;
  category: string;
  amount_usd: number;
  frequency: string;
  org_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CostForm {
  name: string;
  category: string;
  amount_usd: string;
  frequency: string;
  org_id: string;
  notes: string;
}

const EMPTY_FORM: CostForm = {
  name: "",
  category: "",
  amount_usd: "",
  frequency: "monthly",
  org_id: "",
  notes: "",
};

const CATEGORY_OPTIONS = ["infrastructure", "saas", "domain", "other"];
const FREQUENCY_OPTIONS = ["monthly", "yearly", "one_time"];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AdminFixedCosts = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CostForm>(EMPTY_FORM);

  // ---- Fetch active fixed costs ----
  const { data: costs, isLoading } = useQuery({
    queryKey: ["admin-fixed-costs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fixed_costs")
        .select("*")
        .eq("is_active", true)
        .order("category")
        .order("name");
      if (error) throw error;
      return (data || []) as FixedCost[];
    },
  });

  // ---- Fetch orgs for selector ----
  const { data: orgs } = useQuery({
    queryKey: ["admin-orgs-for-costs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .order("name");
      return data || [];
    },
  });

  // ---- Insert / Update mutation ----
  const upsertMutation = useMutation({
    mutationFn: async (payload: {
      id?: string;
      name: string;
      category: string;
      amount_usd: number;
      frequency: string;
      org_id: string | null;
      notes: string | null;
    }) => {
      if (payload.id) {
        const { error } = await supabase
          .from("fixed_costs")
          .update({
            name: payload.name,
            category: payload.category,
            amount_usd: payload.amount_usd,
            frequency: payload.frequency,
            org_id: payload.org_id,
            notes: payload.notes,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payload.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fixed_costs").insert({
          name: payload.name,
          category: payload.category,
          amount_usd: payload.amount_usd,
          frequency: payload.frequency,
          org_id: payload.org_id,
          notes: payload.notes,
          is_active: true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-fixed-costs"] });
      toast.success(
        editingId ? "Fixed cost updated successfully" : "Fixed cost created successfully"
      );
      closeDialog();
    },
    onError: (err: any) => {
      toast.error(`Failed to save fixed cost: ${err.message}`);
    },
  });

  // ---- Deactivate mutation ----
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("fixed_costs")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-fixed-costs"] });
      toast.success("Fixed cost deactivated");
    },
    onError: (err: any) => {
      toast.error(`Failed to deactivate: ${err.message}`);
    },
  });

  // ---- Helpers ----
  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (c: FixedCost) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      category: c.category,
      amount_usd: String(c.amount_usd),
      frequency: c.frequency,
      org_id: c.org_id || "",
      notes: c.notes || "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!form.category) {
      toast.error("Category is required");
      return;
    }
    const amount = parseFloat(form.amount_usd);
    if (isNaN(amount) || amount < 0) {
      toast.error("Amount must be a valid positive number");
      return;
    }
    upsertMutation.mutate({
      id: editingId || undefined,
      name: form.name.trim(),
      category: form.category,
      amount_usd: amount,
      frequency: form.frequency,
      org_id: form.org_id || null,
      notes: form.notes.trim() || null,
    });
  };

  const getOrgName = (orgId: string | null) => {
    if (!orgId) return "System-wide";
    const org = orgs?.find((o) => o.id === orgId);
    return org?.name || org?.slug || orgId.slice(0, 8);
  };

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case "infrastructure":
        return <Server className="w-4 h-4 text-blue-500" />;
      case "saas":
        return <Package className="w-4 h-4 text-purple-500" />;
      case "domain":
        return <Globe className="w-4 h-4 text-emerald-500" />;
      default:
        return <Receipt className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "infrastructure":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "saas":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "domain":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const frequencyLabel = (f: string) => {
    switch (f) {
      case "monthly":
        return "Monthly";
      case "yearly":
        return "Yearly";
      case "one_time":
        return "One-time";
      default:
        return f;
    }
  };

  // ---- Summary stats ----
  const totalMonthly =
    costs
      ?.filter((c) => c.frequency === "monthly")
      .reduce((sum, c) => sum + c.amount_usd, 0) || 0;

  const totalYearly =
    costs
      ?.filter((c) => c.frequency === "yearly")
      .reduce((sum, c) => sum + c.amount_usd, 0) || 0;

  const totalOneTime =
    costs
      ?.filter((c) => c.frequency === "one_time")
      .reduce((sum, c) => sum + c.amount_usd, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Receipt className="w-8 h-8 text-primary" />
            Fixed Costs
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage infrastructure, SaaS, domain, and other fixed costs
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Cost
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Items</p>
                <p className="text-3xl font-bold">{costs?.length || 0}</p>
              </div>
              <Receipt className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Total</p>
                <p className="text-3xl font-bold">${totalMonthly.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Yearly Total</p>
                <p className="text-3xl font-bold">${totalYearly.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">One-time Total</p>
                <p className="text-3xl font-bold">${totalOneTime.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Costs table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Fixed Costs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : !costs || costs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No active fixed costs configured
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount (USD)</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Org</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costs.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {categoryIcon(c.category)}
                          <Badge
                            variant="outline"
                            className={cn("capitalize", categoryColor(c.category))}
                          >
                            {c.category}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${c.amount_usd.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {frequencyLabel(c.frequency)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          {c.org_id ? (
                            <>
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              {getOrgName(c.org_id)}
                            </>
                          ) : (
                            <span className="text-muted-foreground italic">
                              System-wide
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                          {c.notes || "--"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(c)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deactivateMutation.mutate(c.id)}
                            disabled={deactivateMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
              {editingId ? "Edit Fixed Cost" : "Add New Fixed Cost"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. AWS Hosting"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (USD)</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.amount_usd}
                onChange={(e) =>
                  setForm({ ...form, amount_usd: e.target.value })
                }
                placeholder="e.g. 49.99"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Frequency</label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm({ ...form, frequency: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCY_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f} className="capitalize">
                      {frequencyLabel(f)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Organisation{" "}
                <span className="text-muted-foreground font-normal">
                  (optional -- leave blank for system-wide)
                </span>
              </label>
              <Select
                value={form.org_id}
                onValueChange={(v) =>
                  setForm({ ...form, org_id: v === "__none__" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="System-wide (no org)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    System-wide (no org)
                  </SelectItem>
                  {orgs?.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes"
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

export default AdminFixedCosts;
