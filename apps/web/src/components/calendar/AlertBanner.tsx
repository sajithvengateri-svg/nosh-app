import { motion } from "framer-motion";
import { AlertTriangle, Clock, Bell } from "lucide-react";

interface AlertBannerProps {
  overdueCount: number;
  dueCount: number;
}

const AlertBanner = ({ overdueCount, dueCount }: AlertBannerProps) => {
  if (overdueCount === 0 && dueCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-3"
    >
      {overdueCount > 0 && (
        <div className="card-elevated p-4 border-l-4 border-l-destructive bg-destructive/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-destructive">{overdueCount} Overdue Event{overdueCount > 1 ? 's' : ''}</p>
              <p className="text-sm text-muted-foreground">Requires immediate attention</p>
            </div>
            <Bell className="w-5 h-5 text-destructive animate-pulse" />
          </div>
        </div>
      )}
      {dueCount > 0 && (
        <div className="card-elevated p-4 border-l-4 border-l-warning bg-warning/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-warning/10">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-warning">{dueCount} Due Soon</p>
              <p className="text-sm text-muted-foreground">Within the next 7 days</p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AlertBanner;
