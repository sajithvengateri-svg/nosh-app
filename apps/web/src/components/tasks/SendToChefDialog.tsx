import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useDelegatedTasks } from "@/hooks/useDelegatedTasks";
import { toast } from "sonner";
import { format, addDays } from "date-fns";

interface SendToChefDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  taskId?: string;
  quantity?: string;
}

export function SendToChefDialog({ open, onOpenChange, taskTitle, taskId, quantity }: SendToChefDialogProps) {
  const { members } = useTeamMembers();
  const { createTask } = useDelegatedTasks();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 0), "yyyy-MM-dd"));
  const [urgency, setUrgency] = useState("end_of_day");

  const lineChefs = members.filter(m => !["owner", "head_chef"].includes(m.role));
  const selectedMember = members.find(m => m.user_id === selectedUserId);

  const handleSend = async () => {
    if (!selectedUserId || !selectedMember) { toast.error("Select a team member"); return; }
    try {
      await createTask.mutateAsync({
        assigned_to: selectedUserId,
        assigned_to_name: selectedMember.full_name,
        task: taskTitle,
        quantity: quantity || undefined,
        urgency,
        due_date: dueDate,
        source_todo_id: taskId,
      });
      toast.success(`Task sent to ${selectedMember.full_name}`);
      onOpenChange(false);
      setSelectedUserId("");
    } catch {
      toast.error("Failed to send task");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Send to Chef</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm font-medium">{taskTitle}</p>
            {quantity && <p className="text-xs text-muted-foreground">{quantity}</p>}
          </div>

          <Select value={selectedUserId} onValueChange={setSelectedUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Select chef..." />
            </SelectTrigger>
            <SelectContent>
              {lineChefs.map(m => (
                <SelectItem key={m.user_id} value={m.user_id}>
                  {m.full_name} ({m.role.replace("_", " ")})
                </SelectItem>
              ))}
              {lineChefs.length === 0 && (
                <SelectItem value="none" disabled>No team members found</SelectItem>
              )}
            </SelectContent>
          </Select>

          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />

          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">🔴 Before Next Service</SelectItem>
              <SelectItem value="end_of_day">🟡 End of Day</SelectItem>
              <SelectItem value="within_48h">🟢 Within 48h</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={handleSend} disabled={!selectedUserId || createTask.isPending} className="w-full">
            {createTask.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Send Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
