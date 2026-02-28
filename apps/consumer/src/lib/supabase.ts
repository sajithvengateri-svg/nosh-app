import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Use SecureStore on native, localStorage on web
const ExpoSecureStoreAdapter =
  Platform.OS === "web"
    ? {
        getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
        setItem: (key: string, value: string) => {
          localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          localStorage.removeItem(key);
          return Promise.resolve();
        },
      }
    : {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) =>
          SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };

export const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl ??
  "https://gmvfjgkzbpjimmzxcniv.supabase.co";
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtdmZqZ2t6YnBqaW1tenhjbml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4ODc1OTgsImV4cCI6MjA4NzQ2MzU5OH0.7uOEGnm8YFTg6GW8yKFqq_1DfiUMviQOmer3MO_UoNE";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
