import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { X, ArrowRight, Utensils, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MenuCostingNudgeProps {
  onDismiss?: () => void;
}

const MenuCostingNudge = ({ onDismiss }: MenuCostingNudgeProps) => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // Hide if already onboarded or dismissed
  if (dismissed || (profile as any)?.menu_costing_onboarded) return null;

  const markOnboarded = async () => {
    if (user) {
      await supabase
        .from("profiles")
        .update({ menu_costing_onboarded: true } as any)
        .eq("user_id", user.id);
    }
  };

  const handleDismiss = async () => {
    setDismissed(true);
    await markOnboarded();
    onDismiss?.();
  };

  const handleStart = async () => {
    navigate("/menu-engineering");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 shadow-lg"
    >
      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Decorative watermark */}
      <div className="absolute -right-6 -bottom-6 opacity-[0.04]">
        <Utensils className="w-32 h-32 text-primary" />
      </div>

      <div className="relative z-[1] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground mb-1">
            Let's digitize your menu!
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Upload a photo of your menu and we'll auto-create recipe cards for every dish. It takes 2 minutes.
          </p>
        </div>

        {/* CTA */}
        <Button onClick={handleStart} className="gap-2 flex-shrink-0">
          Start Now <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default MenuCostingNudge;
