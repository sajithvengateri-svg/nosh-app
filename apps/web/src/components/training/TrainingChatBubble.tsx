import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const TrainingChatBubble = ({ trainingType, orgSlug, materialId }: { trainingType: string; orgSlug: string; materialId?: string }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: `Hi! I'm your ${trainingType === "rsa" ? "RSA" : "Food Safety"} training assistant. Ask me anything about the course material! 🎓` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("training-ai-chat", {
        body: { messages: newMsgs.slice(-10), training_type: trainingType, org_slug: orgSlug, material_id: materialId },
      });
      if (error) throw error;
      setMessages(prev => [...prev, { role: "assistant", content: data?.reply || "Sorry, I couldn't generate a response." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Bubble */}
      {!open && (
        <button onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50"
        ><MessageCircle className="w-6 h-6" /></button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 w-[360px] h-[500px] bg-card border border-border rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <p className="text-sm font-semibold text-foreground">{trainingType === "rsa" ? "RSA" : "Food Safety"} Assistant</p>
            <button onClick={() => setOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  <ReactMarkdown components={{ p: ({ children }) => <p className="m-0">{children}</p> }}>{m.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-muted rounded-xl px-3 py-2 text-sm text-muted-foreground animate-pulse">Thinking…</div></div>}
          </div>

          <div className="p-3 border-t border-border flex gap-2">
            <Input placeholder="Ask a question…" value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()} className="text-sm" />
            <Button size="icon" onClick={send} disabled={loading || !input.trim()}><Send className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </>
  );
};

export default TrainingChatBubble;
