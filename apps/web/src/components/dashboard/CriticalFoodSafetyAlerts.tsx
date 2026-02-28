import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Thermometer, Truck, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface FoodSafetyAlert {
  id: string;
  log_type: string;
  location: string | null;
  temperature: string | null;
  recorded_by_name: string | null;
  acknowledged_at: string | null;
  created_at: string;
}

const CriticalFoodSafetyAlerts = () => {
  const { currentOrg } = useOrg();
  const { user, isHeadChef } = useAuth();
  const [alerts, setAlerts] = useState<FoodSafetyAlert[]>([]);

  const fetchAlerts = async () => {
    if (!currentOrg) return;
    const { data } = await supabase
      .from("food_safety_alerts")
      .select("*")
      .eq("org_id", currentOrg.id)
      .is("acknowledged_at", null)
      .order("created_at", { ascending: false })
      .limit(10);
    setAlerts((data as FoodSafetyAlert[]) || []);
  };

  useEffect(() => {
    fetchAlerts();

    // Realtime subscription for new critical alerts
    const channel = supabase
      .channel("food-safety-alerts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "food_safety_alerts" },
        () => fetchAlerts()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentOrg?.id]);

  const handleAcknowledge = async (alertId: string) => {
    const { error } = await supabase
      .from("food_safety_alerts")
      .update({ acknowledged_at: new Date().toISOString(), acknowledged_by: user?.id })
      .eq("id", alertId);

    if (error) {
      toast.error("Failed to acknowledge alert");
      return;
    }
    toast.success("Alert acknowledged");
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  if (alerts.length === 0) return null;

  const icon = (type: string) => {
    if (type === "temperature") return <Thermometer className="w-5 h-5" />;
    if (type === "receiving") return <Truck className="w-5 h-5" />;
    return <AlertTriangle className="w-5 h-5" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
    >
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            Critical Food Safety Alerts
            <Badge variant="destructive" className="ml-auto">{alerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <AnimatePresence>
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <div className="text-destructive flex-shrink-0">
                  {icon(alert.log_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {alert.log_type === "temperature" ? "🌡️ FAIL" : "📦 FAIL"} — {alert.location || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.temperature && <span className="font-mono font-bold text-destructive">{alert.temperature} </span>}
                    by {alert.recorded_by_name || "Unknown"} · {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </p>
                </div>
                {isHeadChef && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-shrink-0 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleAcknowledge(alert.id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Ack
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <Link
            to="/food-safety"
            className="block text-center text-sm text-destructive hover:underline pt-1"
          >
            View all food safety logs →
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CriticalFoodSafetyAlerts;
