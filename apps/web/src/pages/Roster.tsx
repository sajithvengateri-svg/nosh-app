import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Link2,
  User,
  ChefHat,
  Utensils,
  Plus,
  Edit3,
  AlertTriangle
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useRosterStore } from "@/stores/rosterStore";
import { ShiftEditDialog } from "@/components/roster/ShiftEditDialog";
import { cn } from "@/lib/utils";
import { Shift } from "@/types/menu";

const roleConfig = {
  'head-chef': { label: 'Head Chef', color: 'bg-primary/10 text-primary' },
  'sous-chef': { label: 'Sous Chef', color: 'bg-warning/10 text-warning' },
  'line-cook': { label: 'Line Cook', color: 'bg-success/10 text-success' },
  'prep-cook': { label: 'Prep Cook', color: 'bg-secondary text-secondary-foreground' },
  'dishwasher': { label: 'Dishwasher', color: 'bg-muted text-muted-foreground' },
  'server': { label: 'Server', color: 'bg-accent text-accent-foreground' },
  'manager': { label: 'Manager', color: 'bg-destructive/10 text-destructive' },
};

const Roster = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [isNewShift, setIsNewShift] = useState(false);
  
  const { 
    getDailyRoster, 
    getStaffOnDuty, 
    rosterConnections,
    linePrepLists,
    getPendingLinePrepLists,
    approveLinePrepList,
    rejectLinePrepList,
    staff,
    addShift,
    updateShift,
    deleteShift,
  } = useRosterStore();
  
  const dailyRoster = getDailyRoster(selectedDate);
  const onDuty = getStaffOnDuty();
  const pendingPrepLists = getPendingLinePrepLists();
  const connectedRoster = rosterConnections.find(r => r.isConnected);

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  const handleEditShift = (shift: Shift) => {
    setSelectedShift(shift);
    setIsNewShift(false);
    setEditDialogOpen(true);
  };

  const handleAddShift = () => {
    setSelectedShift(null);
    setIsNewShift(true);
    setEditDialogOpen(true);
  };

  const handleSaveShift = (shiftData: Partial<Shift> & { id?: string }) => {
    if (shiftData.id) {
      updateShift(shiftData.id, shiftData);
    } else {
      addShift({
        staffId: shiftData.staffId!,
        staffName: shiftData.staffName!,
        role: shiftData.role!,
        date: selectedDate,
        startTime: shiftData.startTime!,
        endTime: shiftData.endTime!,
        station: shiftData.station,
        status: shiftData.status || 'scheduled',
        isOverride: true,
      });
    }
  };

  const handleDeleteShift = (shiftId: string) => {
    deleteShift(shiftId);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title font-display">Roster</h1>
            <p className="page-subtitle">Daily staff schedules and line prep requests</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-input bg-background hover:bg-muted transition-colors">
            <Link2 className="w-4 h-4" />
            <span>{connectedRoster ? 'Manage Connection' : 'Connect Platform'}</span>
          </button>
        </motion.div>

        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", connectedRoster ? "bg-success/10" : "bg-muted")}>
                <Users className={cn("w-5 h-5", connectedRoster ? "text-success" : "text-muted-foreground")} />
              </div>
              <div>
                <p className="font-semibold">
                  {connectedRoster ? `Connected to ${connectedRoster.displayName}` : 'No Rostering Platform Connected'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {connectedRoster 
                    ? 'Syncing staff schedules automatically'
                    : 'Connect Deputy, Employment Hero, Tanda, or Planday'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {rosterConnections.map(conn => (
                <button
                  key={conn.id}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    conn.isConnected 
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {conn.displayName}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Currently On Duty */}
        {isToday && onDuty.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card-elevated p-5 border-l-4 border-l-success"
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <h2 className="font-semibold">Currently On Duty</h2>
              <span className="text-sm text-muted-foreground">({onDuty.length} staff)</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {onDuty.map(staff => (
                <div key={staff.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10">
                  <User className="w-4 h-4 text-success" />
                  <span className="font-medium">{staff.name}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", roleConfig[staff.role].color)}>
                    {roleConfig[staff.role].label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Date Selector + Daily Roster */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated overflow-hidden"
        >
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <div>
                <h2 className="font-semibold">Daily Schedule</h2>
                <p className="text-sm text-muted-foreground">
                  {dailyRoster.totalStaff} staff scheduled
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddShift}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Override
              </button>
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000))}
                className="px-3 py-1.5 rounded-lg bg-muted hover:bg-secondary transition-colors text-sm"
              >
                ← Prev
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  isToday ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-secondary"
                )}
              >
                Today
              </button>
              <button
                onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000))}
                className="px-3 py-1.5 rounded-lg bg-muted hover:bg-secondary transition-colors text-sm"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Role Summary */}
          <div className="p-4 bg-muted/30 border-b border-border flex flex-wrap gap-4">
            {dailyRoster.byRole.map(({ role, count }) => (
              <div key={role} className="flex items-center gap-2">
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", roleConfig[role as keyof typeof roleConfig]?.color || 'bg-muted')}>
                  {roleConfig[role as keyof typeof roleConfig]?.label || role}
                </span>
                <span className="text-sm text-muted-foreground">×{count}</span>
              </div>
            ))}
          </div>

          {/* Shifts List */}
          <div className="divide-y divide-border">
            {dailyRoster.shifts.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">No shifts scheduled for this date</p>
              </div>
            ) : (
              dailyRoster.shifts.map(shift => (
                <div 
                  key={shift.id} 
                  onClick={() => handleEditShift(shift)}
                  className={cn(
                    "p-4 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer",
                    shift.isOverride && "bg-warning/5 border-l-2 border-l-warning"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", shift.isOverride ? "bg-warning/10" : "bg-muted")}>
                      {shift.isOverride ? (
                        <AlertTriangle className="w-5 h-5 text-warning" />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{shift.staffName}</p>
                        {shift.isOverride && (
                          <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-warning/10 text-warning font-semibold">
                            Override
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs", roleConfig[shift.role].color)}>
                          {roleConfig[shift.role].label}
                        </span>
                        {shift.station && <span>• {shift.station}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{shift.startTime} - {shift.endTime}</p>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          const start = parseInt(shift.startTime.split(':')[0]);
                          const end = parseInt(shift.endTime.split(':')[0]);
                          const hours = end > start ? end - start : (24 - start) + end;
                          return `${hours}h shift`;
                        })()}
                      </p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      shift.status === 'in-progress' ? 'bg-success/10 text-success' :
                      shift.status === 'completed' ? 'bg-muted text-muted-foreground' :
                      shift.status === 'scheduled' ? 'bg-primary/10 text-primary' :
                      shift.status === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                      'bg-destructive/10 text-destructive'
                    )}>
                      {shift.status.replace('-', ' ')}
                    </span>
                    <Edit3 className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* Pending Line Prep Lists */}
        {pendingPrepLists.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card-elevated overflow-hidden"
          >
            <div className="p-5 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                <h2 className="font-semibold">Pending Prep List Approvals</h2>
                <span className="px-2 py-0.5 rounded-full bg-warning/10 text-warning text-xs font-medium">
                  {pendingPrepLists.length} pending
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Line cooks have submitted prep lists for your approval
              </p>
            </div>

            <div className="divide-y divide-border">
              {pendingPrepLists.map(list => (
                <div key={list.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <ChefHat className="w-4 h-4 text-muted-foreground" />
                        <p className="font-medium">{list.createdBy}</p>
                        <span className="text-xs text-muted-foreground">
                          • {list.station} • {list.shift} Shift
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        For: {list.forDate.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => approveLinePrepList(list.id, 'Head Chef')}
                        className="px-3 py-1.5 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors"
                      >
                        Approve
                      </button>
                      <button 
                        onClick={() => rejectLinePrepList(list.id, 'Head Chef', 'Needs revision')}
                        className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {list.tasks.map(task => (
                      <div key={task.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Utensils className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{task.task}</span>
                          {task.recipeName && (
                            <span className="text-xs text-muted-foreground">({task.recipeName})</span>
                          )}
                        </div>
                        <span className="text-muted-foreground">{task.quantity} {task.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        <ShiftEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          shift={selectedShift}
          staffList={staff}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
          isNew={isNewShift}
          selectedDate={selectedDate}
        />
      </div>
    </AppLayout>
  );
};

export default Roster;
