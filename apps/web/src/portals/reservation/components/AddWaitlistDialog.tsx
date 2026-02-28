import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Clock } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addToWaitlist } from "@/lib/shared/queries/resQueries";
import { toast } from "sonner";

interface AddWaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddWaitlistDialog = ({ open, onOpenChange }: AddWaitlistDialogProps) => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [partySize, setPartySize] = useState(2);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !name.trim()) throw new Error("Name required");
      await addToWaitlist({
        org_id: orgId,
        guest_name: name.trim(),
        guest_phone: phone || null,
        party_size: partySize,
        status: "WAITING",
        estimated_wait_minutes: Math.max(10, partySize * 5),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["res_waitlist"] });
      toast.success(`${name} added to waitlist`);
      setName(""); setPhone(""); setPartySize(2);
      onOpenChange(false);
    },
    onError: () => toast.error("Failed to add to waitlist"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Add to Waitlist
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input placeholder="Guest name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <Label>Phone (optional)</Label>
            <Input placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Party Size</Label>
            <Input type="number" min={1} max={20} value={partySize} onChange={e => setPartySize(+e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            Estimated wait: ~{Math.max(10, partySize * 5)} minutes
          </p>
          <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending || !name.trim()}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Add to Waitlist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddWaitlistDialog;
