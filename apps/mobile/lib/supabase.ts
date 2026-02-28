import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ??
  "https://rahociztfiuzyolqvdcz.supabase.co";
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhaG9jaXp0Zml1enlvbHF2ZGN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyMzE5NTUsImV4cCI6MjA4NjgwNzk1NX0.IPRKpotD-LeUjrYdnnxksV1zUnZ0ZePpUd-jIuY3lyg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
