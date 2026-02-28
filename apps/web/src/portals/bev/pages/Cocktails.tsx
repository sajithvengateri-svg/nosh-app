import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Martini, Plus, Layers, GraduationCap, Edit, Trash2, Loader2,
  ChevronLeft, ChevronRight, RotateCw, Check, X, Package as BoxIcon
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SpecBuilder from "../components/SpecBuilder";

interface CocktailSpec {
  id: string;
  name: string;
  category: string;
  method_steps: any[];
  glassware: string | null;
  garnish: string | null;
  ice_type: string;
  cost_price: number;
  sell_price: number;
  is_prebatch: boolean;
  batch_yield_ml: number | null;
  difficulty_level: number;
  image_url: string | null;
  flash_card_notes: string | null;
  tasting_notes: string | null;
}

const specCategories = ["classic", "signature", "prebatch", "frozen", "mocktail", "shot"];
const iceTypes = ["cubed", "crushed", "block", "sphere", "pebble", "clear", "none"];
const defaultForm = {
  name: "", category: "classic", glassware: "", garnish: "", ice_type: "cubed",
  sell_price: 0, difficulty_level: 1, tasting_notes: "", flash_card_notes: "",
  method_steps: [] as string[], is_prebatch: false, batch_yield_ml: 0,
};

const Cocktails = () => {
  const { currentOrg } = useOrg();
  const [specs, setSpecs] = useState<CocktailSpec[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CocktailSpec | null>(null);
  const [deleting, setDeleting] = useState<CocktailSpec | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<CocktailSpec | null>(null);
  const [formData, setFormData] = useState(defaultForm);
  const [newStep, setNewStep] = useState("");

  // Flash card state
  const [flashIndex, setFlashIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // Quiz state
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizScore, setQuizScore] = useState(0);
  const [quizTotal, setQuizTotal] = useState(0);

  const fetchSpecs = useCallback(async () => {
    if (!currentOrg?.id) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("bev_cocktail_specs").select("*").eq("org_id", currentOrg.id).order("name");
    if (error) { toast.error("Failed to load specs"); console.error(error); }
    else setSpecs(data || []);
    setLoading(false);
  }, [currentOrg?.id]);

  useEffect(() => { fetchSpecs(); }, [fetchSpecs]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error("Spec name is required"); return; }
    const payload = {
      name: formData.name, category: formData.category, glassware: formData.glassware || null,
      garnish: formData.garnish || null, ice_type: formData.ice_type,
      sell_price: formData.sell_price, difficulty_level: formData.difficulty_level,
      tasting_notes: formData.tasting_notes || null, flash_card_notes: formData.flash_card_notes || null,
      method_steps: JSON.parse(JSON.stringify(formData.method_steps)),
      is_prebatch: formData.is_prebatch, batch_yield_ml: formData.batch_yield_ml || null,
    };

    if (editing) {
      const { error } = await (supabase as any).from("bev_cocktail_specs").update(payload).eq("id", editing.id);
      if (error) { toast.error("Failed to update"); return; }
      toast.success("Spec updated");
    } else {
      const { error } = await (supabase as any).from("bev_cocktail_specs").insert({ ...payload, org_id: currentOrg?.id });
      if (error) { toast.error("Failed to create"); return; }
      toast.success("Spec created");
    }
    resetForm();
    fetchSpecs();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const { error } = await (supabase as any).from("bev_cocktail_specs").delete().eq("id", deleting.id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Spec deleted");
    setDeleteDialogOpen(false);
    setDeleting(null);
    fetchSpecs();
  };

  const openEdit = (s: CocktailSpec) => {
    setEditing(s);
    setFormData({
      name: s.name, category: s.category, glassware: s.glassware || "",
      garnish: s.garnish || "", ice_type: s.ice_type, sell_price: Number(s.sell_price),
      difficulty_level: s.difficulty_level, tasting_notes: s.tasting_notes || "",
      flash_card_notes: s.flash_card_notes || "",
      method_steps: Array.isArray(s.method_steps) ? s.method_steps : [],
      is_prebatch: s.is_prebatch, batch_yield_ml: s.batch_yield_ml || 0,
    });
    setDialogOpen(true);
  };

  const resetForm = () => { setDialogOpen(false); setEditing(null); setFormData(defaultForm); setNewStep(""); };

  const addStep = () => {
    if (!newStep.trim()) return;
    setFormData({ ...formData, method_steps: [...formData.method_steps, newStep.trim()] });
    setNewStep("");
  };

  const removeStep = (i: number) => {
    setFormData({ ...formData, method_steps: formData.method_steps.filter((_, idx) => idx !== i) });
  };

  // Quiz logic
  const checkQuiz = () => {
    const spec = specs[quizIndex];
    if (!spec) return;
    const correct = spec.garnish?.toLowerCase().includes(quizAnswer.toLowerCase());
    if (correct) { setQuizScore(s => s + 1); toast.success("Correct! 🎉"); }
    else toast.error(`Nope — it's "${spec.garnish}"`);
    setQuizTotal(t => t + 1);
    setQuizAnswer("");
    setQuizIndex(i => (i + 1) % specs.length);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Martini className="w-8 h-8" /> Cocktails
          </h1>
          <p className="text-muted-foreground">Spec cards, flash cards, quiz mode & pre-batch — {specs.length} specs</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Spec</Button>
      </motion.div>

      <Tabs defaultValue="specs">
        <TabsList>
          <TabsTrigger value="specs">Spec Book</TabsTrigger>
          <TabsTrigger value="flash"><Layers className="w-4 h-4 mr-1" /> Flash Cards</TabsTrigger>
          <TabsTrigger value="quiz"><GraduationCap className="w-4 h-4 mr-1" /> Quiz</TabsTrigger>
          <TabsTrigger value="prebatch">Pre-Batch</TabsTrigger>
        </TabsList>

        {/* === Spec Book === */}
        <TabsContent value="specs" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : selectedSpec ? (
            <div className="space-y-4">
              <Button variant="ghost" onClick={() => setSelectedSpec(null)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Back to Specs
              </Button>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{selectedSpec.name}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge>{selectedSpec.category}</Badge>
                        <Badge variant="outline">{selectedSpec.ice_type} ice</Badge>
                        {selectedSpec.glassware && <Badge variant="outline">{selectedSpec.glassware}</Badge>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">${Number(selectedSpec.sell_price).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Sell Price</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedSpec.garnish && <p className="text-sm"><strong>Garnish:</strong> {selectedSpec.garnish}</p>}
                  {selectedSpec.tasting_notes && <p className="text-sm"><strong>Tasting:</strong> {selectedSpec.tasting_notes}</p>}
                  {Array.isArray(selectedSpec.method_steps) && selectedSpec.method_steps.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Method</h4>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                        {selectedSpec.method_steps.map((step: string, i: number) => <li key={i}>{step}</li>)}
                      </ol>
                    </div>
                  )}
                  <SpecBuilder specId={selectedSpec.id} sellPrice={Number(selectedSpec.sell_price)} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {specs.map((s, i) => (
                <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i }}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedSpec(s)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge className="text-xs">{s.category}</Badge>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-muted"><Edit className="w-4 h-4 text-muted-foreground" /></button>
                          <button onClick={() => { setDeleting(s); setDeleteDialogOpen(true); }} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-4 h-4 text-destructive" /></button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-foreground">{s.name}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        {s.glassware && <span>{s.glassware}</span>}
                        {s.garnish && <span>• {s.garnish}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <span className="text-lg font-bold text-primary">${Number(s.sell_price).toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground">Difficulty: {"⭐".repeat(s.difficulty_level)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              {specs.length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <Martini className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">No specs yet. Create your first cocktail spec.</p>
                  <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Spec</Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* === Flash Cards === */}
        <TabsContent value="flash">
          {specs.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Add specs to start training with flash cards.</CardContent></Card>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8">
              <p className="text-sm text-muted-foreground">{flashIndex + 1} / {specs.length}</p>
              <motion.div key={flashIndex} initial={{ rotateY: 0 }} animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5 }} style={{ perspective: 1000 }}
                className="w-full max-w-md h-64 cursor-pointer" onClick={() => setFlipped(!flipped)}>
                <Card className="w-full h-full flex items-center justify-center p-8">
                  <CardContent className="text-center">
                    {!flipped ? (
                      <div>
                        <Martini className="w-10 h-10 text-primary mx-auto mb-4" />
                        <h2 className="text-2xl font-bold">{specs[flashIndex].name}</h2>
                        <p className="text-sm text-muted-foreground mt-2">Tap to reveal spec</p>
                      </div>
                    ) : (
                      <div className="text-sm space-y-1" style={{ transform: "rotateY(180deg)" }}>
                        <p><strong>Category:</strong> {specs[flashIndex].category}</p>
                        <p><strong>Glass:</strong> {specs[flashIndex].glassware || "—"}</p>
                        <p><strong>Ice:</strong> {specs[flashIndex].ice_type}</p>
                        <p><strong>Garnish:</strong> {specs[flashIndex].garnish || "—"}</p>
                        <p><strong>Price:</strong> ${Number(specs[flashIndex].sell_price).toFixed(2)}</p>
                        {specs[flashIndex].flash_card_notes && <p className="mt-2 italic">{specs[flashIndex].flash_card_notes}</p>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setFlashIndex(i => (i - 1 + specs.length) % specs.length); setFlipped(false); }}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => setFlipped(!flipped)}>
                  <RotateCw className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={() => { setFlashIndex(i => (i + 1) % specs.length); setFlipped(false); }}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* === Quiz === */}
        <TabsContent value="quiz">
          {specs.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Add specs to start the quiz.</CardContent></Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>What's the garnish for {specs[quizIndex]?.name}?</CardTitle>
                <p className="text-sm text-muted-foreground">Score: {quizScore}/{quizTotal}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={quizAnswer} onChange={e => setQuizAnswer(e.target.value)}
                  placeholder="Type the garnish..." onKeyDown={e => e.key === "Enter" && checkQuiz()} />
                <div className="flex gap-2">
                  <Button onClick={checkQuiz}><Check className="w-4 h-4 mr-1" /> Check</Button>
                  <Button variant="outline" onClick={() => { setQuizIndex(i => (i + 1) % specs.length); setQuizAnswer(""); }}>
                    Skip <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* === Pre-Batch === */}
        <TabsContent value="prebatch">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {specs.filter(s => s.is_prebatch).map(s => (
              <Card key={s.id}>
                <CardContent className="p-4">
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Yield: {s.batch_yield_ml || "—"}ml</p>
                  <p className="text-sm text-muted-foreground">Cost: ${Number(s.cost_price).toFixed(2)}</p>
                </CardContent>
              </Card>
            ))}
            {specs.filter(s => s.is_prebatch).length === 0 && (
              <div className="col-span-full py-12 text-center">
                <BoxIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No pre-batch specs. Mark a spec as pre-batch when creating.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={resetForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Spec" : "New Cocktail Spec"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cocktail Name *</Label>
              <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Negroni" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={formData.category} onValueChange={v => setFormData({ ...formData, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{specCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ice Type</Label>
                <Select value={formData.ice_type} onValueChange={v => setFormData({ ...formData, ice_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{iceTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Glassware</Label>
                <Input value={formData.glassware} onChange={e => setFormData({ ...formData, glassware: e.target.value })} placeholder="e.g., Rocks" /></div>
              <div className="space-y-2"><Label>Garnish</Label>
                <Input value={formData.garnish} onChange={e => setFormData({ ...formData, garnish: e.target.value })} placeholder="e.g., Orange peel" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Sell Price ($)</Label>
                <Input type="number" step="0.01" value={formData.sell_price} onChange={e => setFormData({ ...formData, sell_price: Number(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Difficulty (1-5)</Label>
                <Input type="number" min={1} max={5} value={formData.difficulty_level} onChange={e => setFormData({ ...formData, difficulty_level: Number(e.target.value) })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Method Steps</Label>
              {formData.method_steps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
                  <span className="text-sm flex-1">{step}</span>
                  <button onClick={() => removeStep(i)} className="p-1 rounded hover:bg-destructive/10"><X className="w-3 h-3 text-destructive" /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input value={newStep} onChange={e => setNewStep(e.target.value)} placeholder="Add a step..."
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addStep())} />
                <Button type="button" size="sm" onClick={addStep}><Plus className="w-4 h-4" /></Button>
              </div>
            </div>
            <div className="space-y-2"><Label>Tasting Notes</Label>
              <Textarea value={formData.tasting_notes} onChange={e => setFormData({ ...formData, tasting_notes: e.target.value })} placeholder="Bitter, herbaceous, citrus..." /></div>
            <div className="space-y-2"><Label>Flash Card Notes</Label>
              <Textarea value={formData.flash_card_notes} onChange={e => setFormData({ ...formData, flash_card_notes: e.target.value })} placeholder="Key facts for training..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSubmit}>{editing ? "Save Changes" : "Create Spec"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={() => { setDeleteDialogOpen(false); setDeleting(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Spec</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground py-4">Delete <strong>{deleting?.name}</strong>? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cocktails;
