import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Save, GripVertical, Settings2, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TemplateItem {
  name: string;
  par_level: string;
}

interface PrepTask {
  task: string;
}

interface StockTemplate {
  id: string;
  org_id: string;
  name: string;
  section_id: string | null;
  items: TemplateItem[];
  storage_locations: string[];
  prep_tasks: PrepTask[];
  is_active: boolean;
}

interface Props {
  onBack: () => void;
}

const SectionStockTemplateEditor = ({ onBack }: Props) => {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id;

  const [editingTemplate, setEditingTemplate] = useState<StockTemplate | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSectionId, setFormSectionId] = useState<string>('none');
  const [formItems, setFormItems] = useState<TemplateItem[]>([]);
  const [formLocations, setFormLocations] = useState<string[]>(['Service Fridge', 'Walk In', 'Back Freezer']);
  const [formPrepTasks, setFormPrepTasks] = useState<PrepTask[]>([]);
  const [newLocationName, setNewLocationName] = useState('');

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['section-stock-templates-all', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('section_stock_templates')
        .select('*')
        .eq('org_id', orgId!)
        .order('name');
      if (error) throw error;
      return (data || []).map(t => ({
        ...t,
        items: (t.items as any[] || []) as TemplateItem[],
        prep_tasks: (t.prep_tasks as any[] || []) as PrepTask[],
        storage_locations: t.storage_locations || ['Service Fridge', 'Walk In', 'Back Freezer'],
      })) as StockTemplate[];
    },
    enabled: !!orgId,
  });

  // Fetch kitchen sections
  const { data: sections = [] } = useQuery({
    queryKey: ['kitchen-sections', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kitchen_sections')
        .select('id, name, color')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
  });

  const openNew = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormSectionId('none');
    setFormItems([{ name: '', par_level: '' }]);
    setFormLocations(['Service Fridge', 'Walk In', 'Back Freezer']);
    setFormPrepTasks([]);
    setShowDialog(true);
  };

  const openEdit = (t: StockTemplate) => {
    setEditingTemplate(t);
    setFormName(t.name);
    setFormSectionId(t.section_id || 'none');
    setFormItems(t.items.length > 0 ? [...t.items] : [{ name: '', par_level: '' }]);
    setFormLocations([...t.storage_locations]);
    setFormPrepTasks([...t.prep_tasks]);
    setShowDialog(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanItems = formItems.filter(i => i.name.trim());
      const cleanTasks = formPrepTasks.filter(t => t.task.trim());

      const payload = {
        org_id: orgId,
        name: formName,
        section_id: formSectionId === 'none' ? null : formSectionId,
        items: cleanItems as any,
        storage_locations: formLocations,
        prep_tasks: cleanTasks as any,
        is_active: true,
        created_by: user?.id,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('section_stock_templates')
          .update(payload as any)
          .eq('id', editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('section_stock_templates')
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section-stock-templates'] });
      toast.success(editingTemplate ? 'Template updated' : 'Template created');
      setShowDialog(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('section_stock_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['section-stock-templates'] });
      toast.success('Template deleted');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addItem = () => setFormItems(prev => [...prev, { name: '', par_level: '' }]);
  const removeItem = (idx: number) => setFormItems(prev => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof TemplateItem, value: string) => {
    setFormItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const addPrepTask = () => setFormPrepTasks(prev => [...prev, { task: '' }]);
  const removePrepTask = (idx: number) => setFormPrepTasks(prev => prev.filter((_, i) => i !== idx));
  const updatePrepTask = (idx: number, value: string) => {
    setFormPrepTasks(prev => prev.map((t, i) => i === idx ? { task: value } : t));
  };

  const addLocation = () => {
    if (newLocationName.trim() && !formLocations.includes(newLocationName.trim())) {
      setFormLocations(prev => [...prev, newLocationName.trim()]);
      setNewLocationName('');
    }
  };
  const removeLocation = (loc: string) => setFormLocations(prev => prev.filter(l => l !== loc));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-lg font-semibold">Section Stock Templates</h2>
          <p className="text-sm text-muted-foreground">Define items, par levels, and storage locations per section</p>
        </div>
        <Button size="sm" onClick={openNew}>
          <Plus className="w-4 h-4 mr-1" /> New Template
        </Button>
      </div>

      {/* Template List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <Settings2 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No Templates Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create one for each kitchen section (e.g. Antipasti, Grill, Pastry)
          </p>
          <Button onClick={openNew}>
            <Plus className="w-4 h-4 mr-1" /> Create First Template
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map(t => {
            const section = sections.find(s => s.id === t.section_id);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-elevated p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openEdit(t)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {section && (
                        <Badge variant="secondary" className="text-xs"
                          style={{ borderColor: section.color || undefined }}>
                          {section.name}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{t.items.length} items</span>
                      <span className="text-xs text-muted-foreground">{t.storage_locations.length} locations</span>
                      {t.prep_tasks.length > 0 && (
                        <span className="text-xs text-muted-foreground">{t.prep_tasks.length} prep tasks</span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                    onClick={e => { e.stopPropagation(); deleteMutation.mutate(t.id); }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'New Section Template'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Name + Section */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Template Name *</Label>
                <Input placeholder="e.g. Antipasti Section" value={formName}
                  onChange={e => setFormName(e.target.value)} />
              </div>
              <div>
                <Label>Kitchen Section</Label>
                <Select value={formSectionId} onValueChange={setFormSectionId}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No section</SelectItem>
                    {sections.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Storage Locations */}
            <div>
              <Label className="mb-2 block">Storage Locations</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formLocations.map(loc => (
                  <Badge key={loc} variant="secondary" className="gap-1 cursor-pointer"
                    onClick={() => removeLocation(loc)}>
                    {loc} <Trash2 className="w-3 h-3 text-destructive" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add location..." value={newLocationName}
                  onChange={e => setNewLocationName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLocation())} />
                <Button variant="outline" size="sm" onClick={addLocation}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Stock Items</Label>
                <Button variant="ghost" size="sm" onClick={addItem}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
                </Button>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {formItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input placeholder="Item name" value={item.name} className="flex-1"
                      onChange={e => updateItem(idx, 'name', e.target.value)} />
                    <Input placeholder="Par level (e.g. 8 boxes)" value={item.par_level} className="w-[140px]"
                      onChange={e => updateItem(idx, 'par_level', e.target.value)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                      onClick={() => removeItem(idx)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Prep Tasks */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Daily Prep Tasks</Label>
                <Button variant="ghost" size="sm" onClick={addPrepTask}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
                </Button>
              </div>
              <div className="space-y-2">
                {formPrepTasks.map((task, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input placeholder="e.g. Veg Stock, Grill Breads..." value={task.task}
                      onChange={e => updatePrepTask(idx, e.target.value)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0"
                      onClick={() => removePrepTask(idx)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()}
              disabled={!formName.trim() || saveMutation.isPending}>
              <Save className="w-4 h-4 mr-1" />
              {saveMutation.isPending ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SectionStockTemplateEditor;
