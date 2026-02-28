import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChefHat, ArrowRight, ArrowLeft, Check, Sparkles
} from "lucide-react";
import { DEV_MODE } from "@/lib/devMode";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import OrgDetailsStep from "./steps/OrgDetailsStep";
import VenuesStep from "./steps/VenuesStep";
import TeamSizeStep from "./steps/TeamSizeStep";
import HierarchyStep from "./steps/HierarchyStep";
import WalkthroughStep from "./steps/WalkthroughStep";

export interface VenueInput {
  name: string;
  postcode: string;
}

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

const STEPS = [
  { id: "welcome", title: "Welcome" },
  { id: "venues", title: "Venues" },
  { id: "team", title: "Team Size" },
  { id: "structure", title: "Hierarchy" },
  { id: "walkthrough", title: "Get Started" },
];

const OnboardingWizard = ({ open, onComplete }: OnboardingWizardProps) => {
  const { currentOrg, refreshOrg } = useOrg();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [orgName, setOrgName] = useState(currentOrg?.name || "");
  const [venues, setVenues] = useState<VenueInput[]>([{ name: "Main Kitchen", postcode: "" }]);
  const [teamSize, setTeamSize] = useState<number>(1);
  const [roleStructure, setRoleStructure] = useState<string>("flat");

  const handleFinish = async () => {
    if (!currentOrg) return;
    setSaving(true);
    try {
      if (DEV_MODE) {
        toast.success("Kitchen setup complete! 🎉");
        onComplete();
        return;
      }

      const { error: orgError } = await supabase
        .from("organizations")
        .update({
          name: orgName || currentOrg.name,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
          team_size_estimate: teamSize,
          role_structure: roleStructure,
        } as any)
        .eq("id", currentOrg.id);

      if (orgError) throw orgError;

      const existingVenues = await supabase
        .from("org_venues")
        .select("id")
        .eq("org_id", currentOrg.id);

      const existingIds = existingVenues.data?.map(v => v.id) || [];

      if (existingIds.length > 0 && venues[0]) {
        await supabase
          .from("org_venues")
          .update({ name: venues[0].name, postcode: venues[0].postcode || null })
          .eq("id", existingIds[0]);
      }

      const newVenues = venues.slice(existingIds.length > 0 ? 1 : 0).filter(v => v.name.trim());
      if (newVenues.length > 0) {
        await supabase.from("org_venues").insert(
          newVenues.map(v => ({
            org_id: currentOrg.id,
            name: v.name,
            postcode: v.postcode || null,
          }))
        );
      }

      await refreshOrg();
      toast.success("Kitchen setup complete! 🎉");
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
      case 0: return orgName.trim().length > 0;
      case 1: return venues.some(v => v.name.trim().length > 0);
      case 2: return teamSize >= 1;
      case 3: return true;
      case 4: return true;
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <OrgDetailsStep orgName={orgName} setOrgName={setOrgName} />;
      case 1:
        return <VenuesStep venues={venues} setVenues={setVenues} />;
      case 2:
        return <TeamSizeStep teamSize={teamSize} setTeamSize={setTeamSize} />;
      case 3:
        return <HierarchyStep roleStructure={roleStructure} setRoleStructure={setRoleStructure} />;
      case 4:
        return <WalkthroughStep />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden [&>button]:hidden">
        {/* Progress bar */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="p-6 min-h-[350px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between p-4 border-t bg-muted/30">
          <div>
            {step > 0 && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {step + 1} of {STEPS.length}
            </span>
            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinish} disabled={saving}>
                {saving ? "Saving…" : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Let's Cook!
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;
