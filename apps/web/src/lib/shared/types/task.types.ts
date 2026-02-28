// Kitchen Task Types

export type TaskType = "recipe_entry" | "inventory_count" | "prep_task" | "cleaning" | "general";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "submitted" | "approved" | "rejected" | "completed";

export interface KitchenTask {
  id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  section_id: string | null;
  assigned_to: string | null;
  assigned_by: string | null;
  due_date: string | null;
  due_time: string | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  recipe_id: string | null;
  prep_list_id: string | null;
  completed_at: string | null;
  completed_by: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  assignee?: {
    full_name: string;
    position: string | null;
    avatar_url: string | null;
  };
  section?: {
    name: string;
    color: string | null;
  };
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string | null;
  content: string;
  is_system_message: boolean;
  created_at: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: TaskPriority;
  section_id?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
}
