import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Wine, Sparkles, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useWingStore } from "../stores/wingStore";
import { mockWines } from "../data/mockWines";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What should I drink tonight?",
  "Recommend a wine under $50",
  "What pairs with grilled lamb?",
  "Tell me about my cellar",
];

const WingSommelierChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { flavorCluster, cellar, userName } = useWingStore();

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Build context for the AI
      const cellarSummary = cellar.length > 0
        ? `User has ${cellar.length} wines in their virtual cellar: ${cellar.map(c => `${c.wine.name} (${c.quantity}x)`).join(', ')}.`
        : 'User has no wines in their virtual cellar yet.';

      const wineList = mockWines.slice(0, 10).map(w =>
        `- ${w.name} by ${w.producer} (${w.region}, ${w.vintage || 'NV'}) — $${w.memberPrice} member price. ${w.tastingNotes.slice(0, 80)}...`
      ).join('\n');

      const systemPrompt = `You are the Digital Sommelier for The Private Wing, a luxury wine concierge platform.

The user's name is ${userName}. Their flavor profile is: ${flavorCluster || 'not yet assessed'}.
${cellarSummary}

Our current wine portfolio includes:
${wineList}

Your personality: Warm, knowledgeable, never pretentious. Like a trusted friend who happens to be a Master Sommelier. Use vivid sensory language. Keep responses conversational and under 120 words unless detail is requested. Reference specific wines from the portfolio when recommending. Never be pushy — you're a trusted advisor, not a salesperson.`;

      const { data, error } = await supabase.functions.invoke("bev-ai-chat", {
        body: {
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
            { role: userMessage.role, content: userMessage.content },
          ],
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content || "I apologize, but I couldn't process that. Please try again.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Sommelier AI error:", error);
      // Fallback response for demo
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getFallbackResponse(messageText),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-20 right-4 z-50 md:bottom-6"
          >
            <button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
              style={{ background: '#722F37' }}
            >
              <Wine className="w-6 h-6" style={{ color: '#F5F0EB' }} />
            </button>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#C9A96E' }} />
              <span className="relative inline-flex rounded-full h-4 w-4 items-center justify-center" style={{ background: '#C9A96E' }}>
                <Sparkles className="w-2.5 h-2.5" style={{ color: '#1C1C1C' }} />
              </span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 left-4 z-50 md:bottom-6 md:left-auto md:w-96"
          >
            <div className="rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] border"
              style={{ background: '#2D2D2D', borderColor: 'rgba(201,169,110,0.2)' }}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b"
                style={{ borderColor: 'rgba(201,169,110,0.15)', background: 'rgba(27,67,50,0.15)' }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(114,47,55,0.2)' }}>
                    <Wine className="w-5 h-5" style={{ color: '#C9A96E' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ color: '#F5F0EB', fontFamily: "'Playfair Display', serif" }}>Your Sommelier</h3>
                    <p className="text-xs" style={{ color: '#F5F0EB66' }}>Powered by AI</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                  style={{ color: '#F5F0EB66' }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 min-h-[300px]">
                {messages.length === 0 ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <Wine className="w-12 h-12 mx-auto mb-3" style={{ color: '#F5F0EB33' }} />
                      <p className="text-sm" style={{ color: '#F5F0EB88' }}>
                        I know your palate. Ask me anything about wine.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium flex items-center gap-1" style={{ color: '#F5F0EB66' }}>
                        <HelpCircle className="w-3 h-3" />
                        Try asking:
                      </p>
                      {SUGGESTED_QUESTIONS.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(q)}
                          className="w-full text-left text-sm p-2.5 rounded-lg transition-colors"
                          style={{ background: 'rgba(245,240,235,0.05)', color: '#F5F0EBCC' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(245,240,235,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(245,240,235,0.05)'}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div
                          className="max-w-[85%] rounded-2xl px-4 py-2.5"
                          style={{
                            background: message.role === "user" ? '#722F37' : 'rgba(245,240,235,0.08)',
                            color: '#F5F0EB',
                          }}
                        >
                          {message.role === "assistant" ? (
                            <div className="prose prose-sm prose-invert max-w-none text-sm [&_p]:my-1">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl px-4 py-3" style={{ background: 'rgba(245,240,235,0.08)' }}>
                          <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#C9A96E' }} />
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-3 border-t" style={{ borderColor: 'rgba(201,169,110,0.15)' }}>
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask your sommelier..."
                    disabled={isLoading}
                    className="flex-1 text-sm rounded-lg px-3 py-2.5 outline-none transition-colors"
                    style={{
                      background: 'rgba(245,240,235,0.05)',
                      border: '1px solid rgba(201,169,110,0.2)',
                      color: '#F5F0EB',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2.5 rounded-lg transition-opacity disabled:opacity-30"
                    style={{ background: '#C9A96E', color: '#1C1C1C' }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Fallback responses for when the API is unavailable (demo mode)
function getFallbackResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('tonight') || q.includes('drink')) {
    return "Based on your palate profile, I'd suggest the **Giant Steps Pinot Noir** from Yarra Valley. It's silky, medium-bodied with red cherry and forest floor notes — perfect for a relaxed evening. At $58 member price, it's a lovely mid-week indulgence. Shall I add it to your cart?";
  }
  if (q.includes('under $50') || q.includes('budget')) {
    return "Great picks under $50:\n\n- **Tyrrell's Semillon** ($35) — Hunter Valley classic, incredible value\n- **Shaw + Smith Sav Blanc** ($28) — Crisp, refreshing weeknight white\n- **Ochota Barrels Grenache** ($45) — If you want something different, this natural Grenache is electric\n\nWant to hear more about any of these?";
  }
  if (q.includes('lamb') || q.includes('pair')) {
    return "For grilled lamb, you want something with structure to match the richness. My top picks:\n\n1. **Wynns Block 14 Cabernet** ($72) — Classic pairing, the dried herbs echo the lamb beautifully\n2. **Hoddles Creek Nebbiolo** ($75) — Italian grape meets Australian terroir, gorgeous with lamb\n\nBoth are in your price range and match your Bold & Structured profile perfectly.";
  }
  if (q.includes('cellar')) {
    return "Your virtual cellar is looking interesting! Based on what you've been adding, you're leaning toward bold Australian reds — great taste. I'd suggest balancing it with a few crisp whites for summer. The **Grosset Riesling** would be a perfect addition — it'll age beautifully and give you something refreshing when the mood strikes.";
  }
  return "That's a great question! I'd love to help you explore our portfolio. We have some exceptional Australian wines right now — from bold Barossa Shiraz to elegant Yarra Valley Pinot Noir and crisp Clare Valley Riesling. What kind of mood are you in tonight?";
}

export default WingSommelierChat;
