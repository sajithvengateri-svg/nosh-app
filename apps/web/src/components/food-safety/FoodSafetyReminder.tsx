import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Thermometer, ClipboardList, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useFoodSafetyDuties } from "@/hooks/useFoodSafetyDuties";
import { format } from "date-fns";

interface ReminderState {
  type: "shift_start" | "shift_end";
  shift: "am" | "pm";
  message: string;
}

const FoodSafetyReminder = () => {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { isCurrentUserOnDuty, loading } = useFoodSafetyDuties();
  const navigate = useNavigate();
  const [reminder, setReminder] = useState<ReminderState | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");
  const hour = new Date().getHours();

  useEffect(() => {
    if (loading || !user?.id || !currentOrg?.id) return;

    const checkReminders = async () => {
      // Check if AM duty and before 2pm
      if (hour < 14 && isCurrentUserOnDuty("am")) {
        const { data } = await supabase
          .from("food_safety_reminders")
          .select("id")
          .eq("user_id", user.id)
          .eq("reminder_type", "shift_start")
          .eq("reminder_date", today)
          .maybeSingle();

        if (!data) {
          setReminder({
            type: "shift_start",
            shift: "am",
            message: "You're on food safety duty today (AM). Start your temp checks!",
          });
          return;
        }
      }

      // Check if PM duty and after 4pm
      if (hour >= 16 && isCurrentUserOnDuty("pm")) {
        const { data } = await supabase
          .from("food_safety_reminders")
          .select("id")
          .eq("user_id", user.id)
          .eq("reminder_type", "shift_end")
          .eq("reminder_date", today)
          .maybeSingle();

        if (!data) {
          setReminder({
            type: "shift_end",
            shift: "pm",
            message: "Don't forget: Complete PM temp checks and submit tonight's prep list before you leave.",
          });
        }
      }
    };

    checkReminders();
  }, [loading, user?.id, currentOrg?.id, isCurrentUserOnDuty, hour, today]);

  const handleDismiss = async () => {
    if (!reminder || !user?.id || !currentOrg?.id) return;

    setDismissed(true);

    await supabase.from("food_safety_reminders").insert({
      org_id: currentOrg.id,
      user_id: user.id,
      reminder_type: reminder.type,
      reminder_date: today,
      dismissed_at: new Date().toISOString(),
    } as any);
  };

  const handleGoToFoodSafety = () => {
    handleDismiss();
    navigate("/food-safety");
  };

  if (!reminder || dismissed) return null;

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 px-4 py-3",
      "bg-primary text-primary-foreground shadow-lg",
      "animate-in slide-in-from-top-2 duration-300"
    )}>
      <div className="max-w-2xl mx-auto flex items-center gap-3">
        {reminder.type === "shift_start" ? (
          <Thermometer className="w-5 h-5 shrink-0" />
        ) : (
          <ClipboardList className="w-5 h-5 shrink-0" />
        )}
        <p className="flex-1 text-sm font-medium">{reminder.message}</p>
        <Button
          size="sm"
          variant="secondary"
          onClick={handleGoToFoodSafety}
          className="shrink-0"
        >
          Go
        </Button>
        <button onClick={handleDismiss} className="p-1 hover:opacity-70">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FoodSafetyReminder;
