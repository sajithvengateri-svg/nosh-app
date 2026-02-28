import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { useOrg } from "@/contexts/OrgContext";
import { useSystemHealth } from "@/hooks/useSystemHealth";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function SystemHealthWidget() {
  const { currentOrg, storeMode } = useOrg();
  const { score, isLoading } = useSystemHealth(currentOrg?.id, storeMode);

  const color = score >= 75 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";
  const bg = score >= 75 ? "bg-success/10" : score >= 50 ? "bg-warning/10" : "bg-destructive/10";

  return (
    <Link to="/housekeeping">
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", bg)}>
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Activity className={cn("w-5 h-5", color)} />
            </motion.div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">System Health</p>
            <p className="text-xs text-muted-foreground">Data freshness across modules</p>
          </div>
          <span className={cn("text-2xl font-bold", color)}>
            {isLoading ? "—" : score}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
