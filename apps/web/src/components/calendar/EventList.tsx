import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  Calendar, 
  CheckCircle2, 
  Edit, 
  Trash2,
  Wrench,
  FileText,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  event_type: string;
  date: string;
  time: string | null;
  description: string | null;
  location: string | null;
  status: string | null;
}

interface EventListProps {
  events: CalendarEvent[];
  hasEditPermission: boolean;
  onMarkComplete: (event: CalendarEvent) => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
  onAddNew: () => void;
}

const eventTypes = [
  { value: "maintenance", label: "Maintenance", icon: Wrench, color: "text-primary" },
  { value: "license", label: "License Renewal", icon: FileText, color: "text-warning" },
  { value: "inspection", label: "Inspection", icon: Shield, color: "text-destructive" },
  { value: "training", label: "Training", icon: Calendar, color: "text-success" },
  { value: "other", label: "Other", icon: Calendar, color: "text-muted-foreground" },
];

const statusStyles: Record<string, string> = {
  upcoming: "bg-primary/10 text-primary",
  due: "bg-warning/10 text-warning",
  overdue: "bg-destructive/10 text-destructive",
  completed: "bg-success/10 text-success",
};

const EventList = ({ 
  events, 
  hasEditPermission, 
  onMarkComplete, 
  onEdit, 
  onDelete,
  onAddNew 
}: EventListProps) => {
  if (events.length === 0) {
    return (
      <div className="card-elevated p-12 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground">No events for this period</p>
        {hasEditPermission && (
          <Button variant="outline" className="mt-4" onClick={onAddNew}>
            Add Event
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, index) => {
        const typeInfo = eventTypes.find(t => t.value === event.event_type);
        const Icon = typeInfo?.icon || Calendar;

        return (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index }}
            className="card-elevated p-4 flex items-center gap-4"
          >
            <div className={cn("p-3 rounded-lg bg-muted", typeInfo?.color)}>
              <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{event.title}</h3>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                  statusStyles[event.status || "upcoming"]
                )}>
                  {(event.status || "upcoming").replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span>{format(new Date(event.date), "MMM d, yyyy")}</span>
                {event.time && <span>{event.time}</span>}
                {event.location && <span>• {event.location}</span>}
              </div>
              {event.description && (
                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {event.status !== "completed" && hasEditPermission && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onMarkComplete(event)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Complete
                </Button>
              )}
              {hasEditPermission && (
                <>
                  <button
                    onClick={() => onEdit(event)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => onDelete(event)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default EventList;
