import { useState, useEffect } from "react";
import { Users, Crown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { SectionAssignment, TeamMember } from "@/hooks/useSectionAssignments";

interface AssignTeamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionName: string;
  sectionColor: string;
  sectionId: string;
  currentAssignments: SectionAssignment[];
  allTeamMembers: TeamMember[];
  onSave: (assignments: { user_id: string; role: "leader" | "member" }[]) => Promise<boolean>;
}

interface LocalAssignment {
  user_id: string;
  included: boolean;
  role: "leader" | "member";
}

const AssignTeamDialog = ({
  open,
  onOpenChange,
  sectionName,
  sectionColor,
  sectionId,
  currentAssignments,
  allTeamMembers,
  onSave,
}: AssignTeamDialogProps) => {
  const [localAssignments, setLocalAssignments] = useState<LocalAssignment[]>([]);
  const [saving, setSaving] = useState(false);

  // Initialize local state when dialog opens
  useEffect(() => {
    if (open) {
      const assignmentMap = new Map(
        currentAssignments.map(a => [a.user_id, a.role])
      );

      setLocalAssignments(
        allTeamMembers.map(member => ({
          user_id: member.user_id,
          included: assignmentMap.has(member.user_id),
          role: assignmentMap.get(member.user_id) || "member",
        }))
      );
    }
  }, [open, currentAssignments, allTeamMembers]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleMember = (userId: string, included: boolean) => {
    setLocalAssignments(prev =>
      prev.map(a =>
        a.user_id === userId
          ? { ...a, included, role: included ? a.role : "member" }
          : a
      )
    );
  };

  const setLeader = (userId: string) => {
    setLocalAssignments(prev =>
      prev.map(a => ({
        ...a,
        role: a.user_id === userId ? "leader" : "member",
        // Auto-include when setting as leader
        included: a.user_id === userId ? true : a.included,
      }))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    const assignmentsToSave = localAssignments
      .filter(a => a.included)
      .map(a => ({ user_id: a.user_id, role: a.role }));

    const success = await onSave(assignmentsToSave);
    setSaving(false);
    if (success) {
      onOpenChange(false);
    }
  };

  const includedCount = localAssignments.filter(a => a.included).length;
  const currentLeader = localAssignments.find(a => a.role === "leader" && a.included);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: sectionColor }}
            />
            Assign Team to {sectionName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{includedCount} member{includedCount !== 1 ? "s" : ""} assigned</span>
            {currentLeader && (
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-500" />
                Leader assigned
              </span>
            )}
          </div>

          {/* Team members list */}
          <ScrollArea className="h-[320px] pr-4">
            <div className="space-y-2">
              {allTeamMembers.map(member => {
                const assignment = localAssignments.find(a => a.user_id === member.user_id);
                const isIncluded = assignment?.included || false;
                const isLeader = assignment?.role === "leader" && isIncluded;

                return (
                  <div
                    key={member.user_id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                      isIncluded
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-card hover:bg-muted/50"
                    )}
                  >
                    {/* Checkbox */}
                    <Checkbox
                      checked={isIncluded}
                      onCheckedChange={(checked) => toggleMember(member.user_id, !!checked)}
                    />

                    {/* Avatar */}
                    <Avatar
                      className="h-9 w-9 border-2"
                      style={{ borderColor: isIncluded ? sectionColor : "transparent" }}
                    >
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{member.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.position || "Team Member"}
                      </p>
                    </div>

                    {/* Role toggle - only show for included members */}
                    {isIncluded && (
                      <button
                        type="button"
                        onClick={() => setLeader(member.user_id)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                          isLeader
                            ? "bg-amber-500/20 text-amber-600"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {isLeader ? (
                          <>
                            <Crown className="w-3 h-3" />
                            Leader
                          </>
                        ) : (
                          <>
                            <User className="w-3 h-3" />
                            Member
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}

              {allTeamMembers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No team members found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Assignments"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignTeamDialog;
