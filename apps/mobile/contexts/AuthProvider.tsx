import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AppRole = "owner" | "head_chef" | "line_chef";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  position: string;
}

interface ModulePermission {
  module: string;
  can_view: boolean;
  can_edit: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  permissions: ModulePermission[];
  isLoading: boolean;
  isHeadChef: boolean;
  isDevBypass: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, storeMode?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  canView: (module: string) => boolean;
  canEdit: (module: string) => boolean;
  refreshProfile: () => Promise<void>;
  devEnter: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Dev-only fake user so we can skip auth on all variants
const DEV_FAKE_USER = {
  id: "dev-bypass-user",
  email: "dev@chefos.local",
  app_metadata: {},
  user_metadata: { full_name: "Dev Tester" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

const DEV_FAKE_PROFILE: Profile = {
  id: "dev-bypass-profile",
  user_id: "dev-bypass-user",
  full_name: "Dev Tester",
  email: "dev@chefos.local",
  phone: null,
  avatar_url: null,
  position: "owner",
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevBypass, setIsDevBypass] = useState(false);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileData) setProfile(profileData);

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["owner", "head_chef", "line_chef"]);

      const roles = roleData?.map((r) => r.role) || [];
      if (roles.includes("owner")) setRole("owner");
      else if (roles.includes("head_chef")) setRole("head_chef");
      else if (roles.includes("line_chef")) setRole("line_chef");
      else setRole(null);

      if (roles.includes("line_chef") && !roles.includes("head_chef")) {
        const { data: permData } = await supabase
          .from("module_permissions")
          .select("module, can_view, can_edit")
          .eq("user_id", userId);
        setPermissions(permData || []);
      } else {
        setPermissions([]);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const refreshProfile = async () => {
    if (user && !isDevBypass) await fetchUserData(user.id);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchUserData(session.user.id), 0);
      } else {
        setProfile(null);
        setRole(null);
        setPermissions([]);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchUserData(session.user.id);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string, fullName: string, storeMode?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          store_mode: storeMode || undefined,
        },
      },
    });

    if (error) return { error: new Error(error.message) };

    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      return { error: new Error("An account with this email already exists.") };
    }

    return { error: null };
  };

  const devEnter = () => {
    if (!__DEV__) return;
    setUser(DEV_FAKE_USER);
    setProfile(DEV_FAKE_PROFILE);
    setRole("owner");
    setPermissions([]);
    setIsDevBypass(true);
  };

  const signOut = async () => {
    if (isDevBypass) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setRole(null);
      setPermissions([]);
      setIsDevBypass(false);
      return;
    }
    await supabase.auth.signOut();
  };

  const isHeadChef = role === "head_chef" || role === "owner";

  const canView = (module: string): boolean => {
    if (isHeadChef || role === null) return true;
    return permissions.find((p) => p.module === module)?.can_view ?? false;
  };

  const canEdit = (module: string): boolean => {
    if (isHeadChef || role === null) return true;
    return permissions.find((p) => p.module === module)?.can_edit ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        permissions,
        isLoading,
        isHeadChef,
        isDevBypass,
        signIn,
        signUp,
        signOut,
        canView,
        canEdit,
        refreshProfile,
        devEnter,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
