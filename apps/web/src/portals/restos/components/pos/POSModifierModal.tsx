import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { CartItem } from "@/lib/shared/types/pos.types";
import { cn } from "@/lib/utils";

interface Props {
  item: any;
  groups: any[];
  onConfirm: (cartItem: CartItem) => void;
  onClose: () => void;
}

export default function POSModifierModal({ item, groups, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const toggle = (modId: string) =>
    setSelected((s) => ({ ...s, [modId]: !s[modId] }));

  const handleConfirm = () => {
    const mods: { name: string; price: number }[] = [];
    groups.forEach((g: any) => {
      g.modifiers?.forEach((m: any) => {
        if (selected[m.id]) {
          mods.push({ name: m.name, price: Number(m.price_adjustment) || 0 });
        }
      });
    });

    onConfirm({
      tempId: crypto.randomUUID(),
      menuItemId: item.id,
      name: item.name,
      quantity: 1,
      unitPrice: Number(item.price),
      modifiers: mods,
      notes: "",
      station: item.station,
      courseNumber: 1,
    });
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="bg-[#141720] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">{item.name} — Modifiers</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[50vh] overflow-auto">
          {groups.map((g: any) => (
            <div key={g.id}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {g.name}
                {g.is_required && <span className="text-rose-400 ml-1">*</span>}
              </p>
              <div className="space-y-1.5">
                {g.modifiers?.map((m: any) => (
                  <label
                    key={m.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                      selected[m.id] ? "bg-white/10" : "hover:bg-white/5"
                    )}
                  >
                    <Checkbox
                      checked={!!selected[m.id]}
                      onCheckedChange={() => toggle(m.id)}
                    />
                    <span className="flex-1 text-sm text-white">{m.name}</span>
                    {Number(m.price_adjustment) !== 0 && (
                      <span className="text-xs text-slate-400">
                        +${Number(m.price_adjustment).toFixed(2)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-slate-400">
            Cancel
          </Button>
          <Button onClick={handleConfirm} className="bg-rose-500 hover:bg-rose-600 text-white">
            Add to Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
