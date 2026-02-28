import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Truck, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";

interface Supplier {
  id: string;
  supplier_name: string;
  abn: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  delivery_schedule: string | null;
  products_supplied: string[] | null;
  is_approved: boolean | null;
  notes: string | null;
}

export default function BCCSupplierRegister() {
  const orgId = useOrgId();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    supplier_name: "", abn: "", contact_name: "", phone: "", email: "",
    address: "", delivery_schedule: "", products: "", is_approved: true, notes: "",
  });

  const fetchSuppliers = useCallback(async () => {
    if (!orgId) return;
    const { data } = await supabase.from("bcc_supplier_register").select("*").eq("org_id", orgId).order("supplier_name");
    if (data) setSuppliers(data as unknown as Supplier[]);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const handleSave = async () => {
    if (!orgId || !form.supplier_name.trim()) { toast.error("Supplier name required"); return; }
    setSaving(true);
    const products = form.products.split(",").map((p) => p.trim()).filter(Boolean);
    const { error } = await supabase.from("bcc_supplier_register").insert({
      org_id: orgId,
      supplier_name: form.supplier_name,
      abn: form.abn || null,
      contact_name: form.contact_name || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      delivery_schedule: form.delivery_schedule || null,
      products_supplied: products.length > 0 ? products : null,
      is_approved: form.is_approved,
      notes: form.notes || null,
    } as any);
    if (error) toast.error("Failed to save");
    else { toast.success("Supplier added"); setDialogOpen(false); fetchSuppliers(); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("bcc_supplier_register").delete().eq("id", id);
    fetchSuppliers();
    toast.success("Supplier removed");
  };

  return (
    <>
      <Card className="border-[#000080]/20">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-[#000080]"><Truck className="w-5 h-5" />Supplier Register</CardTitle>
            <CardDescription>Approved suppliers with ABN, delivery schedule, and product details</CardDescription>
          </div>
          <Button size="sm" className="bg-[#000080] hover:bg-[#000080]/90 text-white" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#000080]" /></div> :
           suppliers.length === 0 ? <p className="text-center text-muted-foreground py-8">No suppliers registered yet.</p> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>ABN</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suppliers.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.supplier_name}</TableCell>
                      <TableCell className="text-xs">{s.abn || "—"}</TableCell>
                      <TableCell className="text-xs">{s.contact_name || "—"}</TableCell>
                      <TableCell className="text-xs">{s.delivery_schedule || "—"}</TableCell>
                      <TableCell>{s.is_approved ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-destructive" />}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(s.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Supplier Name *</Label><Input value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} className="mt-1" /></div>
              <div><Label>ABN</Label><Input value={form.abn} onChange={(e) => setForm({ ...form, abn: e.target.value })} className="mt-1" placeholder="e.g. 12 345 678 901" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Contact Name</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="mt-1" /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Delivery Schedule</Label><Input value={form.delivery_schedule} onChange={(e) => setForm({ ...form, delivery_schedule: e.target.value })} className="mt-1" placeholder="e.g. Mon/Wed/Fri" /></div>
              <div><Label>Products (comma-separated)</Label><Input value={form.products} onChange={(e) => setForm({ ...form, products: e.target.value })} className="mt-1" placeholder="Meat, Poultry" /></div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Approved Supplier?</Label>
              <Switch checked={form.is_approved} onCheckedChange={(v) => setForm({ ...form, is_approved: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#000080] hover:bg-[#000080]/90 text-white">{saving ? "Saving…" : "Add Supplier"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}