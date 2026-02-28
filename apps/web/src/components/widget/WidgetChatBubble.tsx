import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import WidgetVoiceCall from "./WidgetVoiceCall";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const NUDGE_MESSAGES: Record<string, string> = {
  Date: "Need help picking the perfect date? 🗓️",
  Time: "Not sure which time works best? I can help! ⏰",
  Details: "Any questions about dietary options or special requests?",
  Confirm: "Almost there! Want me to check anything before you confirm?",
};

interface Props {
  orgSlug: string;
  venueName: string;
  primaryColor: string;
  currentStep: string;
  voiceEnabled: boolean;
}

const WidgetChatBubble = ({ orgSlug, venueName, primaryColor, currentStep, voiceEnabled }: Props) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [nudge, setNudge] = useState<string | null>(null);
  const [showVoice, setShowVoice] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout>>();

  // Idle nudge
  useEffect(() => {
    if (open) return; // don't nudge when chat is open
    clearTimeout(nudgeTimer.current);
    nudgeTimer.current = setTimeout(() => {
      setNudge(NUDGE_MESSAGES[currentStep] || null);
    }, 30000);
    return () => clearTimeout(nudgeTimer.current);
  }, [currentStep, open]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);
    setNudge(null);

    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: allMessages,
            org_slug: orgSlug,
            current_step: currentStep,
          }),
        }
      );

      if (!resp.ok) throw new Error("Chat error");
      const data = await resp.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Nudge tooltip */}
      <AnimatePresence>
        {nudge && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 max-w-[240px] rounded-xl border bg-card p-3 shadow-lg cursor-pointer"
            onClick={() => { setOpen(true); setNudge(null); }}
          >
            <p className="text-sm">{nudge}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setOpen(!open); setNudge(null); }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
        style={{ backgroundColor: primaryColor }}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[340px] max-h-[480px] rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 border-b flex items-center justify-between" style={{ backgroundColor: `${primaryColor}10` }}>
              <div>
                <p className="font-semibold text-sm">{venueName || "Chat with us"}</p>
                <p className="text-[10px] text-muted-foreground">Ask anything about your booking</p>
              </div>
              {voiceEnabled && (
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowVoice(true)}>
                  <Phone className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3 space-y-2 min-h-0" style={{ maxHeight: "340px" }}>
              {messages.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Hi! I'm here to help with your booking. Ask me anything about {venueName || "our venue"}.
                </p>
              )}
              <div className="space-y-2">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        m.role === "user"
                          ? "text-white"
                          : "bg-muted"
                      }`}
                      style={m.role === "user" ? { backgroundColor: primaryColor } : {}}
                    >
                      {m.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl px-3 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              <div ref={scrollRef} />
            </ScrollArea>

            {/* Input */}
            <div className="p-2 border-t flex gap-2">
              <Input
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                className="text-sm h-9"
              />
              <Button
                size="icon"
                className="h-9 w-9 flex-shrink-0"
                style={{ backgroundColor: primaryColor }}
                onClick={sendMessage}
                disabled={loading || !input.trim()}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice overlay */}
      {showVoice && (
        <WidgetVoiceCall
          orgSlug={orgSlug}
          venueName={venueName}
          primaryColor={primaryColor}
          onClose={() => setShowVoice(false)}
        />
      )}
    </>
  );
};

export default WidgetChatBubble;
