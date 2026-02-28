import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  onboarding_complete: boolean;
  subscription_tier: "free" | "sorted_plus";
  companion_presence: "quiet" | "subtle" | "balanced" | "active";
  nav_mode: "feed" | "classic" | "smart";
  // Onboarding preferences
  cuisine_preferences?: string[];
  adventure_level?: number;
  spice_level?: number;
  weeknight_max_minutes?: number;
  weekend_max_minutes?: number;
  budget_preference?: "tight" | "moderate" | "flexible";
  preferred_vessels?: string[];
  household_size?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("ds_user_profiles")
        .select(
          "id, display_name, avatar_url, onboarding_complete, subscription_tier, companion_presence, nav_mode, cuisine_preferences, adventure_level, spice_level, weeknight_max_minutes, weekend_max_minutes, budget_preference, preferred_vessels, household_size"
        )
        .eq("id", userId)
        .single();

      if (data) setProfile(data as UserProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setIsLoading(false);
    }).catch(() => {
      // Supabase unreachable (e.g. placeholder credentials) — stop loading
      setIsLoading(false);
    });

    // Safety: never hang on the loading screen for more than 3 seconds
    const timeout = setTimeout(() => setIsLoading(false), 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    if (error) return { error: new Error(error.message) };

    if (
      data.user &&
      (!data.user.identities || data.user.identities.length === 0)
    ) {
      return {
        error: new Error("An account with this email already exists."),
      };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
