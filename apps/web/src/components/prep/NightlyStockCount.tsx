import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck, ChevronLeft, ChevronRight, Save, Archive, Plus,
  Settings, CheckCircle2, Circle, Loader2, Calendar, User, Moon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, addDays, subDays, parseISO } from "date-fns";
import SectionStockTemplateEditor from "./SectionStockTemplateEditor";

interface TemplateItem {
  name: string;
  par_level: string;
}

interface PrepTask {
  task: string;
}

interface StockTemplate {
  id: string;
  name: string;
  section_id: string | null;
  items: TemplateItem[];
  storage_locations: string[];
  prep_tasks: PrepTask[];
  is_active: boolean;
}

interface StockData {
  [itemName: string]: {
    [location: string]: number | string;
  };
}

interface PrepChecklist {
  task: string;
  completed: boolean;
}

interface NightlyCount {
  id: string;
  template_id: string;
  count_date: string;
  recorded_by_name: string | null;
  stock_data: StockData;
  prep_checklist: PrepChecklist[];
  notes: string | null;
  status: string;
}

interface NightlyStockCountProps {
  externalDate?: string;
}

const NightlyStockCount = ({ externalDate }: NightlyStockCountProps = {}) => {
  const { currentOrg } = useOrg();
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.id;

  const [internalDate, setInternalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const selectedDate = externalDate || internalDate;
  const setSelectedDate = externalDate ? () => {} : setInternalDate;
  const hasExternalDate = !!externalDate;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [localStockData, setLocalStockData] = useState<StockData>({});
  const [localPrepChecklist, setLocalPrepChecklist] = useState<PrepChecklist[]>([]);
  const [notes, setNotes] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Fetch templates
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['section-stock-templates', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('section_stock_templates')
        .select('*')
        .eq('org_id', orgId!)
        .eq('is_active', true)
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

  // Auto-select first template
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id);
    }
  }, [templates, selectedTemplateId]);

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Fetch today's count (or the selected date)
  const { data: existingCount, isLoading: countLoading } = useQuery({
    queryKey: ['nightly-count', selectedTemplateId, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nightly_stock_counts')
        .select('*')
        .eq('template_id', selectedTemplateId!)
        .eq('count_date', selectedDate)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as NightlyCount | null;
    },
    enabled: !!selectedTemplateId,
  });

  // Fetch PREVIOUS count for sticky data
  const { data: previousCount } = useQuery({
    queryKey: ['nightly-count-previous', selectedTemplateId, selectedDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nightly_stock_counts')
        .select('*')
        .eq('template_id', selectedTemplateId!)
        .lt('count_date', selectedDate)
        .order('count_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as NightlyCount | null;
    },
    enabled: !!selectedTemplateId && !existingCount,
  });

  // Initialize local state from existing count or carry forward from previous
  useEffect(() => {
    if (!selectedTemplate) return;

    if (existingCount) {
      setLocalStockData((existingCount.stock_data as StockData) || {});
      setLocalPrepChecklist((existingCount.prep_checklist as any[] || []) as PrepChecklist[]);
      setNotes(existingCount.notes || '');
    } else {
      // Carry forward sticky data from previous count
      const stickyData: StockData = {};
      const previousData = previousCount?.stock_data as StockData | undefined;

      selectedTemplate.items.forEach(item => {
        stickyData[item.name] = {};
        selectedTemplate.storage_locations.forEach(loc => {
          // Carry forward previous value, default to empty
          stickyData[item.name][loc] = previousData?.[item.name]?.[loc] ?? '';
        });
      });

      setLocalStockData(stickyData);
      // Reset prep checklist for new day
      setLocalPrepChecklist(
        selectedTemplate.prep_tasks.map(pt => ({ task: pt.task, completed: false }))
      );
      setNotes('');
    }
    setIsDirty(false);
  }, [existingCount, previousCount, selectedTemplate]);

  // Update a stock cell
  const updateCell = useCallback((itemName: string, location: string, value: string) => {
    setLocalStockData(prev => ({
      ...prev,
      [itemName]: {
        ...prev[itemName],
        [location]: value,
      },
    }));
    setIsDirty(true);
  }, []);

  // Toggle prep task
  const togglePrepTask = useCallback((index: number) => {
    setLocalPrepChecklist(prev =>
      prev.map((t, i) => i === index ? { ...t, completed: !t.completed } : t)
    );
    setIsDirty(true);
  }, []);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplateId || !orgId) throw new Error('Missing data');

      const payload = {
        org_id: orgId,
        template_id: selectedTemplateId,
        section_id: selectedTemplate?.section_id || null,
        count_date: selectedDate,
        recorded_by: user?.id,
        recorded_by_name: profile?.full_name || null,
        stock_data: localStockData as any,
        prep_checklist: localPrepChecklist as any,
        notes: notes || null,
        status: 'completed',
      };

      if (existingCount) {
        const { error } = await supabase
          .from('nightly_stock_counts')
          .update(payload as any)
          .eq('id', existingCount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('nightly_stock_counts')
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nightly-count'] });
      toast.success('Stock count saved');
      setIsDirty(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Fetch archive dates
  const { data: archiveDates = [] } = useQuery({
    queryKey: ['nightly-count-dates', selectedTemplateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nightly_stock_counts')
        .select('count_date, status, recorded_by_name')
        .eq('template_id', selectedTemplateId!)
        .order('count_date', { ascending: false })
        .limit(14);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedTemplateId,
  });

  const prepCompletedCount = localPrepChecklist.filter(t => t.completed).length;
  const isToday = selectedDate === format(new Date(), 'yyyy-MM-dd');

  if (showTemplateEditor) {
    return (
      <SectionStockTemplateEditor
        onBack={() => {
          setShowTemplateEditor(false);
          queryClient.invalidateQueries({ queryKey: ['section-stock-templates'] });
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Moon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Nightly Stock Count</h2>
            <p className="text-sm text-muted-foreground">Section prep inventory — data carries forward nightly</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTemplateEditor(true)}>
            <Settings className="w-4 h-4 mr-1" /> Templates
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={!isDirty || saveMutation.isPending || !selectedTemplateId}
          >
            <Save className="w-4 h-4 mr-1" />
            {saveMutation.isPending ? 'Saving...' : 'Save Count'}
          </Button>
        </div>
      </div>

      {/* Template + Date Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={selectedTemplateId || ''} onValueChange={setSelectedTemplateId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select section..." />
          </SelectTrigger>
          <SelectContent>
            {templates.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {!hasExternalDate && (
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setSelectedDate(format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <button
              className={cn("px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                isToday ? "bg-primary text-primary-foreground" : "hover:bg-background")}
              onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
            >
              {isToday ? 'Tonight' : format(parseISO(selectedDate), 'EEE, dd MMM')}
            </button>
            <Button variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {existingCount && (
          <Badge variant="secondary" className="gap-1">
            <User className="w-3 h-3" />
            {existingCount.recorded_by_name || 'Unknown'}
          </Badge>
        )}

        {isDirty && (
          <Badge variant="outline" className="text-warning border-warning/30">Unsaved changes</Badge>
        )}
      </div>

      {templates.length === 0 ? (
        <div className="card-elevated p-8 text-center">
          <ClipboardCheck className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No Section Templates Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create a template for each kitchen section with items, par levels, and storage locations
          </p>
          <Button onClick={() => setShowTemplateEditor(true)}>
            <Plus className="w-4 h-4 mr-1" /> Create Template
          </Button>
        </div>
      ) : !selectedTemplate ? (
        <div className="card-elevated p-8 text-center text-muted-foreground">Select a section template</div>
      ) : countLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Prep Tasks Checklist */}
          {localPrepChecklist.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="card-elevated p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Daily Prep Tasks</h3>
                <span className="text-xs text-muted-foreground">
                  {prepCompletedCount}/{localPrepChecklist.length} done
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {localPrepChecklist.map((task, idx) => (
                  <button
                    key={idx}
                    onClick={() => togglePrepTask(idx)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all",
                      task.completed
                        ? "bg-success/10 text-success line-through"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    )}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                    {task.task}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Stock Count Grid */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card-elevated overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-medium text-muted-foreground w-[180px] sticky left-0 bg-muted/50 z-10">Items</th>
                    <th className="text-center p-3 font-medium text-muted-foreground w-[100px]">Par Level</th>
                    {selectedTemplate.storage_locations.map(loc => (
                      <th key={loc} className="text-center p-3 font-medium text-muted-foreground min-w-[120px]">
                        {loc}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selectedTemplate.items.map((item, idx) => {
                    const rowData = localStockData[item.name] || {};
                    const totalStock = selectedTemplate.storage_locations.reduce(
                      (sum, loc) => sum + (Number(rowData[loc]) || 0), 0
                    );

                    return (
                      <tr key={idx} className={cn(
                        "border-b border-border/50 hover:bg-muted/20 transition-colors",
                        idx % 2 === 0 ? 'bg-background' : 'bg-muted/10'
                      )}>
                        <td className="p-3 font-medium sticky left-0 bg-inherit z-10">
                          <div className="flex items-center justify-between">
                            <span>{item.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center text-muted-foreground text-xs">
                          {item.par_level}
                        </td>
                        {selectedTemplate.storage_locations.map(loc => (
                          <td key={loc} className="p-2">
                            <Input
                              type="text"
                              inputMode="numeric"
                              className="h-9 text-center font-mono text-sm"
                              value={rowData[loc] ?? ''}
                              onChange={e => updateCell(item.name, loc, e.target.value)}
                              placeholder="—"
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Notes */}
          <div className="card-elevated p-4">
            <label className="text-sm font-medium mb-2 block">Notes</label>
            <Textarea
              placeholder="Any notes for tonight's count..."
              value={notes}
              onChange={e => { setNotes(e.target.value); setIsDirty(true); }}
              rows={2}
            />
          </div>

          {/* Recent Archive */}
          {archiveDates.length > 0 && (
            <div className="card-elevated p-4">
              <h3 className="font-semibold text-sm mb-3">Recent Counts</h3>
              <div className="flex flex-wrap gap-2">
                {archiveDates.map((d, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(d.count_date)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                      d.count_date === selectedDate
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80 text-muted-foreground"
                    )}
                  >
                    {format(parseISO(d.count_date), 'dd MMM')}
                    {d.recorded_by_name && (
                      <span className="ml-1 opacity-70">• {d.recorded_by_name.split(' ')[0]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NightlyStockCount;
