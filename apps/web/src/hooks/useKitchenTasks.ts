import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type { TaskType, TaskPriority, TaskStatus, KitchenTask, TaskComment, CreateTaskData } from '@/lib/shared/types/task.types';
import type { TaskPriority, TaskStatus, KitchenTask, TaskComment, CreateTaskData } from '@/lib/shared/types/task.types';

export const useKitchenTasks = () => {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<KitchenTask[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    
    // Fetch tasks
    const { data: tasksData, error: tasksError } = await supabase
      .from("kitchen_tasks")
      .select("*")
      .order("created_at", { ascending: false });

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      toast.error("Failed to load tasks");
      setLoading(false);
      return;
    }

    // Fetch profiles for assignees
    const assigneeIds = [...new Set((tasksData || []).filter(t => t.assigned_to).map(t => t.assigned_to!))];
    let profilesMap: Record<string, { full_name: string; position: string | null; avatar_url: string | null }> = {};
    
    if (assigneeIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, position, avatar_url")
        .in("user_id", assigneeIds);
      
      profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = { full_name: p.full_name, position: p.position, avatar_url: p.avatar_url };
        return acc;
      }, {} as typeof profilesMap);
    }

    // Fetch sections
    const sectionIds = [...new Set((tasksData || []).filter(t => t.section_id).map(t => t.section_id!))];
    let sectionsMap: Record<string, { name: string; color: string | null }> = {};
    
    if (sectionIds.length > 0) {
      const { data: sections } = await supabase
        .from("kitchen_sections")
        .select("id, name, color")
        .in("id", sectionIds);
      
      sectionsMap = (sections || []).reduce((acc, s) => {
        acc[s.id] = { name: s.name, color: s.color };
        return acc;
      }, {} as typeof sectionsMap);
    }

    // Combine data
    const enrichedTasks: KitchenTask[] = (tasksData || []).map(task => ({
      ...task,
      priority: task.priority as TaskPriority,
      status: task.status as TaskStatus,
      assignee: task.assigned_to ? profilesMap[task.assigned_to] : undefined,
      section: task.section_id ? sectionsMap[task.section_id] : undefined,
    }));

    setTasks(enrichedTasks);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data: CreateTaskData): Promise<KitchenTask | null> => {
    if (!user) {
      toast.error("You must be logged in");
      return null;
    }

    const { data: newTask, error } = await supabase
      .from("kitchen_tasks")
      .insert({
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        status: "pending",
        section_id: data.section_id || null,
        assigned_to: data.assigned_to || null,
        assigned_by: user.id,
        due_date: data.due_date || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
      return null;
    }

    // Log activity
    await supabase.from("activity_log").insert({
      user_id: user.id,
      user_name: profile?.full_name || "Unknown",
      action_type: "task_assigned",
      entity_type: "task",
      entity_id: newTask.id,
      entity_name: newTask.title,
      section_id: newTask.section_id,
    });

    toast.success("Task created");
    await fetchTasks();
    return newTask as KitchenTask;
  };

  const updateTaskStatus = async (
    taskId: string,
    status: TaskStatus,
    extras?: { rejection_reason?: string; completed_by?: string; approved_by?: string }
  ): Promise<boolean> => {
    if (!user) return false;

    const updates: Record<string, unknown> = { status };
    
    if (status === "approved" || status === "completed") {
      updates.completed_at = new Date().toISOString();
      updates.completed_by = user.id;
      updates.approved_at = new Date().toISOString();
      updates.approved_by = user.id;
    }
    
    if (status === "rejected" && extras?.rejection_reason) {
      updates.rejection_reason = extras.rejection_reason;
    }

    const { error } = await supabase
      .from("kitchen_tasks")
      .update(updates)
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
      return false;
    }

    // Log activity
    const actionType = status === "approved" ? "task_approved" : 
                       status === "rejected" ? "task_rejected" : 
                       status === "completed" ? "task_completed" : "task_updated";

    const task = tasks.find(t => t.id === taskId);
    await supabase.from("activity_log").insert({
      user_id: user.id,
      user_name: profile?.full_name || "Unknown",
      action_type: actionType,
      entity_type: "task",
      entity_id: taskId,
      entity_name: task?.title || "Task",
      section_id: task?.section_id,
    });

    await fetchTasks();
    return true;
  };

  const fetchTaskComments = async (taskId: string): Promise<TaskComment[]> => {
    const { data, error } = await supabase
      .from("task_comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return [];
    }

    return data as TaskComment[];
  };

  const addTaskComment = async (taskId: string, content: string): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase.from("task_comments").insert({
      task_id: taskId,
      user_id: user.id,
      user_name: profile?.full_name || "Unknown",
      content,
      is_system_message: false,
    });

    if (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
      return false;
    }

    return true;
  };

  const getTaskCounts = () => {
    return {
      all: tasks.length,
      pending: tasks.filter(t => t.status === "pending").length,
      in_progress: tasks.filter(t => t.status === "in_progress").length,
      submitted: tasks.filter(t => t.status === "submitted").length,
      completed: tasks.filter(t => t.status === "completed" || t.status === "approved").length,
    };
  };

  return {
    tasks,
    loading,
    createTask,
    updateTaskStatus,
    fetchTaskComments,
    addTaskComment,
    getTaskCounts,
    refetch: fetchTasks,
  };
};
