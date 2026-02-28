import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { TRADIE_CATEGORIES } from "@/types/tradies";
import type { Tradie } from "@/types/tradies";
import BusinessCardScanner from "./BusinessCardScanner";

interface TradieFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Tradie | null;
  onSave: (values: {
    id?: string;
    name: string;
    company?: string;
    category: string;
    phone?: string;
    email?: string;
    website?: string;
    abn?: string;
    address?: string;
    notes?: string;
    is_supplier?: boolean;
  }) => Promise<void>;
}

const emptyForm = {
  name: "", company: "", category: "Other", phone: "", email: "",
  website: "", abn: "", address: "", notes: "", is_supplier: false,
};

export default function TradieFormDialog({ open, onOpenChange, editing, onSave }: TradieFormDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name, company: editing.company || "", category: editing.category,
        phone: editing.phone || "", email: editing.email || "", website: editing.website || "",
        abn: editing.abn || "", address: editing.address || "", notes: editing.notes || "",
        is_supplier: editing.is_supplier,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editing, open]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({ ...form, id: editing?.id });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCardScanned = (data: Record<string, any>) => {
    setForm((prev) => ({
      ...prev,
      name: data.name || prev.name,
      company: data.company || prev.company,
      phone: data.phone || prev.phone,
      email: data.email || prev.email,
      website: data.website || prev.website,
      abn: data.abn || prev.abn,
      address: data.address || prev.address,
      category: data.category && TRADIE_CATEGORIES.includes(data.category as any) ? data.category : prev.category,
      notes: data.notes ? `${prev.notes ? prev.notes + "\n" : ""}${data.notes}` : prev.notes,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "Add"} Tradie</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <BusinessCardScanner onExtracted={handleCardScanned} />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Smith" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Company</Label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="ABC Plumbing" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRADIE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">ABN</Label>
              <Input value={form.abn} onChange={(e) => setForm({ ...form, abn: e.target.value })} placeholder="12 345 678 901" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0412 345 678" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@abc.com" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Website</Label>
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St..." />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Licence numbers, specialties..." />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={form.is_supplier} onCheckedChange={(c) => setForm({ ...form, is_supplier: !!c })} />
            <Label className="text-xs">Equipment / Kitchen Supplier</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
            {saving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
            {editing ? "Save" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
