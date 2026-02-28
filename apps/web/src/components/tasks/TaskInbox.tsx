import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  Package,
  ClipboardList,
  Sparkles,
  Circle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  ChevronDown,
  ChevronUp,
  Play,
  Upload,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format, isToday, isPast, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

type TaskType = "recipe_entry" | "inventory_count" | "prep_task" | "cleaning" | "general";
type TaskPriority = "low" | "medium" | "high" | "urgent";
type TaskStatus = "pending" | "in_progress" | "submitted" | "approved" | "rejected" | "completed";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  section_id: string | null;
  assigned_to: string | null;
  due_date: string | null;
  due_time: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  section?: { name: string; color: string | null } | null;
  // Task table doesn't have notes column - using description for notes
}

interface TaskComment {
  id: string;
  user_id: string;
  user_name: string | null;
  content: string;
  created_at: string;
}

const TASK_TYPE_ICONS: Record<TaskType, React.ElementType> = {
  recipe_entry: ChefHat,
  inventory_count: Package,
  prep_task: ClipboardList,
  cleaning: Sparkles,
  general: Circle,
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: "border-l-muted-foreground",
  medium: "border-l-blue-500",
  high: "border-l-orange-500",
  urgent: "border-l-destructive",
};

const STATUS_BADGES: Record<TaskStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "secondary" },
  in_progress: { label: "In Progress", variant: "default" },
  submitted: { label: "Submitted", variant: "outline" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Changes Requested", variant: "destructive" },
  completed: { label: "Completed", variant: "default" },
};

export const TaskInbox = () => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, TaskComment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    if (!user) return;

    // Get user's section assignments
    const { data: assignments } = await supabase
      .from("section_assignments")
      .select("section_id")
      .eq("user_id", user.id);

    const sectionIds = (assignments || []).map((a) => a.section_id);

    // Build query for tasks
    let query = supabase
      .from("kitchen_tasks")
      .select(`
        *,
        section:kitchen_sections(name, color)
      `)
      .or(`assigned_to.eq.${user.id}${sectionIds.length > 0 ? `,section_id.in.(${sectionIds.join(",")})` : ""}`);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
      setLoading(false);
      return;
    }

    // Filter out old completed/approved tasks (older than 24 hours)
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const filteredTasks = (data || []).filter((task) => {
      if (task.status === "approved" || task.status === "completed") {
        const completedAt = task.completed_at ? new Date(task.completed_at) : new Date(task.updated_at);
        return completedAt > twentyFourHoursAgo;
      }
      return true;
    });

    // Sort: urgent first, then by due date, then by created_at
    const sortedTasks = filteredTasks.sort((a, b) => {
      const priorityOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority as TaskPriority] ?? 4;
      const bPriority = priorityOrder[b.priority as TaskPriority] ?? 4;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      if (a.due_date && b.due_date) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setTasks(sortedTasks as Task[]);
    setLoading(false);
  };

  const fetchComments = async (taskId: string) => {
    const { data } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (data) {
      setComments((prev) => ({ ...prev, [taskId]: data as TaskComment[] }));
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  // Realtime subscription for new tasks
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("task-inbox")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "kitchen_tasks",
          filter: `assigned_to=eq.${user.id}`,
        },
        (payload) => {
          const newTask = payload.new as Task;
          toast.info(`New task assigned: ${newTask.title}`);
          fetchTasks();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "kitchen_tasks",
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleExpandTask = async (taskId: string) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
      if (!comments[taskId]) {
        await fetchComments(taskId);
      }
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    if (!user) return;
    setSubmitting(true);

    const updates: Record<string, unknown> = { status: newStatus };
    
    if (newStatus === "completed") {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = user.id;
    }

    const { error } = await supabase
      .from("kitchen_tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) {
      toast.error("Failed to update task");
      setSubmitting(false);
      return;
    }

    // Log activity
    const task = tasks.find((t) => t.id === taskId);
    const actionMap: Record<TaskStatus, string> = {
      in_progress: "task_started",
      submitted: "task_submitted",
      completed: "task_completed",
      pending: "task_updated",
      approved: "task_approved",
      rejected: "task_rejected",
    };

    await supabase.from("activity_log").insert({
      user_id: user.id,
      user_name: profile?.full_name || "Unknown",
      action_type: actionMap[newStatus],
      entity_type: "task",
      entity_id: taskId,
      entity_name: task?.title || "Task",
      section_id: task?.section_id,
    });

    toast.success(
      newStatus === "in_progress"
        ? "Task started!"
        : newStatus === "submitted"
        ? "Task submitted for review!"
        : "Task completed!"
    );

    await fetchTasks();
    setSubmitting(false);
  };

  const handleAddComment = async (taskId: string) => {
    if (!user || !newComment.trim()) return;
    setSubmitting(true);

    const { error } = await supabase.from("task_comments").insert({
      task_id: taskId,
      user_id: user.id,
      user_name: profile?.full_name || "Unknown",
      content: newComment.trim(),
      is_system_message: false,
    });

    if (error) {
      toast.error("Failed to add comment");
    } else {
      setNewComment("");
      await fetchComments(taskId);
    }
    setSubmitting(false);
  };

  const getDueDateDisplay = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = parseISO(dueDate);
    const overdue = isPast(date) && !isToday(date);
    const dueToday = isToday(date);

    return (
      <span
        className={cn(
          "text-xs",
          overdue && "text-destructive font-medium",
          dueToday && "text-warning font-medium",
          !overdue && !dueToday && "text-muted-foreground"
        )}
      >
        <Clock className="w-3 h-3 inline mr-1" />
        {overdue ? "Overdue: " : dueToday ? "Due today: " : "Due: "}
        {format(date, "MMM d")}
      </span>
    );
  };

  const pendingCount = tasks.filter((t) => t.status === "pending" || t.status === "in_progress" || t.status === "rejected").length;

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            My Tasks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          My Tasks
          {pendingCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {pendingCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-success mb-3" />
            <p className="font-medium">All caught up!</p>
            <p className="text-sm text-muted-foreground">No tasks assigned.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const TypeIcon = TASK_TYPE_ICONS[task.priority as TaskType] || Circle;
              const isExpanded = expandedTaskId === task.id;
              const taskComments = comments[task.id] || [];

              return (
                <motion.div
                  key={task.id}
                  layout
                  className={cn(
                    "rounded-lg border border-l-4 bg-card overflow-hidden",
                    PRIORITY_COLORS[task.priority]
                  )}
                >
                  {/* Task Header */}
                  <button
                    onClick={() => handleExpandTask(task.id)}
                    className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                        style={{ backgroundColor: task.section?.color || "var(--muted)" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{task.title}</span>
                          {task.priority === "urgent" && (
                            <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                          )}
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <Badge variant={STATUS_BADGES[task.status].variant} className="text-xs">
                            {STATUS_BADGES[task.status].label}
                          </Badge>
                          {getDueDateDisplay(task.due_date)}
                          {task.section && (
                            <span className="text-xs text-muted-foreground">
                              {task.section.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t"
                      >
                        <div className="p-4 space-y-4">
                          {/* Full Description */}
                          {task.description && (
                            <div>
                              <p className="text-sm font-medium mb-1">Description</p>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            </div>
                          )}

                          {/* Rejection Reason */}
                          {task.status === "rejected" && task.rejection_reason && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                <strong>Changes Requested:</strong> {task.rejection_reason}
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Comments Thread */}
                          <div>
                            <p className="text-sm font-medium mb-2">Comments</p>
                            {taskComments.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No comments yet.</p>
                            ) : (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {taskComments.map((comment) => (
                                  <div key={comment.id} className="flex gap-2 text-sm">
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="text-xs">
                                        {comment.user_name?.charAt(0) || "?"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium">{comment.user_name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {format(new Date(comment.created_at), "MMM d, h:mm a")}
                                        </span>
                                      </div>
                                      <p className="text-muted-foreground">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Comment */}
                            <div className="flex gap-2 mt-3">
                              <Textarea
                                placeholder="Add a comment..."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                className="min-h-[60px] text-sm"
                              />
                              <Button
                                size="icon"
                                onClick={() => handleAddComment(task.id)}
                                disabled={submitting || !newComment.trim()}
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2 border-t">
                            {task.status === "pending" && (
                              <Button
                                onClick={() => updateTaskStatus(task.id, "in_progress")}
                                disabled={submitting}
                                className="flex-1"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Start Working
                              </Button>
                            )}

                            {task.status === "in_progress" && (
                              <>
                                {(task.priority === "recipe_entry" as unknown || task.priority === "inventory_count" as unknown) ? (
                                  <Button
                                    onClick={() => updateTaskStatus(task.id, "submitted")}
                                    disabled={submitting}
                                    className="flex-1"
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Submit for Review
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() => updateTaskStatus(task.id, "completed")}
                                    disabled={submitting}
                                    className="flex-1"
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Mark Complete
                                  </Button>
                                )}
                              </>
                            )}

                            {task.status === "rejected" && (
                              <Button
                                onClick={() => updateTaskStatus(task.id, "submitted")}
                                disabled={submitting}
                                className="flex-1"
                              >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Resubmit
                              </Button>
                            )}

                            {task.status === "submitted" && (
                              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                                <Clock className="w-4 h-4 mr-2" />
                                Waiting for approval...
                              </div>
                            )}

                            {(task.status === "approved" || task.status === "completed") && (
                              <div className="flex-1 flex items-center justify-center text-success text-sm">
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Completed
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskInbox;
