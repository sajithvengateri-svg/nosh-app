import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Phone, Mail, MessageSquare, Globe, MapPin, Hash, ExternalLink,
  Wrench, FileText, Plus, Loader2, AlertTriangle,
} from "lucide-react";
import type { Tradie } from "@/types/tradies";
import { useTradieServiceHistory, useLogServiceCall } from "@/hooks/useTradies";
import { toast } from "sonner";

interface TradieDetailSheetProps {
  tradie: Tradie | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ContactButton({ icon: Icon, href, label }: { icon: any; href: string; label: string }) {
  return (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
      <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
        <Icon className="w-3 h-3" /> {label}
      </Button>
    </a>
  );
}

export default function TradieDetailSheet({ tradie, open, onOpenChange }: TradieDetailSheetProps) {
  const { history, isLoading } = useTradieServiceHistory(tradie?.id ?? null);
  const logCall = useLogServiceCall();
  const [logOpen, setLogOpen] = useState(false);
  const [logForm, setLogForm] = useState({ date: new Date().toISOString().split("T")[0], cost: "", issue: "", resolution: "", notes: "" });

  if (!tradie) return null;

  const phone = tradie.phone?.replace(/\s/g, "") ?? "";
  const whatsappPhone = phone.startsWith("0") ? `61${phone.slice(1)}` : phone;

  const handleLogSave = async () => {
    try {
      await logCall.mutateAsync({
        tradie_id: tradie.id,
        service_date: logForm.date,
        cost: logForm.cost ? parseFloat(logForm.cost) : undefined,
        issue_description: logForm.issue || undefined,
        resolution: logForm.resolution || undefined,
        notes: logForm.notes || undefined,
      });
      toast.success("Service call logged");
      setLogOpen(false);
      setLogForm({ date: new Date().toISOString().split("T")[0], cost: "", issue: "", resolution: "", notes: "" });
    } catch {
      toast.error("Failed to log");
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              {tradie.name}
              {tradie.is_supplier && <Badge variant="secondary" className="text-[10px]">Supplier</Badge>}
            </SheetTitle>
            {tradie.company && <p className="text-sm text-muted-foreground">{tradie.company}</p>}
            <Badge variant="outline" className="w-fit text-xs">{tradie.category}</Badge>
          </SheetHeader>

          <div className="space-y-5">
            {/* Contact Actions */}
            <div className="flex flex-wrap gap-2">
              {tradie.phone && <ContactButton icon={Phone} href={`tel:${phone}`} label="Call" />}
              {tradie.email && <ContactButton icon={Mail} href={`mailto:${tradie.email}`} label="Email" />}
              {tradie.phone && <ContactButton icon={MessageSquare} href={`sms:${phone}`} label="SMS" />}
              {tradie.phone && (
                <ContactButton icon={MessageSquare} href={`https://wa.me/${whatsappPhone}`} label="WhatsApp" />
              )}
              {tradie.website && <ContactButton icon={Globe} href={tradie.website} label="Website" />}
            </div>

            {/* Details */}
            <div className="space-y-2">
              {tradie.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <span>{tradie.address}</span>
                </div>
              )}
              {tradie.abn && (
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>ABN: {tradie.abn}</span>
                </div>
              )}
              {tradie.notes && (
                <div className="flex items-start gap-2 text-sm">
                  <FileText className="w-3.5 h-3.5 mt-0.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{tradie.notes}</span>
                </div>
              )}
            </div>

            {/* Service History */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Service History</p>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setLogOpen(true)}>
                  <Plus className="w-3 h-3 mr-1" /> Log Call
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-4 text-sm text-muted-foreground">Loading...</div>
              ) : history.length === 0 ? (
                <Card><CardContent className="p-4 text-center text-sm text-muted-foreground">No service history yet</CardContent></Card>
              ) : (
                <div className="space-y-2">
                  {history.map((log: any) => (
                    <Card key={log.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{format(parseISO(log.service_date), "d MMM yyyy")}</span>
                          {log.cost != null && log.cost > 0 && (
                            <span className="text-sm font-medium tabular-nums">${log.cost.toFixed(2)}</span>
                          )}
                        </div>
                        {log.metadata?.issue_description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <AlertTriangle className="w-2.5 h-2.5 inline mr-1" />
                            {log.metadata.issue_description}
                          </p>
                        )}
                        {log.metadata?.resolution && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            <Wrench className="w-2.5 h-2.5 inline mr-1" />
                            {log.metadata.resolution}
                          </p>
                        )}
                        {log.invoice_url && (
                          <a href={log.invoice_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary mt-1 inline-flex items-center gap-1">
                            <ExternalLink className="w-2.5 h-2.5" /> Invoice
                          </a>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Log Service Call Dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Service Call</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={logForm.date} onChange={(e) => setLogForm({ ...logForm, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cost ($)</Label>
                <Input type="number" step="0.01" value={logForm.cost} onChange={(e) => setLogForm({ ...logForm, cost: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Issue</Label>
              <Input value={logForm.issue} onChange={(e) => setLogForm({ ...logForm, issue: e.target.value })} placeholder="What was the problem?" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Resolution</Label>
              <Input value={logForm.resolution} onChange={(e) => setLogForm({ ...logForm, resolution: e.target.value })} placeholder="What was done?" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogOpen(false)}>Cancel</Button>
            <Button onClick={handleLogSave} disabled={logCall.isPending}>
              {logCall.isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
