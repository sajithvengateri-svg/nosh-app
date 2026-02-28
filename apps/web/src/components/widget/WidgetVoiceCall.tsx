import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Phone, PhoneOff, Loader2, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  orgSlug: string;
  venueName: string;
  primaryColor: string;
  onClose: () => void;
}

type CallStatus = "idle" | "connecting" | "active" | "ended" | "error";

const WidgetVoiceCall = ({ orgSlug, venueName, primaryColor, onClose }: Props) => {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [vapiInstance, setVapiInstance] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const startCall = async () => {
    setStatus("connecting");
    setError(null);

    try {
      // Fetch token from edge function
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/widget-voice-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ org_slug: orgSlug }),
        }
      );

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get voice token");
      }

      const { token, assistantId } = await resp.json();

      // Dynamically import Vapi
      const { default: Vapi } = await import("@vapi-ai/web");
      const vapi = new Vapi(token);

      vapi.on("call-start", () => setStatus("active"));
      vapi.on("call-end", () => { setStatus("ended"); setVapiInstance(null); });
      vapi.on("error", (e: any) => {
        console.error("Vapi error:", e);
        setError("Call failed. Please try again.");
        setStatus("error");
      });

      vapi.start(assistantId);
      setVapiInstance(vapi);
    } catch (e: any) {
      console.error("Voice call error:", e);
      setError(e.message || "Failed to start call");
      setStatus("error");
    }
  };

  const endCall = () => {
    vapiInstance?.stop();
    setStatus("ended");
    setVapiInstance(null);
  };

  useEffect(() => {
    return () => { vapiInstance?.stop(); };
  }, [vapiInstance]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-card rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl"
      >
        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>

        <h3 className="font-semibold text-lg mb-1">Voice Assistant</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {venueName ? `Speak with ${venueName}'s AI concierge` : "Speak with our AI concierge"}
        </p>

        {/* Status Display */}
        <div className="mb-6">
          {status === "idle" && (
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs text-muted-foreground">
                We'll need microphone access to start the call.
              </p>
              <Button
                size="lg"
                className="rounded-full w-16 h-16"
                style={{ backgroundColor: primaryColor }}
                onClick={startCall}
              >
                <Phone className="w-6 h-6" />
              </Button>
              <span className="text-sm font-medium">Tap to Call</span>
            </div>
          )}

          {status === "connecting" && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
                style={{ backgroundColor: `${primaryColor}30` }}>
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: primaryColor }} />
              </div>
              <span className="text-sm text-muted-foreground">Connecting...</span>
            </div>
          )}

          {status === "active" && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center relative"
                style={{ backgroundColor: `${primaryColor}20` }}>
                <Mic className="w-6 h-6" style={{ color: primaryColor }} />
                <span className="absolute w-full h-full rounded-full animate-ping opacity-30"
                  style={{ backgroundColor: primaryColor }} />
              </div>
              <span className="text-sm font-medium" style={{ color: primaryColor }}>Call Active</span>
              <Button variant="destructive" className="rounded-full w-14 h-14" onClick={endCall}>
                <PhoneOff className="w-5 h-5" />
              </Button>
            </div>
          )}

          {status === "ended" && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-muted-foreground">Call ended. Thank you!</p>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3">
              <p className="text-sm text-destructive">{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStatus("idle")}>Try Again</Button>
                <Button variant="ghost" onClick={onClose}>Close</Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WidgetVoiceCall;
