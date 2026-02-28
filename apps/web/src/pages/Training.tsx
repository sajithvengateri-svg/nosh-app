import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus, GraduationCap, Award, Clock, CheckCircle2, PlayCircle,
  Loader2, AlertCircle, Trash2, Bell, BarChart3, BookOpen,
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTraining, type TrainingModule } from "@/hooks/useTraining";
import TrainingUploadDialog from "@/components/training/TrainingUploadDialog";
import TrainingChatBubble from "@/components/training/TrainingChatBubble";
import { formatDistanceToNow } from "date-fns";

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  "not-started": { bg: "bg-muted", text: "text-muted-foreground", label: "Not Started" },
  "in-progress": { bg: "bg-warning/10", text: "text-warning", label: "In Progress" },
  "completed": { bg: "bg-success/10", text: "text-success", label: "Completed" },
  "processing": { bg: "bg-primary/10", text: "text-primary", label: "Processing..." },
  "draft": { bg: "bg-muted", text: "text-muted-foreground", label: "Draft" },
  "error": { bg: "bg-destructive/10", text: "text-destructive", label: "Error" },
};

const PLACEHOLDER_COUNT = 6;

const Training = () => {
  const {
    modules, isLoading, isAdmin, completedCount, inProgressCount, avgQuizScore,
    getModuleStatus, progressMap, teamProgress, notifications,
    markNotificationRead, deleteModule,
  } = useTraining();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"training" | "crm">("training");

  const readyModules = modules.filter((m) => m.processing_status === "ready");

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="page-title font-display">Training</h1>
            <p className="page-subtitle">
              {isAdmin ? "Manage team training & certifications" : "Your training modules"}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setUploadOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Module
            </Button>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          <div className="stat-card">
            <div className="p-2 rounded-lg bg-primary/10 w-fit">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="stat-value">{readyModules.length}</p>
              <p className="stat-label">Modules</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="p-2 rounded-lg bg-success/10 w-fit">
              <CheckCircle2 className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="stat-value">{completedCount}</p>
              <p className="stat-label">Completed</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="p-2 rounded-lg bg-warning/10 w-fit">
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="stat-value">{inProgressCount}</p>
              <p className="stat-label">In Progress</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="p-2 rounded-lg bg-accent/10 w-fit">
              <Award className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="stat-value">{avgQuizScore}%</p>
              <p className="stat-label">Avg Quiz</p>
            </div>
          </div>
        </motion.div>

        {/* Admin Tabs */}
        {isAdmin && (
          <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("training")}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeTab === "training" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              <BookOpen className="w-4 h-4 inline mr-1.5" />
              Training
            </button>
            <button
              onClick={() => setActiveTab("crm")}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors relative",
                activeTab === "crm" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
              )}
            >
              <BarChart3 className="w-4 h-4 inline mr-1.5" />
              Team CRM
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Training Tab */}
        {activeTab === "training" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {isLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {modules.map((module, index) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    status={getModuleStatus(module)}
                    progress={progressMap.get(module.id)}
                    index={index}
                    isAdmin={isAdmin}
                    onDelete={() => deleteModule(module.id)}
                  />
                ))}
                {/* Placeholder cards to fill 6 slots */}
                {modules.length < PLACEHOLDER_COUNT &&
                  Array.from({ length: PLACEHOLDER_COUNT - modules.length }).map((_, i) => (
                    <motion.div
                      key={`placeholder-${i}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.05 * (modules.length + i) }}
                      className="border-2 border-dashed border-border/50 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[220px]"
                    >
                      <GraduationCap className="w-8 h-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground/50">
                        {isAdmin ? "Add a training module" : "More training coming soon"}
                      </p>
                    </motion.div>
                  ))}
              </>
            )}
          </motion.div>
        )}

        {/* CRM Tab */}
        {activeTab === "crm" && isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Notifications Inbox */}
            {notifications.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Bell className="w-4 h-4" /> Recent Activity
                </h3>
                <div className="space-y-2">
                  {notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center justify-between p-3 bg-card rounded-lg border"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {n.type === "quiz_completed" && (
                            <>
                              <span className="text-primary">{(n.payload as any).user_name}</span>
                              {" scored "}
                              <span className="font-bold">{(n.payload as any).score}%</span>
                              {" on "}{(n.payload as any).module_title}
                            </>
                          )}
                          {n.type === "processing_done" && (
                            <>Module &quot;{(n.payload as any).title}&quot; is ready ({(n.payload as any).card_count} cards)</>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markNotificationRead(n.id)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Progress Table */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Team Progress</h3>
              <div className="bg-card rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-center p-3 font-medium">Completed</th>
                      <th className="text-center p-3 font-medium">Avg Score</th>
                      <th className="text-center p-3 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamProgress.map((member) => {
                      const completed = member.records.filter((r: any) => r.completed_at).length;
                      const total = readyModules.length || 1;
                      const pct = Math.round((completed / total) * 100);
                      const scores = member.records
                        .filter((r: any) => r.quiz_score != null)
                        .map((r: any) => r.quiz_score);
                      const avg = scores.length
                        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
                        : 0;

                      return (
                        <tr key={member.user_id} className="border-b last:border-0">
                          <td className="p-3 font-medium">{member.full_name}</td>
                          <td className="p-3 text-muted-foreground capitalize">{member.role?.replace("_", " ")}</td>
                          <td className="p-3 text-center">{completed}/{readyModules.length}</td>
                          <td className="p-3 text-center">{scores.length > 0 ? `${avg}%` : "—"}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Progress value={pct} className="h-2 flex-1" />
                              <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {teamProgress.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">
                          No team members found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Upload Dialog */}
      <TrainingUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />

      {/* AI Trainer Chat */}
      <TrainingChatBubble trainingType="food_safety" orgSlug="" />
    </AppLayout>
  );
};

// ─── Module Card ──────────────────────────────────────────────────────────

function ModuleCard({
  module, status, progress, index, isAdmin, onDelete,
}: {
  module: TrainingModule;
  status: string;
  progress: any;
  index: number;
  isAdmin: boolean;
  onDelete: () => void;
}) {
  const style = statusStyles[status] || statusStyles["not-started"];
  const cardProgress = progress
    ? Math.round(((progress.cards_completed?.length || 0) / Math.max(module.card_count, 1)) * 100)
    : 0;
  const isReady = module.processing_status === "ready";
  const isProcessing = module.processing_status === "processing";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      className="card-interactive p-4 relative group"
    >
      {isAdmin && (
        <button
          onClick={(e) => { e.preventDefault(); onDelete(); }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10"
        >
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </button>
      )}

      <div className="flex items-start justify-between mb-3">
        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
          {module.category}
        </span>
        <span className={cn("text-xs px-2 py-1 rounded-full", style.bg, style.text)}>
          {style.label}
        </span>
      </div>

      <h3 className="font-semibold text-foreground mb-2">{module.title}</h3>

      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        {isReady && (
          <>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{module.estimated_minutes || module.duration_minutes || "?"} min</span>
            </div>
            <div className="flex items-center gap-1">
              <GraduationCap className="w-4 h-4" />
              <span>{module.card_count} cards</span>
            </div>
          </>
        )}
        {isProcessing && (
          <div className="flex items-center gap-1">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI is creating cards...</span>
          </div>
        )}
        {module.processing_status === "error" && (
          <div className="flex items-center gap-1 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>Processing failed</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {isReady && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{cardProgress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                status === "completed" ? "bg-success" : "bg-primary"
              )}
              style={{ width: `${cardProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Completed medal */}
      {status === "completed" && (
        <div className="flex items-center gap-1.5 mt-3 text-success">
          <Award className="w-4 h-4" />
          <span className="text-xs font-semibold">
            Completed{progress?.quiz_score != null ? ` — ${progress.quiz_score}%` : ""}
          </span>
        </div>
      )}

      {/* Action button */}
      {isReady && (
        <Link
          to={`/training/${module.id}`}
          className="w-full mt-4 flex items-center justify-center gap-2 py-2 rounded-lg bg-muted hover:bg-secondary transition-colors text-sm font-medium"
        >
          <PlayCircle className="w-4 h-4" />
          {status === "not-started" ? "Start Training" : status === "completed" ? "Review" : "Continue"}
        </Link>
      )}
    </motion.div>
  );
}

export default Training;
