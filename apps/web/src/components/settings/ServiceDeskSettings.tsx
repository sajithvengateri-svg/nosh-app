import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/useOrgId";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Headset, Send, Upload, X, Paperclip, ChevronDown, ChevronRight,
  Image as ImageIcon, FileText, Loader2
} from "lucide-react";

const CATEGORIES = [
  { value: "bug", label: "Bug" },
  { value: "feature_request", label: "Feature Request" },
  { value: "feedback", label: "Feedback" },
  { value: "billing", label: "Billing" },
  { value: "data_issue", label: "Data Issue" },
  { value: "other", label: "Other" },
];

const PRIORITIES = ["low", "medium", "high", "critical"] as const;

const STATUS_STYLES: Record<string, string> = {
  open: "bg-yellow-500/15 text-yellow-700 border-yellow-500/30",
  in_progress: "bg-blue-500/15 text-blue-700 border-blue-500/30",
  resolved: "bg-green-500/15 text-green-700 border-green-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-blue-500/15 text-blue-700",
  high: "bg-orange-500/15 text-orange-700",
  critical: "bg-destructive/15 text-destructive",
};

interface FilePreview {
  file: File;
  preview: string | null;
}

export default function ServiceDeskSettings() {
  const { user, profile } = useAuth();
  const orgId = useOrgId();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("bug");
  const [priority, setPriority] = useState<string>("medium");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  // Fetch tickets
  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  // Add files
  const handleFilesSelected = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    const newFiles: FilePreview[] = [];
    const remaining = 5 - files.length;
    for (let i = 0; i < Math.min(selectedFiles.length, remaining); i++) {
      const file = selectedFiles[i];
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      newFiles.push({ file, preview });
    }
    if (selectedFiles.length > remaining) {
      toast.error(`Max 5 files. Only ${remaining} added.`);
    }
    setFiles((prev) => [...prev, ...newFiles]);
  }, [files.length]);

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Drop handler
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFilesSelected(e.dataTransfer.files);
  }, [handleFilesSelected]);

  // Submit ticket
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!orgId || !user || !profile) throw new Error("Missing context");
      if (!subject.trim() || !description.trim()) throw new Error("Subject and description required");

      // 1. Create ticket first to get ID
      const { data: ticket, error: ticketError } = await supabase
        .from("support_tickets")
        .insert({
          org_id: orgId,
          created_by: user.id,
          created_by_name: profile.full_name,
          subject: subject.trim(),
          description: description.trim(),
          category,
          priority,
          status: "open",
          attachment_urls: [],
        })
        .select()
        .single();
      if (ticketError) throw ticketError;

      // 2. Upload files if any
      if (files.length > 0) {
        const uploadedPaths: string[] = [];
        for (const { file } of files) {
          const path = `${orgId}/${ticket.id}/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("support-attachments")
            .upload(path, file);
          if (uploadError) {
            console.error("Upload error:", uploadError);
            continue;
          }
          uploadedPaths.push(path);
        }

        // 3. Update ticket with attachment URLs
        if (uploadedPaths.length > 0) {
          await supabase
            .from("support_tickets")
            .update({ attachment_urls: uploadedPaths })
            .eq("id", ticket.id);
        }
      }

      return ticket;
    },
    onSuccess: () => {
      toast.success("Ticket submitted successfully");
      setSubject("");
      setDescription("");
      setCategory("bug");
      setPriority("medium");
      files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ["support-tickets", orgId] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to submit ticket");
    },
  });

  const getSignedUrl = async (path: string) => {
    const { data } = await supabase.storage
      .from("support-attachments")
      .createSignedUrl(path, 3600);
    return data?.signedUrl;
  };

  const openAttachment = async (path: string) => {
    const url = await getSignedUrl(path);
    if (url) window.open(url, "_blank");
    else toast.error("Could not load attachment");
  };

  return (
    <div className="space-y-6">
      {/* New Ticket Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headset className="w-5 h-5" />
            Raise a Ticket
          </CardTitle>
          <CardDescription>Log an issue, request a feature, or send feedback to the control room</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Subject */}
          <div className="space-y-1">
            <Label>Subject</Label>
            <Input
              placeholder="Brief summary of the issue"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Category + Priority row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Priority</Label>
              <div className="flex gap-1.5 flex-wrap">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-all border ${
                      priority === p
                        ? PRIORITY_STYLES[p] + " ring-2 ring-ring ring-offset-1"
                        : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe the issue, include steps to reproduce if it's a bug..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Attachments (max 5)</Label>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
            >
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Drop screenshots, photos or PDFs here, or <span className="text-primary underline">browse</span>
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => handleFilesSelected(e.target.files)}
              />
            </div>

            {/* File Previews */}
            {files.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {files.map((fp, i) => (
                  <div key={i} className="relative group">
                    {fp.preview ? (
                      <img
                        src={fp.preview}
                        alt={fp.file.name}
                        className="w-20 h-20 object-cover rounded-lg border border-border"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg border border-border flex flex-col items-center justify-center bg-muted/50">
                        <FileText className="w-6 h-6 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground truncate max-w-[72px] mt-1">
                          {fp.file.name}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                      className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || !subject.trim() || !description.trim()}
            className="w-full sm:w-auto"
          >
            {submitMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Submit Ticket
          </Button>
        </CardContent>
      </Card>

      {/* Ticket History */}
      <Card>
        <CardHeader>
          <CardTitle>My Tickets</CardTitle>
          <CardDescription>Track the status of your submitted tickets</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tickets yet</p>
          ) : (
            <div className="space-y-2">
              {tickets.map((ticket: any) => {
                const isExpanded = expandedTicket === ticket.id;
                const attachmentCount = (ticket.attachment_urls as string[] | null)?.length || 0;
                return (
                  <Collapsible key={ticket.id} open={isExpanded} onOpenChange={() => setExpandedTicket(isExpanded ? null : ticket.id)}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors text-left w-full">
                        {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{ticket.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(ticket.created_at), "dd MMM yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[ticket.status] || ""}`}>
                            {ticket.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] capitalize ${PRIORITY_STYLES[ticket.priority] || ""}`}>
                            {ticket.priority}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] capitalize">
                            {ticket.category.replace("_", " ")}
                          </Badge>
                          {attachmentCount > 0 && (
                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                              <Paperclip className="w-3 h-3" />
                              {attachmentCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-7 p-3 border border-t-0 border-border rounded-b-lg space-y-3 bg-muted/10">
                        <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>

                        {attachmentCount > 0 && (
                          <div className="space-y-1">
                            <Label className="text-xs">Attachments</Label>
                            <div className="flex gap-2 flex-wrap">
                              {(ticket.attachment_urls as string[]).map((path: string, i: number) => {
                                const isImage = /\.(png|jpg|jpeg|webp|gif)$/i.test(path);
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => openAttachment(path)}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded border border-border text-xs hover:bg-muted transition-colors"
                                  >
                                    {isImage ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                    {path.split("/").pop()}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {ticket.admin_response && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs font-medium text-primary mb-1">Control Room Response</p>
                            <p className="text-sm">{ticket.admin_response}</p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
