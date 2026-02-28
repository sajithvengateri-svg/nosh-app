import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Mail, Edit2, Eye, Save, Code, FileText, Paperclip, Plus, Trash2,
  Send, CheckCircle, XCircle, Clock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const AdminEmailTemplates = () => {
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    subject: "",
    body_html: "",
    body_text: "",
    is_active: true,
    attachments: [] as { name: string; url: string }[],
  });

  // Fetch templates
  const { data: templates, isLoading } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  // Fetch send log
  const { data: sendLog } = useQuery({
    queryKey: ["admin-email-send-log"],
    queryFn: async () => {
      const { data } = await supabase
        .from("email_send_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  // Save template mutation
  const saveMutation = useMutation({
    mutationFn: async (template: any) => {
      const { error } = await supabase
        .from("email_templates")
        .update({
          name: template.name,
          subject: template.subject,
          body_html: template.body_html,
          body_text: template.body_text,
          is_active: template.is_active,
          attachments: template.attachments,
        })
        .eq("id", template.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-email-templates"] });
      setEditingTemplate(null);
      toast.success("Template saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save template", { description: String(error) });
    },
  });

  const openEditor = (template: any) => {
    setEditingTemplate(template);
    setEditForm({
      name: template.name,
      subject: template.subject,
      body_html: template.body_html,
      body_text: template.body_text,
      is_active: template.is_active,
      attachments: Array.isArray(template.attachments) ? template.attachments : [],
    });
  };

  const handleSave = () => {
    saveMutation.mutate({ ...editingTemplate, ...editForm });
  };

  const addAttachment = () => {
    setEditForm((prev) => ({
      ...prev,
      attachments: [...prev.attachments, { name: "", url: "" }],
    }));
  };

  const updateAttachment = (index: number, field: string, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      attachments: prev.attachments.map((a, i) =>
        i === index ? { ...a, [field]: value } : a
      ),
    }));
  };

  const removeAttachment = (index: number) => {
    setEditForm((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "sent": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "failed": return <XCircle className="w-4 h-4 text-destructive" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Mail className="w-8 h-8 text-primary" />
          Email Templates
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage email templates, attachments, and view send history
        </p>
      </div>

      {/* DEV PLACEHOLDER: Resend API key not yet configured */}
      <Card className="border-2 border-dashed border-amber-500/40 bg-amber-500/5">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-400">⚠️ RESEND_API_KEY not configured</p>
            <p className="text-sm text-muted-foreground">
              Email sending is currently <strong>disabled</strong>. Add the <code className="bg-muted px-1 rounded text-xs">RESEND_API_KEY</code> secret to enable welcome emails. 
              Templates can still be edited and previewed below.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <FileText className="w-4 h-4" /> Templates
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Send className="w-4 h-4" /> Send History
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <div className="grid gap-4">
            {templates?.map((template: any) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          <Badge variant={template.is_active ? "default" : "secondary"}>
                            {template.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">
                            <Code className="w-3 h-3 mr-1" />{template.slug}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Subject: {template.subject}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {Array.isArray(template.variables) && (
                            <span>Variables: {template.variables.join(", ")}</span>
                          )}
                          {Array.isArray(template.attachments) && template.attachments.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />
                              {template.attachments.length} attachment(s)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Updated {format(new Date(template.updated_at), "MMM d, yyyy HH:mm")}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openEditor(template)}>
                        <Edit2 className="w-4 h-4 mr-1" /> Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {(!templates || templates.length === 0) && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No email templates yet
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Send History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Email Sends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead>Sent At</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sendLog?.map((log: any) => (
                      <TableRow key={log.id}>
                        <TableCell>{statusIcon(log.status)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.template_slug}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.recipient_email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.sent_at ? format(new Date(log.sent_at), "MMM d, HH:mm") : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                          {log.error_message || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!sendLog || sendLog.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No emails sent yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Editor Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Edit Template: {editingTemplate?.slug}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={editForm.is_active}
                  onCheckedChange={(v) => setEditForm((p) => ({ ...p, is_active: v }))}
                />
                <Label>Active</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Subject Line</Label>
              <Input
                value={editForm.subject}
                onChange={(e) => setEditForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="Welcome to ChefOS, {{chef_name}}!"
              />
              <p className="text-xs text-muted-foreground">
                Available variables: {editingTemplate?.variables?.join(", ")}
              </p>
            </div>

            <Tabs defaultValue="html">
              <TabsList>
                <TabsTrigger value="html" className="gap-1">
                  <Code className="w-3 h-3" /> HTML
                </TabsTrigger>
                <TabsTrigger value="text" className="gap-1">
                  <FileText className="w-3 h-3" /> Plain Text
                </TabsTrigger>
                <TabsTrigger value="preview" className="gap-1">
                  <Eye className="w-3 h-3" /> Preview
                </TabsTrigger>
              </TabsList>
              <TabsContent value="html">
                <Textarea
                  value={editForm.body_html}
                  onChange={(e) => setEditForm((p) => ({ ...p, body_html: e.target.value }))}
                  rows={15}
                  className="font-mono text-xs"
                  placeholder="<div>Your email HTML here...</div>"
                />
              </TabsContent>
              <TabsContent value="text">
                <Textarea
                  value={editForm.body_text}
                  onChange={(e) => setEditForm((p) => ({ ...p, body_text: e.target.value }))}
                  rows={15}
                  className="font-mono text-xs"
                  placeholder="Plain text fallback..."
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="border rounded-lg p-4 bg-white min-h-[300px]">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: editForm.body_html
                        .replace(/\{\{chef_name\}\}/g, "Gordon Ramsay")
                        .replace(/\{\{org_name\}\}/g, "Hell's Kitchen")
                        .replace(/\{\{app_url\}\}/g, window.location.origin)
                        .replace(/\{\{referral_code\}\}/g, "GORD1234"),
                    }}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Attachments */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Attachments
                </Label>
                <Button variant="outline" size="sm" onClick={addAttachment}>
                  <Plus className="w-3 h-3 mr-1" /> Add File
                </Button>
              </div>
              {editForm.attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="File name (e.g. onboarding-guide.pdf)"
                    value={att.name}
                    onChange={(e) => updateAttachment(i, "name", e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="File URL"
                    value={att.url}
                    onChange={(e) => updateAttachment(i, "url", e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeAttachment(i)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {editForm.attachments.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No attachments. Add files that will be included with this email.
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-1" />
              {saveMutation.isPending ? "Saving..." : "Save Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEmailTemplates;
