import { useState } from "react";
import { Bot, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BevAI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("bev-ai-chat", {
        body: { messages: updated },
      });
      if (error) throw error;
      setMessages([...updated, { role: "assistant", content: data.content }]);
    } catch (e: any) {
      setMessages([...updated, { role: "assistant", content: `Error: ${e.message || "Something went wrong."}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Bot className="w-8 h-8" /> BevAI
        </h1>
        <p className="text-muted-foreground">Your bar operations AI assistant</p>
      </div>

      <Card className="h-[60vh] flex flex-col">
        <CardHeader><CardTitle>Chat</CardTitle></CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 pr-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ask about cocktail specs, wine pairings, pour costs, coffee dial-in, or anything bar-related.
              </p>
            )}
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <form
            className="flex gap-2 mt-4"
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          >
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask BevAI..." />
            <Button type="submit" size="icon" disabled={loading}><Send className="w-4 h-4" /></Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BevAI;
