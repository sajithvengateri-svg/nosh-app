import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wine, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { DEV_MODE } from "@/lib/devMode";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

interface BevOnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = [
  { id: "welcome", title: "Welcome" },
  { id: "locations", title: "Bar Locations" },
  { id: "team", title: "Team Size" },
  { id: "structure", title: "Bar Structure" },
  { id: "go", title: "Let's Pour!" },
];

const BevOnboardingWizard = ({ open, onComplete }: BevOnboardingWizardProps) => {
  const { currentOrg, refreshOrg } = useOrg();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [barName, setBarName] = useState(currentOrg?.name || "");
  const [locations, setLocations] = useState([
    { name: "Back Bar", enabled: true },
    { name: "Under Bar", enabled: true },
    { name: "Cellar", enabled: true },
    { name: "Walk-in", enabled: false },
  ]);
  const [teamSize, setTeamSize] = useState(3);
  const [structure, setStructure] = useState("flat");

  const handleFinish = async () => {
    if (!currentOrg) return;
    setSaving(true);
    try {
      if (DEV_MODE) {
        toast.success("Bar setup complete! 🍸");
        onComplete();
        return;
      }

      await supabase
        .from("organizations")
        .update({
          name: barName || currentOrg.name,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          team_size_estimate: teamSize,
          role_structure: structure,
        } as any)
        .eq("id", currentOrg.id);

      await refreshOrg();
      toast.success("Bar setup complete! 🍸");
      onComplete();
    } catch (err) {
      console.error("Onboarding error:", err);
      toast.error("Failed to save setup. Please ensure you're logged in.");
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0: return barName.trim().length > 0;
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                <Wine className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Welcome to BevOS</h2>
                <p className="text-sm text-muted-foreground">Let's set up your bar in 2 minutes</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Bar / Venue Name</label>
              <Input value={barName} onChange={(e) => setBarName(e.target.value)} placeholder="The Cocktail Club" />
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Bar Locations</h2>
            <p className="text-sm text-muted-foreground">Where do you store and serve from?</p>
            <div className="space-y-2">
              {locations.map((loc, i) => (
                <button
                  key={loc.name}
                  onClick={() => {
                    const next = [...locations];
                    next[i] = { ...next[i], enabled: !next[i].enabled };
                    setLocations(next);
                  }}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    loc.enabled ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground"
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Team Size</h2>
            <p className="text-sm text-muted-foreground">How many bartenders, bar-backs, and baristas?</p>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setTeamSize(Math.max(1, teamSize - 1))}>-</Button>
              <span className="text-3xl font-bold text-foreground w-16 text-center">{teamSize}</span>
              <Button variant="outline" size="icon" onClick={() => setTeamSize(teamSize + 1)}>+</Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-foreground">Bar Structure</h2>
            <p className="text-sm text-muted-foreground">How is your bar organised?</p>
            <div className="space-y-2">
              {[
                { id: "flat", label: "Flat", desc: "Everyone does everything" },
                { id: "stations", label: "Stations", desc: "Well, Service Bar, Back Bar, Coffee" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setStructure(opt.id)}
                  className={`w-full p-3 rounded-lg border text-left transition-colors ${
                    structure === opt.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <p className="font-medium text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">You're All Set!</h2>
            <p className="text-sm text-muted-foreground">
              Start by adding products to your cellar, creating cocktail specs, and inviting your team.
              The Bar Induction Guide will walk you through everything.
            </p>
          </div>
        );
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden [&>button]:hidden">
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <div className="p-6 min-h-[300px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <div>
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{step + 1} of {STEPS.length}</span>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving}>
                {saving ? "Saving…" : <><Sparkles className="w-4 h-4 mr-2" /> Let's Pour!</>}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BevOnboardingWizard;
