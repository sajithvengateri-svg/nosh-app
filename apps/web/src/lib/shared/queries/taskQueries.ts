// Task queries — extracted from useKitchenTasks.ts

import { supabase } from "../supabaseClient";
import type { TaskStatus } from '../types/task.types';

export async function fetchAllTasks() {
  const { data, error } = await supabase
    .from("kitchen_tasks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchProfilesByIds(userIds: string[]) {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, full_name, position, avatar_url")
    .in("user_id", userIds);
  if (error) throw error;
  return data || [];
}

export async function fetchSectionsByIds(sectionIds: string[]) {
  if (sectionIds.length === 0) return [];
  const { data, error } = await supabase
    .from("kitchen_sections")
    .select("id, name, color")
    .in("id", sectionIds);
  if (error) throw error;
  return data || [];
}

export async function insertTask(taskData: {
  title: string;
  description: string | null;
  priority: string;
  status: string;
  section_id: string | null;
  assigned_to: string | null;
  assigned_by: string;
  due_date: string | null;
}) {
  const { data, error } = await supabase
    .from("kitchen_tasks")
    .insert(taskData)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTaskStatusQuery(taskId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from("kitchen_tasks")
    .update(updates)
    .eq("id", taskId);
  if (error) throw error;
}

export async function fetchTaskComments(taskId: string) {
  const { data, error } = await supabase
    .from("task_comments")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function insertTaskComment(data: {
  task_id: string;
  user_id: string;
  user_name: string;
  content: string;
  is_system_message: boolean;
}) {
  const { error } = await supabase.from("task_comments").insert(data);
  if (error) throw error;
}

export async function logActivity(data: {
  user_id: string;
  user_name: string;
  action_type: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  section_id?: string | null;
}) {
  await supabase.from("activity_log").insert(data);
}
