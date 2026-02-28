import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { ServiceConfig, MetadataField } from "@/types/housekeeping";

interface ServiceEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceConfig;
  onSave: (values: {
    service_type: string;
    provider_name?: string;
    service_date: string;
    next_due_date?: string;
    cost?: number;
    notes?: string;
    invoice_file?: File;
    metadata?: Record<string, any>;
  }) => Promise<void>;
}

export default function ServiceEntryDialog({ open, onOpenChange, service, onSave }: ServiceEntryDialogProps) {
  const [saving, setSaving] = useState(false);
  const [providerName, setProviderName] = useState("");
  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [nextDueDate, setNextDueDate] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<Record<string, any>>({});

  const resetForm = () => {
    setProviderName("");
    setServiceDate(new Date().toISOString().split("T")[0]);
    setNextDueDate("");
    setCost("");
    setNotes("");
    setInvoiceFile(null);
    setMetadata({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        service_type: service.key,
        provider_name: providerName || undefined,
        service_date: serviceDate,
        next_due_date: nextDueDate || undefined,
        cost: cost ? parseFloat(cost) : undefined,
        notes: notes || undefined,
        invoice_file: invoiceFile ?? undefined,
        metadata,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const setMeta = (key: string, value: any) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const toggleMultiSelect = (key: string, option: string) => {
    setMetadata((prev) => {
      const current: string[] = prev[key] ?? [];
      return {
        ...prev,
        [key]: current.includes(option)
          ? current.filter((o: string) => o !== option)
          : [...current, option],
      };
    });
  };

  const renderField = (field: MetadataField) => {
    switch (field.type) {
      case "text":
        return (
          <Input
            value={metadata[field.key] ?? ""}
            onChange={(e) => setMeta(field.key, e.target.value)}
            placeholder={field.placeholder}
          />
        );
      case "number":
        return (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={metadata[field.key] ?? ""}
              onChange={(e) => setMeta(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
            {field.unit && <span className="text-xs text-muted-foreground">{field.unit}</span>}
          </div>
        );
      case "date":
        return (
          <Input
            type="date"
            value={metadata[field.key] ?? ""}
            onChange={(e) => setMeta(field.key, e.target.value)}
          />
        );
      case "toggle":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={!!metadata[field.key]}
              onCheckedChange={(checked) => setMeta(field.key, checked)}
            />
            <span className="text-sm">{metadata[field.key] ? "Yes" : "No"}</span>
          </div>
        );
      case "select":
        return (
          <Select value={metadata[field.key] ?? ""} onValueChange={(v) => setMeta(field.key, v)}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "multi_select":
        return (
          <div className="flex flex-wrap gap-1.5">
            {field.options?.map((opt) => {
              const selected = (metadata[field.key] ?? []).includes(opt);
              return (
                <Badge
                  key={opt}
                  variant={selected ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleMultiSelect(field.key, opt)}
                >
                  {opt}
                </Badge>
              );
            })}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add {service.label} Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Common fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Service Date</Label>
              <Input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cost ($)</Label>
              <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Provider</Label>
            <Input value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="Company name" />
          </div>

          {service.hasCalendar && (
            <div className="space-y-1.5">
              <Label className="text-xs">Next Due Date</Label>
              <Input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} />
            </div>
          )}

          {/* Service-specific metadata fields */}
          {service.metadataFields.length > 0 && (
            <div className="border-t pt-3 space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{service.label} Details</p>
              {service.metadataFields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs">{field.label}</Label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          )}

          {/* Invoice attachment */}
          <div className="space-y-1.5">
            <Label className="text-xs">Attach Invoice</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
              className="text-xs"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !serviceDate}>
            {saving && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
            Save Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
