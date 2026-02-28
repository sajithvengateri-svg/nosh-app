import { useCallback } from "react";
import { Alert, Platform } from "react-native";
import * as Calendar from "expo-calendar";

export function useCalendarIntegration() {
  const getDefaultCalendarId = async (): Promise<string | null> => {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant calendar access in Settings to set reminders.");
      return null;
    }
    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
    const defaultCal = calendars.find(
      (c: any) => c.allowsModifications && (Platform.OS === "ios" ? c.source?.name === "iCloud" || c.source?.name === "Default" : c.isPrimary)
    ) || calendars.find((c: any) => c.allowsModifications);
    return defaultCal?.id || null;
  };

  const createServiceReminder = useCallback(async (params: {
    title: string;
    dueDate: string; // ISO date string (YYYY-MM-DD)
    reminderWeeksBefore?: number;
    notes?: string;
  }): Promise<string | null> => {
    try {
      const calId = await getDefaultCalendarId();
      if (!calId) return null;

      const due = new Date(params.dueDate + "T09:00:00");
      const reminderDate = new Date(due);
      reminderDate.setDate(reminderDate.getDate() - (params.reminderWeeksBefore || 2) * 7);

      const eventId = await Calendar.createEventAsync(calId, {
        title: `ChefOS: ${params.title}`,
        startDate: due,
        endDate: new Date(due.getTime() + 60 * 60 * 1000), // 1 hour
        allDay: false,
        notes: params.notes || `Service due: ${params.title}`,
        alarms: [{ relativeOffset: -((params.reminderWeeksBefore || 2) * 7 * 24 * 60) }],
      });
      return eventId;
    } catch (e: any) {
      Alert.alert("Calendar Error", e.message || "Failed to create reminder");
      return null;
    }
  }, []);

  const deleteReminder = useCallback(async (eventId: string): Promise<void> => {
    try {
      await Calendar.deleteEventAsync(eventId);
    } catch {}
  }, []);

  const updateReminder = useCallback(async (eventId: string, params: {
    title?: string;
    dueDate?: string;
    notes?: string;
  }): Promise<void> => {
    try {
      const updates: any = {};
      if (params.title) updates.title = `ChefOS: ${params.title}`;
      if (params.dueDate) {
        const due = new Date(params.dueDate + "T09:00:00");
        updates.startDate = due;
        updates.endDate = new Date(due.getTime() + 60 * 60 * 1000);
      }
      if (params.notes) updates.notes = params.notes;
      await Calendar.updateEventAsync(eventId, updates);
    } catch {}
  }, []);

  return { createServiceReminder, deleteReminder, updateReminder };
}
