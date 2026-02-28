import { useState, useEffect } from "react";
import { 
  ClipboardList, 
  Plus, 
  Calendar, 
  User, 
  Check, 
  RotateCcw, 
  ChevronDown,
  ChevronUp,
  Camera,
  Package,
  ClipboardCheck,
  MessageSquare,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format, isPast, isToday, parseISO } from "date-fns";
import { useKitchenTasks, TaskPriority, TaskStatus, KitchenTask, TaskComment } from "@/hooks/useKitchenTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";

interface TeamMember {
  user_id: string;
  full_name: string;
  position: string | null;
  avatar_url: string | null;
}

interface KitchenSection {
  id: string;
  name: string;
  color: string | null;
}

const TASK_TYPES = [
  { value: "recipe_entry", label: "Add Recipes", icon: "📸" },
  { value: "inventory_count", label: "Stock Count", icon: "📦" },
  { value: "prep_task", label: "Prep Task", icon: "📋" },
  { value: "cleaning", label: "Cleaning", icon: "🧹" },
  { value: "general", label: "General", icon: "📝" },
];

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
  medium: { label: "Medium", className: "bg-blue-500/20 text-blue-600" },
  high: { label: "High", className: "bg-orange-500/20 text-orange-600" },
  urgent: { label: "Urgent", className: "bg-destructive/20 text-destructive animate-pulse" },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-muted text-muted-foreground" },
  in_progress: { label: "In Progress", className: "bg-blue-500/20 text-blue-600" },
  submitted: { label: "Needs Review", className: "bg-amber-500/20 text-amber-600" },
  approved: { label: "Approved", className: "bg-green-500/20 text-green-600" },
  rejected: { label: "Changes Requested", className: "bg-destructive/20 text-destructive" },
  completed: { label: "Completed", className: "bg-green-500/20 text-green-600" },
};

const TasksTab = () => {
  const { profile } = useAuth();
  const { currentOrg } = useOrg();
  const { tasks, loading, createTask, updateTaskStatus, fetchTaskComments, addTaskComment, getTaskCounts } = useKitchenTasks();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KitchenTask | null>(null);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [sections, setSections] = useState<KitchenSection[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    task_type: "general",
    priority: "medium" as TaskPriority,
    assigned_to: "",
    assign_to_section: false,
    section_id: "",
    due_date: "",
  });

  useEffect(() => {
    fetchTeamMembers();
    fetchSections();
  }, []);

  const fetchTeamMembers = async () => {
    if (!currentOrg?.id) return;

    // Get org members first
    const { data: memberships } = await supabase
      .from("org_memberships")
      .select("user_id")
      .eq("org_id", currentOrg.id)
      .eq("is_active", true);

    if (!memberships?.length) {
      setTeamMembers([]);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, position, avatar_url")
      .in("user_id", memberships.map((m) => m.user_id))
      .order("full_name");
    setTeamMembers(data || []);
  };

  const fetchSections = async () => {
    const query = supabase
      .from("kitchen_sections")
      .select("id, name, color")
      .eq("is_active", true)
      .order("name");

    if (currentOrg?.id) {
      query.eq("org_id", currentOrg.id);
    }

    const { data } = await query;
    setSections(data || []);
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) return;

    await createTask({
      title: formData.title,
      description: formData.description || undefined,
      priority: formData.priority,
      section_id: formData.section_id || undefined,
      assigned_to: formData.assign_to_section ? undefined : formData.assigned_to || undefined,
      due_date: formData.due_date || undefined,
    });

    resetForm();
    setCreateDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      task_type: "general",
      priority: "medium",
      assigned_to: "",
      assign_to_section: false,
      section_id: "",
      due_date: "",
    });
  };

  const openQuickTask = (template: { title: string; task_type: string }) => {
    setFormData({
      ...formData,
      title: template.title,
      task_type: template.task_type,
    });
    setCreateDialogOpen(true);
  };

  const openTaskDetail = async (task: KitchenTask) => {
    setSelectedTask(task);
    setDetailDialogOpen(true);
    setShowRejectInput(false);
    setRejectionReason("");
    const comments = await fetchTaskComments(task.id);
    setTaskComments(comments);
  };

  const handleApprove = async () => {
    if (!selectedTask) return;
    const success = await updateTaskStatus(selectedTask.id, "approved");
    if (success) {
      setDetailDialogOpen(false);
      setSelectedTask(null);
    }
  };

  const handleReject = async () => {
    if (!selectedTask || !rejectionReason.trim()) return;
    const success = await updateTaskStatus(selectedTask.id, "rejected", { rejection_reason: rejectionReason });
    if (success) {
      setDetailDialogOpen(false);
      setSelectedTask(null);
      setRejectionReason("");
      setShowRejectInput(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) return;
    const success = await addTaskComment(selectedTask.id, newComment);
    if (success) {
      const comments = await fetchTaskComments(selectedTask.id);
      setTaskComments(comments);
      setNewComment("");
    }
  };

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return isPast(parseISO(dueDate)) && !isToday(parseISO(dueDate));
  };

  const counts = getTaskCounts();

  const filteredTasks = tasks.filter(task => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return task.status === "pending";
    if (activeFilter === "in_progress") return task.status === "in_progress";
    if (activeFilter === "submitted") return task.status === "submitted";
    if (activeFilter === "completed") return task.status === "completed" || task.status === "approved";
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-3">
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
          
          {/* Quick Task Templates */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openQuickTask({ title: "Upload your section recipes", task_type: "recipe_entry" })}
            >
              📸 Upload Section Recipes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openQuickTask({ title: "Complete stock count", task_type: "inventory_count" })}
            >
              📦 End of Day Stock Count
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openQuickTask({ title: "Complete today's prep list", task_type: "prep_task" })}
            >
              📋 Complete Today's Prep
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={activeFilter} onValueChange={setActiveFilter}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge variant="secondary" className="h-5 px-1.5">{counts.all}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            Pending
            <Badge variant="secondary" className="h-5 px-1.5">{counts.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-2">
            In Progress
            <Badge variant="secondary" className="h-5 px-1.5">{counts.in_progress}</Badge>
          </TabsTrigger>
          <TabsTrigger value="submitted" className="gap-2">
            Needs Review
            <Badge variant="secondary" className="h-5 px-1.5 bg-amber-500/20 text-amber-600">{counts.submitted}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            Completed
            <Badge variant="secondary" className="h-5 px-1.5">{counts.completed}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tasks found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map(task => {
            const isExpanded = expandedTasks.has(task.id);
            const priorityConfig = PRIORITY_CONFIG[task.priority];
            const statusConfig = STATUS_CONFIG[task.status];
            
            return (
              <Card 
                key={task.id} 
                className={cn(
                  "transition-all cursor-pointer hover:shadow-md",
                  task.status === "submitted" && "border-amber-500/50"
                )}
                onClick={() => openTaskDetail(task)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Section color dot */}
                    {task.section && (
                      <div
                        className="w-2 h-full min-h-[40px] rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: task.section.color || "#6B7280" }}
                      />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{task.title}</h4>
                          {task.description && (
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                              {task.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={cn("text-xs", priorityConfig.className)}>
                            {priorityConfig.label}
                          </Badge>
                          <Badge className={cn("text-xs", statusConfig.className)}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        {/* Assignee */}
                        {task.assignee && (
                          <div className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={task.assignee.avatar_url || undefined} />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(task.assignee.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-muted-foreground">{task.assignee.full_name}</span>
                          </div>
                        )}
                        
                        {/* Section */}
                        {task.section && (
                          <span className="text-muted-foreground">{task.section.name}</span>
                        )}
                        
                        {/* Due date */}
                        {task.due_date && (
                          <div className={cn(
                            "flex items-center gap-1",
                            isOverdue(task.due_date) && task.status !== "completed" && task.status !== "approved" 
                              ? "text-destructive" 
                              : "text-muted-foreground"
                          )}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{format(parseISO(task.due_date), "MMM d")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Task title..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Task Type</Label>
                <Select
                  value={formData.task_type}
                  onValueChange={(value) => setFormData({ ...formData, task_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <span className={cn("px-2 py-0.5 rounded text-xs", config.className)}>
                          {config.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select
                value={formData.assign_to_section ? "section" : formData.assigned_to}
                onValueChange={(value) => {
                  if (value === "section") {
                    setFormData({ ...formData, assign_to_section: true, assigned_to: "" });
                  } else {
                    setFormData({ ...formData, assign_to_section: false, assigned_to: value });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="section">📍 Entire Section</SelectItem>
                  {teamMembers.map(member => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.full_name} {member.position && `(${member.position})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {formData.assign_to_section && (
              <div className="space-y-2">
                <Label>Section</Label>
                <Select
                  value={formData.section_id}
                  onValueChange={(value) => setFormData({ ...formData, section_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select section..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(section => (
                      <SelectItem key={section.id} value={section.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: section.color || "#6B7280" }}
                          />
                          {section.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask} disabled={!formData.title.trim()}>
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTask?.section && (
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: selectedTask.section.color || "#6B7280" }}
                />
              )}
              {selectedTask?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4 py-2">
              {/* Status and Priority */}
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs", STATUS_CONFIG[selectedTask.status].className)}>
                  {STATUS_CONFIG[selectedTask.status].label}
                </Badge>
                <Badge className={cn("text-xs", PRIORITY_CONFIG[selectedTask.priority].className)}>
                  {PRIORITY_CONFIG[selectedTask.priority].label}
                </Badge>
              </div>
              
              {/* Description */}
              {selectedTask.description && (
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
              )}
              
              {/* Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedTask.assignee && (
                  <div>
                    <span className="text-muted-foreground">Assigned to:</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(selectedTask.assignee.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{selectedTask.assignee.full_name}</span>
                    </div>
                  </div>
                )}
                {selectedTask.section && (
                  <div>
                    <span className="text-muted-foreground">Section:</span>
                    <p className="mt-1">{selectedTask.section.name}</p>
                  </div>
                )}
                {selectedTask.due_date && (
                  <div>
                    <span className="text-muted-foreground">Due:</span>
                    <p className={cn(
                      "mt-1",
                      isOverdue(selectedTask.due_date) && "text-destructive"
                    )}>
                      {format(parseISO(selectedTask.due_date), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Rejection reason if rejected */}
              {selectedTask.status === "rejected" && selectedTask.rejection_reason && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive">Changes Requested:</p>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTask.rejection_reason}</p>
                </div>
              )}
              
              {/* Comments */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                  <MessageSquare className="w-4 h-4" />
                  Comments ({taskComments.length})
                </h4>
                
                <ScrollArea className="h-[150px] pr-4">
                  <div className="space-y-3">
                    {taskComments.map(comment => (
                      <div key={comment.id} className="text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.user_name || "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(parseISO(comment.created_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">{comment.content}</p>
                      </div>
                    ))}
                    {taskComments.length === 0 && (
                      <p className="text-sm text-muted-foreground">No comments yet</p>
                    )}
                  </div>
                </ScrollArea>
                
                <div className="flex gap-2 mt-3">
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                  />
                  <Button size="icon" onClick={handleAddComment}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Action buttons for submitted tasks */}
              {selectedTask.status === "submitted" && (
                <div className="border-t pt-4 space-y-3">
                  {showRejectInput ? (
                    <div className="space-y-2">
                      <Label>Reason for changes</Label>
                      <Textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain what changes are needed..."
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowRejectInput(false)} className="flex-1">
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleReject}
                          disabled={!rejectionReason.trim()}
                          className="flex-1"
                        >
                          Submit Feedback
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowRejectInput(true)}
                        className="flex-1 border-orange-500/50 text-orange-600 hover:bg-orange-500/10"
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Request Changes
                      </Button>
                      <Button 
                        onClick={handleApprove}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TasksTab;
