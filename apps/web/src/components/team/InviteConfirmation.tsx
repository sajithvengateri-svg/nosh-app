import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, MessageSquare, Send, Mail, CheckCircle2, AlertTriangle } from "lucide-react";

interface InviteConfirmationProps {
  open: boolean;
  onClose: () => void;
  email: string;
  inviteLink: string;
  emailSent: boolean;
  orgName: string;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  sous_chef: "Sous Chef",
  line_chef: "Line Chef",
  kitchen_hand: "Kitchen Hand",
  head_chef: "Head Chef",
};

const InviteConfirmation = ({ open, onClose, email, inviteLink, emailSent, orgName, role }: InviteConfirmationProps) => {
  const roleLabel = ROLE_LABELS[role] || role;

  const shareMessage = `Hey! You've been invited to join ${orgName} as ${roleLabel}. Create your account here: ${inviteLink}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    toast.success("Link copied!");
  };

  const handleSMS = () => {
    window.open(`sms:?body=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  const handleEmail = () => {
    const subject = `You're invited to join ${orgName}`;
    window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shareMessage)}`, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {emailSent ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
            Invite {emailSent ? "Sent" : "Created"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {emailSent
              ? `Email invite sent to ${email}`
              : `Invite created for ${email} — email delivery failed`}
          </p>

          {/* Invite link */}
          <div className="bg-muted rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Personalised invite link</p>
            <p className="text-xs break-all font-mono text-foreground">{inviteLink}</p>
          </div>

          {/* Nudge */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              💡 We recommend also sending the link directly — some email invites land in spam.
            </p>
          </div>

          {/* Share buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
              <Copy className="w-4 h-4" /> Copy Link
            </Button>
            <Button variant="outline" size="sm" onClick={handleSMS} className="gap-1.5">
              <MessageSquare className="w-4 h-4" /> Text
            </Button>
            <Button variant="outline" size="sm" onClick={handleWhatsApp} className="gap-1.5">
              <Send className="w-4 h-4" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmail} className="gap-1.5">
              <Mail className="w-4 h-4" /> Email
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InviteConfirmation;
