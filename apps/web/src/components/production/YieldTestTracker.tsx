import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Beef, Plus, TrendingDown, TrendingUp, AlertTriangle, GraduationCap,
  Calendar, User, X, Save, Filter, ChevronDown, ChevronUp, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, subDays, parseISO } from "date-fns";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from "recharts";

const CATEGORIES = [
  { value: 'butchery', label: 'Butchery' },
  { value: 'fish', label: 'Fish Prep' },
  { value: 'vegetables', label: 'Vegetable Prep' },
  { value: 'batch_prep', label: 'Batch Prep' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'other', label: 'Other' },
];

interface YieldTest {
  id: string;
  item_name: string;
  category: string;
  test_date: string;
  prepped_by: string | null;
  gross_weight: number;
  gross_weight_unit: string;
  cost_per_unit: number;
  total_cost: number;
  usable_weight: number;
  waste_weight: number;
  portions_count: number | null;
  portion_size: number | null;
  portion_unit: string | null;
  yield_percent: number;
  cost_per_portion: number;
  usable_cost_per_unit: number;
  target_yield_percent: number | null;
  notes: string | null;
  created_at: string;
}

const YieldTestTracker = () => {
  const [showForm, setShowForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterItem, setFilterItem] = useState<string>('all');
  const [dateRange, setDateRange] = useState(30); // days
  const queryClient = useQueryClient();
  const { currentOrg } = useOrg();
  const { profile } = useAuth();

  // Form state
  const [form, setForm] = useState({
    item_name: '',
    category: 'butchery',
    test_date: format(new Date(), 'yyyy-MM-dd'),
    prepped_by: profile?.full_name || '',
    gross_weight: '',
    gross_weight_unit: 'kg',
    cost_per_unit: '',
    usable_weight: '',
    waste_weight: '',
    portions_count: '',
    portion_size: '',
    portion_unit: 'g',
    target_yield_percent: '',
    notes: '',
  });

  const orgId = currentOrg?.id;

  // Fetch yield tests
  const { data: yieldTests = [], isLoading } = useQuery({
    queryKey: ['yield-tests', orgId, dateRange],
    queryFn: async () => {
      const from = format(subDays(new Date(), dateRange), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('yield_tests')
        .select('*')
        .eq('org_id', orgId!)
        .gte('test_date', from)
        .order('test_date', { ascending: false });
      if (error) throw error;
      return (data || []) as YieldTest[];
    },
    enabled: !!orgId,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const grossWeight = parseFloat(form.gross_weight) || 0;
      const usableWeight = parseFloat(form.usable_weight) || 0;
      const wasteWeight = parseFloat(form.waste_weight) || (grossWeight - usableWeight);

      const { error } = await supabase.from('yield_tests').insert({
        org_id: orgId,
        item_name: form.item_name,
        category: form.category,
        test_date: form.test_date,
        prepped_by: form.prepped_by || null,
        prepped_by_user_id: profile?.user_id || null,
        gross_weight: grossWeight,
        gross_weight_unit: form.gross_weight_unit,
        cost_per_unit: parseFloat(form.cost_per_unit) || 0,
        usable_weight: usableWeight,
        waste_weight: wasteWeight,
        portions_count: parseFloat(form.portions_count) || 0,
        portion_size: parseFloat(form.portion_size) || 0,
        portion_unit: form.portion_unit,
        target_yield_percent: parseFloat(form.target_yield_percent) || null,
        notes: form.notes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yield-tests'] });
      toast.success('Yield test recorded');
      setShowForm(false);
      resetForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const resetForm = () => setForm({
    item_name: '', category: 'butchery',
    test_date: format(new Date(), 'yyyy-MM-dd'),
    prepped_by: profile?.full_name || '',
    gross_weight: '', gross_weight_unit: 'kg', cost_per_unit: '',
    usable_weight: '', waste_weight: '', portions_count: '',
    portion_size: '', portion_unit: 'g', target_yield_percent: '', notes: '',
  });

  // Auto-calc waste when gross and usable change
  const calculatedWaste = (parseFloat(form.gross_weight) || 0) - (parseFloat(form.usable_weight) || 0);
  const calculatedYield = (parseFloat(form.gross_weight) || 0) > 0
    ? ((parseFloat(form.usable_weight) || 0) / (parseFloat(form.gross_weight) || 0) * 100).toFixed(1)
    : '0';

  // Filtered data
  const filtered = useMemo(() => {
    return yieldTests.filter(t => {
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterItem !== 'all' && t.item_name !== filterItem) return false;
      return true;
    });
  }, [yieldTests, filterCategory, filterItem]);

  // Unique items for filter
  const uniqueItems = useMemo(() => {
    const items = [...new Set(yieldTests.map(t => t.item_name))];
    return items.sort();
  }, [yieldTests]);

  // Chart data: group by item, show yield % over time
  const chartItem = filterItem !== 'all' ? filterItem : uniqueItems[0];
  const chartData = useMemo(() => {
    if (!chartItem) return [];
    return yieldTests
      .filter(t => t.item_name === chartItem)
      .sort((a, b) => a.test_date.localeCompare(b.test_date))
      .map(t => ({
        date: format(parseISO(t.test_date), 'dd MMM'),
        yield: Number(t.yield_percent),
        target: t.target_yield_percent || 0,
        prepped_by: t.prepped_by,
        cost: Number(t.cost_per_portion),
      }));
  }, [yieldTests, chartItem]);

  const avgYield = chartData.length > 0
    ? (chartData.reduce((s, d) => s + d.yield, 0) / chartData.length).toFixed(1)
    : '0';
  const targetYield = chartData.length > 0 ? chartData[chartData.length - 1]?.target : 0;
  const variance = targetYield ? (Number(avgYield) - targetYield).toFixed(1) : null;

  // Corrective action suggestions
  const suggestions = useMemo(() => {
    if (chartData.length < 3) return [];
    const items: string[] = [];
    const yieldValues = chartData.map(d => d.yield);
    const stdDev = Math.sqrt(yieldValues.reduce((s, v) => s + Math.pow(v - Number(avgYield), 2), 0) / yieldValues.length);

    if (stdDev > 5) {
      items.push("High yield variance detected — consider standardised portioning training for the team.");
    }
    if (targetYield && Number(avgYield) < targetYield - 3) {
      items.push(`Average yield (${avgYield}%) is below target (${targetYield}%). Review cutting techniques and knife skills training.`);
    }
    if (yieldValues.slice(-3).every(v => v < (targetYield || Number(avgYield)))) {
      items.push("Last 3 tests all below target — schedule a hands-on butchery/prep workshop.");
    }
    // Check if specific person consistently underperforms
    const byPerson = new Map<string, number[]>();
    chartData.forEach(d => {
      if (d.prepped_by) {
        if (!byPerson.has(d.prepped_by)) byPerson.set(d.prepped_by, []);
        byPerson.get(d.prepped_by)!.push(d.yield);
      }
    });
    byPerson.forEach((yields, person) => {
      if (yields.length >= 2) {
        const pAvg = yields.reduce((s, v) => s + v, 0) / yields.length;
        if (targetYield && pAvg < targetYield - 5) {
          items.push(`${person}'s average yield (${pAvg.toFixed(1)}%) is significantly below target. One-on-one training recommended.`);
        }
      }
    });

    return items;
  }, [chartData, avgYield, targetYield]);

  const chartConfig = {
    yield: { label: "Yield %", color: "hsl(var(--primary))" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Yield Tests</h2>
          <p className="text-sm text-muted-foreground">Track butchery, fish prep & batch yields for consistency</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Log Yield Test
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterItem} onValueChange={setFilterItem}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Items" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Items</SelectItem>
            {uniqueItems.map(item => (
              <SelectItem key={item} value={item}>{item}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(dateRange)} onValueChange={v => setDateRange(Number(v))}>
          <SelectTrigger className="w-[130px]">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">Tests Logged</p>
          <p className="text-2xl font-bold">{filtered.length}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Yield</p>
          <p className="text-2xl font-bold">{filtered.length > 0 
            ? (filtered.reduce((s, t) => s + Number(t.yield_percent), 0) / filtered.length).toFixed(1)
            : '—'}%</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">Avg Cost/Portion</p>
          <p className="text-2xl font-bold">${filtered.length > 0 && filtered.some(t => t.cost_per_portion > 0)
            ? (filtered.filter(t => t.cost_per_portion > 0).reduce((s, t) => s + Number(t.cost_per_portion), 0) / filtered.filter(t => t.cost_per_portion > 0).length).toFixed(2)
            : '—'}</p>
        </div>
        <div className="card-elevated p-4">
          <p className="text-xs text-muted-foreground mb-1">Variance</p>
          <div className="flex items-center gap-1">
            {variance ? (
              <>
                {Number(variance) >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
                <p className={cn("text-2xl font-bold", Number(variance) >= 0 ? "text-success" : "text-destructive")}>
                  {Number(variance) > 0 ? '+' : ''}{variance}%
                </p>
              </>
            ) : (
              <p className="text-2xl font-bold text-muted-foreground">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              Yield Trend — {chartItem}
            </h3>
            {targetYield > 0 && (
              <Badge variant="outline" className="gap-1">
                <Target className="w-3 h-3" />
                Target: {targetYield}%
              </Badge>
            )}
          </div>
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis domain={['dataMin - 5', 'dataMax + 5']} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              {targetYield > 0 && (
                <ReferenceLine
                  y={targetYield}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="5 5"
                  label={{ value: `Target ${targetYield}%`, position: 'right', fill: 'hsl(var(--destructive))', fontSize: 11 }}
                />
              )}
              <Line
                type="monotone"
                dataKey="yield"
                stroke="var(--color-yield)"
                strokeWidth={2.5}
                dot={{ r: 4, fill: "var(--color-yield)" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </motion.div>
      )}

      {/* Corrective Action Suggestions */}
      {suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-5 border-l-4 border-l-warning"
        >
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-5 h-5 text-warning" />
            <h3 className="font-semibold">Corrective Actions Suggested</h3>
          </div>
          <ul className="space-y-2">
            {suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* History Table */}
      <div className="card-elevated overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Test History</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <Beef className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No yield tests recorded yet</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Log First Test
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground text-xs">
                  <th className="text-left p-3 font-medium">Date</th>
                  <th className="text-left p-3 font-medium">Item</th>
                  <th className="text-left p-3 font-medium">Category</th>
                  <th className="text-left p-3 font-medium">Prepped By</th>
                  <th className="text-right p-3 font-medium">Gross</th>
                  <th className="text-right p-3 font-medium">Usable</th>
                  <th className="text-right p-3 font-medium">Yield %</th>
                  <th className="text-right p-3 font-medium">Portions</th>
                  <th className="text-right p-3 font-medium">Cost/Portion</th>
                  <th className="text-right p-3 font-medium">Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const belowTarget = t.target_yield_percent && Number(t.yield_percent) < t.target_yield_percent;
                  return (
                    <tr key={t.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-3">{format(parseISO(t.test_date), 'dd MMM yy')}</td>
                      <td className="p-3 font-medium">{t.item_name}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs">
                          {CATEGORIES.find(c => c.value === t.category)?.label || t.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{t.prepped_by || '—'}</td>
                      <td className="p-3 text-right font-mono">{Number(t.gross_weight).toFixed(2)} {t.gross_weight_unit}</td>
                      <td className="p-3 text-right font-mono">{Number(t.usable_weight).toFixed(2)} {t.gross_weight_unit}</td>
                      <td className={cn("p-3 text-right font-mono font-semibold", belowTarget ? "text-destructive" : "text-success")}>
                        {Number(t.yield_percent).toFixed(1)}%
                        {belowTarget && <TrendingDown className="w-3 h-3 inline ml-1" />}
                      </td>
                      <td className="p-3 text-right font-mono">{t.portions_count || '—'}</td>
                      <td className="p-3 text-right font-mono">${Number(t.cost_per_portion).toFixed(2)}</td>
                      <td className="p-3 text-right font-mono">${Number(t.total_cost).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Yield Test Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Beef className="w-5 h-5" />
              Log Yield Test
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Item Name *</Label>
                <Input
                  placeholder="e.g. Beef Eye Fillet"
                  value={form.item_name}
                  onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={form.test_date}
                  onChange={e => setForm(f => ({ ...f, test_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Prepped By</Label>
                <Input
                  placeholder="Name"
                  value={form.prepped_by}
                  onChange={e => setForm(f => ({ ...f, prepped_by: e.target.value }))}
                />
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Input</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Gross Weight *</Label>
                  <Input
                    type="number" step="0.01" placeholder="0.00"
                    value={form.gross_weight}
                    onChange={e => setForm(f => ({ ...f, gross_weight: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={form.gross_weight_unit} onValueChange={v => setForm(f => ({ ...f, gross_weight_unit: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cost / Unit ($)</Label>
                  <Input
                    type="number" step="0.01" placeholder="0.00"
                    value={form.cost_per_unit}
                    onChange={e => setForm(f => ({ ...f, cost_per_unit: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Output</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Usable Weight *</Label>
                  <Input
                    type="number" step="0.01" placeholder="0.00"
                    value={form.usable_weight}
                    onChange={e => setForm(f => ({ ...f, usable_weight: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Waste Weight</Label>
                  <Input
                    type="number" step="0.01"
                    value={form.waste_weight || calculatedWaste.toFixed(2)}
                    onChange={e => setForm(f => ({ ...f, waste_weight: e.target.value }))}
                    className="text-muted-foreground"
                  />
                </div>
              </div>

              {/* Live calc preview */}
              <div className="mt-2 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Calculated Yield</span>
                <span className={cn("text-lg font-bold", Number(calculatedYield) < (parseFloat(form.target_yield_percent) || 100) ? "text-destructive" : "text-success")}>
                  {calculatedYield}%
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Portions</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Portions</Label>
                  <Input
                    type="number" step="1" placeholder="0"
                    value={form.portions_count}
                    onChange={e => setForm(f => ({ ...f, portions_count: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Portion Size</Label>
                  <Input
                    type="number" step="1" placeholder="e.g. 200"
                    value={form.portion_size}
                    onChange={e => setForm(f => ({ ...f, portion_size: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Unit</Label>
                  <Select value={form.portion_unit} onValueChange={v => setForm(f => ({ ...f, portion_unit: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="each">each</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label>Target Yield %</Label>
              <Input
                type="number" step="0.1" placeholder="e.g. 65"
                value={form.target_yield_percent}
                onChange={e => setForm(f => ({ ...f, target_yield_percent: e.target.value }))}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                placeholder="Any observations about quality, technique, etc."
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>

            <Button
              className="w-full"
              onClick={() => saveMutation.mutate()}
              disabled={!form.item_name || !form.gross_weight || !form.usable_weight || saveMutation.isPending}
            >
              <Save className="w-4 h-4 mr-1" />
              {saveMutation.isPending ? 'Saving...' : 'Save Yield Test'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default YieldTestTracker;
