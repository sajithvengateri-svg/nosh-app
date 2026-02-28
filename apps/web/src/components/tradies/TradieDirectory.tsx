import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Phone, Mail, MessageSquare, Globe, Edit, Trash2, Wrench, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTradies, useSaveTradie, useDeleteTradie } from "@/hooks/useTradies";
import { TRADIE_CATEGORIES } from "@/types/tradies";
import type { Tradie } from "@/types/tradies";
import TradieFormDialog from "./TradieFormDialog";
import TradieDetailSheet from "./TradieDetailSheet";
import { toast } from "sonner";

interface TradieDirectoryProps {
  embedded?: boolean;
}

export default function TradieDirectory({ embedded }: TradieDirectoryProps) {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tradie | null>(null);
  const [selected, setSelected] = useState<Tradie | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { tradies, isLoading } = useTradies();
  const saveTradie = useSaveTradie();
  const deleteTradie = useDeleteTradie();

  const filtered = tradies.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.company?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchCat = catFilter === "All" || t.category === catFilter;
    return matchSearch && matchCat;
  });

  const suppliers = filtered.filter((t) => t.is_supplier);
  const nonSuppliers = filtered.filter((t) => !t.is_supplier);

  const handleSave = async (values: any) => {
    await saveTradie.mutateAsync(values);
    toast.success(values.id ? "Updated" : "Added");
    setEditing(null);
  };

  const handleDelete = (t: Tradie) => {
    if (!confirm(`Delete ${t.name}?`)) return;
    deleteTradie.mutate(t.id, {
      onSuccess: () => toast.success("Deleted"),
      onError: () => toast.error("Failed to delete"),
    });
  };

  const openEdit = (t: Tradie) => {
    setEditing(t);
    setFormOpen(true);
  };

  const openDetail = (t: Tradie) => {
    setSelected(t);
    setDetailOpen(true);
  };

  const phone = (t: Tradie) => t.phone?.replace(/\s/g, "") ?? "";
  const waPhone = (t: Tradie) => {
    const p = phone(t);
    return p.startsWith("0") ? `61${p.slice(1)}` : p;
  };

  const renderCard = (t: Tradie, i: number) => (
    <motion.div
      key={t.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03 }}
    >
      <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(t)}>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{t.name}</p>
              {t.company && <p className="text-xs text-muted-foreground truncate">{t.company}</p>}
              <Badge variant="outline" className="text-[10px] mt-1">{t.category}</Badge>
            </div>
            <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
              {t.phone && (
                <a href={`tel:${phone(t)}`} className="p-1.5 rounded hover:bg-muted">
                  <Phone className="w-3.5 h-3.5 text-success" />
                </a>
              )}
              {t.email && (
                <a href={`mailto:${t.email}`} className="p-1.5 rounded hover:bg-muted">
                  <Mail className="w-3.5 h-3.5 text-primary" />
                </a>
              )}
              {t.phone && (
                <a href={`https://wa.me/${waPhone(t)}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-muted">
                  <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                </a>
              )}
              {t.website && (
                <a href={t.website} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-muted">
                  <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-1">
              {t.phone && (
                <a href={`sms:${phone(t)}`} className="text-[10px] text-muted-foreground hover:text-primary">SMS</a>
              )}
            </div>
            <div className="flex gap-0.5">
              <button onClick={() => openEdit(t)} className="p-1 rounded hover:bg-muted"><Edit className="w-3 h-3 text-muted-foreground" /></button>
              <button onClick={() => handleDelete(t)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3 h-3 text-destructive" /></button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search tradies..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {TRADIE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Tradie
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <Users className="w-8 h-8 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No tradies yet. Add your first contact.</p>
        </div>
      ) : (
        <>
          {/* Tradies */}
          {nonSuppliers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Wrench className="w-3 h-3" /> Tradies ({nonSuppliers.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {nonSuppliers.map((t, i) => renderCard(t, i))}
              </div>
            </div>
          )}

          {/* Suppliers */}
          {suppliers.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 mt-4 flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Equipment & Kitchen Suppliers ({suppliers.length})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {suppliers.map((t, i) => renderCard(t, i))}
              </div>
            </div>
          )}
        </>
      )}

      <TradieFormDialog
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }}
        editing={editing}
        onSave={handleSave}
      />
      <TradieDetailSheet tradie={selected} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}
