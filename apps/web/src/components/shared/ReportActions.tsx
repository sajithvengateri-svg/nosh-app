import { useState, useRef, RefObject } from "react";
import { Printer, Mail, FolderDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportActionsProps {
  title: string;
  contentRef: RefObject<HTMLDivElement | null>;
  reportType: string;
  orgId?: string | null;
}

export default function ReportActions({ title, contentRef, reportType, orgId }: ReportActionsProps) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);

  const getHtml = () => {
    if (!contentRef.current) return "";
    return contentRef.current.innerHTML;
  };

  const handlePrint = () => {
    if (!contentRef.current) return;
    contentRef.current.classList.add("printable-area");
    window.print();
    contentRef.current.classList.remove("printable-area");
  };

  const handleEmail = async () => {
    if (!email) return;
    setSending(true);
    try {
      const html = getHtml();
      const { error } = await supabase.functions.invoke("send-report-email", {
        body: { to: email, subject: title, htmlContent: html, reportType },
      });
      if (error) throw error;
      toast.success("Report emailed successfully");
      setEmailOpen(false);
      setEmail("");
    } catch (e: any) {
      toast.error(e.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleSaveToFiles = async () => {
    if (!orgId) {
      toast.error("Organisation not found");
      return;
    }
    setSaving(true);
    try {
      const html = getHtml();
      const ts = new Date().toISOString().replace(/[:.]/g, "-");
      const path = `${orgId}/${reportType}/${ts}.html`;
      const blob = new Blob(
        [`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${html}</body></html>`],
        { type: "text/html" }
      );
      const { error } = await supabase.storage
        .from("audit-documents")
        .upload(path, blob, { contentType: "text/html", upsert: false });
      if (error) throw error;
      toast.success("Report saved to files");
    } catch (e: any) {
      toast.error(e.message || "Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Report</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEmailOpen(true)}>
            <Mail className="w-4 h-4 mr-2" /> Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSaveToFiles} disabled={saving}>
            <FolderDown className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save to Files"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Email Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="report-email">Recipient Email</Label>
            <Input
              id="report-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Sends "{title}" as an HTML email.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancel</Button>
            <Button onClick={handleEmail} disabled={sending || !email}>
              {sending ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
