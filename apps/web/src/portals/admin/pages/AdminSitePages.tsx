import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { FileText, Edit2, Eye, Save, Code, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface SitePage {
  id: string;
  slug: string;
  title: string;
  body_html: string;
  body_text: string;
  is_published: boolean;
  updated_at: string;
}

const AdminSitePages = () => {
  const queryClient = useQueryClient();
  const [editingPage, setEditingPage] = useState<SitePage | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    body_html: "",
    body_text: "",
    is_published: true,
  });

  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin-site-pages"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("site_pages")
        .select("*")
        .order("created_at", { ascending: true });
      return (data || []) as SitePage[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (page: SitePage & typeof editForm) => {
      const { error } = await (supabase as any)
        .from("site_pages")
        .update({
          title: page.title,
          body_html: page.body_html,
          body_text: page.body_text,
          is_published: page.is_published,
        })
        .eq("id", page.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-site-pages"] });
      setEditingPage(null);
      toast.success("Page saved successfully");
    },
    onError: (error) => {
      toast.error("Failed to save page", { description: String(error) });
    },
  });

  const openEditor = (page: SitePage) => {
    setEditingPage(page);
    setEditForm({
      title: page.title,
      body_html: page.body_html,
      body_text: page.body_text,
      is_published: page.is_published,
    });
  };

  const handleSave = () => {
    if (editingPage) {
      saveMutation.mutate({ ...editingPage, ...editForm });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          Site Pages
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage public pages like Terms & Conditions, Privacy Policy, and more
        </p>
      </div>

      <div className="grid gap-4">
        {pages?.map((page) => (
          <motion.div
            key={page.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{page.title}</h3>
                      <Badge variant={page.is_published ? "default" : "secondary"}>
                        {page.is_published ? "Published" : "Draft"}
                      </Badge>
                      <Badge variant="outline">/{page.slug}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Updated {format(new Date(page.updated_at), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`/${page.slug}`, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openEditor(page)}>
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {(!pages || pages.length === 0) && !isLoading && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No site pages yet
            </CardContent>
          </Card>
        )}
      </div>

      {/* Page Editor Dialog */}
      <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Edit Page: /{editingPage?.slug}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Page Title</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={editForm.is_published}
                  onCheckedChange={(v) => setEditForm((p) => ({ ...p, is_published: v }))}
                />
                <Label>Published</Label>
              </div>
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
                  rows={20}
                  className="font-mono text-xs"
                  placeholder="<div>Your page HTML here...</div>"
                />
              </TabsContent>
              <TabsContent value="text">
                <Textarea
                  value={editForm.body_text}
                  onChange={(e) => setEditForm((p) => ({ ...p, body_text: e.target.value }))}
                  rows={20}
                  className="font-mono text-xs"
                  placeholder="Plain text version..."
                />
              </TabsContent>
              <TabsContent value="preview">
                <div className="border rounded-lg p-6 bg-white min-h-[400px]">
                  <div
                    className="prose prose-gray max-w-none"
                    dangerouslySetInnerHTML={{ __html: editForm.body_html }}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditingPage(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-1" />
              {saveMutation.isPending ? "Saving..." : "Save Page"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSitePages;
