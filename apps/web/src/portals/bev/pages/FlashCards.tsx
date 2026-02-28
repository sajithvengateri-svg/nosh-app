import { useState, useEffect } from "react";
import { GlassWater, Plus, Pencil, Trash2, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useBeverageStore } from "@/lib/shared/state/beverageStore";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["cocktails", "wine", "beer", "coffee", "spirits", "technique", "garnish", "premix"];

const FlashCards = () => {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { flashCardMode, setFlashCardMode, flashCardCategory, setFlashCardCategory } = useBeverageStore();
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", category: "cocktails", difficulty_level: 1, quiz_question: "", quiz_answers: "" });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  const load = async () => {
    if (!orgId) return;
    setLoading(true);
    let q = (supabase as any).from("bev_flash_cards").select("*").eq("org_id", orgId).order("title");
    if (flashCardCategory) q = q.eq("category", flashCardCategory);
    const { data } = await q;
    setCards(data || []);
    setCurrentIndex(0);
    setFlipped(false);
    setLoading(false);
  };

  useEffect(() => { load(); }, [orgId, flashCardCategory]);

  const saveCard = async () => {
    if (!orgId || !form.title.trim()) return;
    const quizAnswers = form.quiz_answers ? form.quiz_answers.split("\n").filter(a => a.trim()) : null;
    const { error } = await (supabase as any).from("bev_flash_cards").insert({
      org_id: orgId, title: form.title, content: form.content, category: form.category,
      difficulty_level: form.difficulty_level, quiz_question: form.quiz_question || null,
      quiz_answers: quizAnswers ? JSON.stringify(quizAnswers) : null,
    });
    if (error) { toast.error("Failed to save card"); return; }
    toast.success("Flash card created!");
    setShowDialog(false);
    setForm({ title: "", content: "", category: "cocktails", difficulty_level: 1, quiz_question: "", quiz_answers: "" });
    load();
  };

  const deleteCard = async (id: string) => {
    await (supabase as any).from("bev_flash_cards").delete().eq("id", id);
    toast.success("Card deleted");
    load();
  };

  const currentCard = cards[currentIndex];
  const nextCard = () => { setCurrentIndex((currentIndex + 1) % cards.length); setFlipped(false); setQuizAnswer(null); };
  const prevCard = () => { setCurrentIndex((currentIndex - 1 + cards.length) % cards.length); setFlipped(false); setQuizAnswer(null); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2"><GlassWater className="w-8 h-8" /> Flash Cards</h1>
          <p className="text-muted-foreground">Training mode for cocktails, wine & coffee knowledge</p>
        </div>
        <div className="flex gap-2">
          <Button variant={flashCardMode === "browse" ? "default" : "outline"} onClick={() => setFlashCardMode("browse")}>Browse</Button>
          <Button variant={flashCardMode === "quiz" ? "default" : "outline"} onClick={() => setFlashCardMode("quiz")}>Quiz</Button>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="w-4 h-4 mr-1" /> Add</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Flash Card</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Title (front)</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Old Fashioned" /></div>
                <div><Label>Content (back)</Label><Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Full spec, method, garnish..." rows={4} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div><Label>Difficulty (1-5)</Label><Input type="number" min={1} max={5} value={form.difficulty_level} onChange={e => setForm({ ...form, difficulty_level: +e.target.value })} /></div>
                </div>
                <div><Label>Quiz Question (optional)</Label><Input value={form.quiz_question} onChange={e => setForm({ ...form, quiz_question: e.target.value })} placeholder="What garnish does this use?" /></div>
                <div><Label>Quiz Answers (one per line, first = correct)</Label><Textarea value={form.quiz_answers} onChange={e => setForm({ ...form, quiz_answers: e.target.value })} placeholder={"Orange peel\nLemon twist\nCherry\nOlive"} rows={4} /></div>
                <Button onClick={saveCard} className="w-full">Create Card</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant={!flashCardCategory ? "default" : "outline"} className="cursor-pointer" onClick={() => setFlashCardCategory(null)}>All ({cards.length})</Badge>
        {CATEGORIES.map(c => (
          <Badge key={c} variant={flashCardCategory === c ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => setFlashCardCategory(c)}>{c}</Badge>
        ))}
      </div>

      {loading ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
      ) : cards.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No flash cards yet. Create your first card or add cocktail specs to auto-populate.</CardContent></Card>
      ) : flashCardMode === "browse" ? (
        /* Browse mode - swipeable card */
        <div className="max-w-md mx-auto">
          <AnimatePresence mode="wait">
            <motion.div key={currentIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="cursor-pointer" onClick={() => setFlipped(!flipped)}>
              <Card className="min-h-[250px] flex flex-col justify-center">
                <CardContent className="text-center py-8">
                  {!flipped ? (
                    <>
                      <Badge variant="outline" className="mb-4 capitalize">{currentCard.category}</Badge>
                      <h3 className="text-2xl font-bold text-foreground">{currentCard.title}</h3>
                      <p className="text-xs text-muted-foreground mt-4">Tap to flip</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-foreground whitespace-pre-wrap text-left">{currentCard.content}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={prevCard}>← Previous</Button>
            <span className="text-sm text-muted-foreground self-center">{currentIndex + 1} / {cards.length}</span>
            <Button variant="outline" onClick={nextCard}>Next →</Button>
          </div>
        </div>
      ) : (
        /* Quiz mode */
        <div className="max-w-md mx-auto">
          {currentCard.quiz_question && currentCard.quiz_answers ? (
            <Card>
              <CardContent className="py-6 space-y-4">
                <Badge variant="outline" className="capitalize">{currentCard.category}</Badge>
                <h3 className="text-lg font-bold">{currentCard.title}</h3>
                <p className="text-sm text-muted-foreground">{currentCard.quiz_question}</p>
                <div className="space-y-2">
                  {(JSON.parse(currentCard.quiz_answers) as string[]).map((ans: string, i: number) => (
                    <Button key={i} variant={quizAnswer === null ? "outline" : i === 0 ? "default" : quizAnswer === i ? "destructive" : "outline"}
                      className="w-full justify-start" onClick={() => {
                        if (quizAnswer !== null) return;
                        setQuizAnswer(i);
                        setQuizScore({ correct: quizScore.correct + (i === 0 ? 1 : 0), total: quizScore.total + 1 });
                      }}>
                      {ans}
                    </Button>
                  ))}
                </div>
                {quizAnswer !== null && (
                  <Button onClick={nextCard} className="w-full mt-2">Next Question →</Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <p className="text-sm">This card has no quiz data. Add quiz questions when creating cards.</p>
                <Button variant="outline" onClick={nextCard} className="mt-4">Skip →</Button>
              </CardContent>
            </Card>
          )}
          <p className="text-center text-sm text-muted-foreground mt-4">
            Score: {quizScore.correct}/{quizScore.total} · Card {currentIndex + 1}/{cards.length}
          </p>
        </div>
      )}
    </div>
  );
};

export default FlashCards;
