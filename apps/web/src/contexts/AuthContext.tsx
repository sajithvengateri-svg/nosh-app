import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = "owner" | "head_chef" | "line_chef";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  birthday: string | null;
  avatar_url: string | null;
  position: string;
  accepted_terms_at: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
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
  signUp: (email: string, password: string, fullName: string, orgName?: string, storeMode?: string, signupSource?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  canView: (module: string) => boolean;
  canEdit: (module: string) => boolean;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["owner", "head_chef", "line_chef"]);

      if (roleError) throw roleError;
      
      // Prioritize head_chef over line_chef
      const roles = roleData?.map(r => r.role) || [];
      if (roles.includes("owner")) {
        setRole("owner");
      } else if (roles.includes("head_chef")) {
        setRole("head_chef");
      } else if (roles.includes("line_chef")) {
        setRole("line_chef");
      } else {
        setRole(null);
      }

      // Fetch permissions (only for line chefs)
      if (roles.includes("line_chef") && !roles.includes("head_chef")) {
        const { data: permData, error: permError } = await supabase
          .from("module_permissions")
          .select("module, can_view, can_edit")
          .eq("user_id", userId);

        if (permError) throw permError;
        setPermissions(permData || []);
      } else {
        // Head chefs have full access
        setPermissions([]);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    console.log("[AuthContext] Setting up auth state listener");
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("[AuthContext] onAuthStateChange:", event, !!session);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => fetchUserData(session.user.id), 0);
        } else {
          setProfile(null);
          setRole(null);
          setPermissions([]);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[AuthContext] getSession result:", !!session);
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, orgName?: string, storeMode?: string, signupSource?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          org_name: orgName || undefined,
          store_mode: storeMode || undefined,
          signup_source: signupSource || undefined,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    // Detect fake signup (user already exists) — Supabase returns a user with no identities
    // TODO: re-enable after auth testing — disabled to allow +alias test signups
    // if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
    //   toast.error("An account with this email already exists. Please log in instead.");
    //   throw new Error("User already registered");
    // }

    toast.success("Account created! Please check your email to verify.");
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      throw error;
    }

    toast.success("Welcome back!");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast.success("Signed out successfully");
  };

  const isHeadChef = role === "head_chef" || role === "owner";

  const canView = (module: string): boolean => {
    // Head chefs and users without roles (default access) can view all
    if (isHeadChef || role === null) return true;
    const perm = permissions.find((p) => p.module === module);
    return perm?.can_view ?? false;
  };

  const canEdit = (module: string): boolean => {
    // Head chefs and users without roles (default access) can edit all
    if (isHeadChef || role === null) return true;
    const perm = permissions.find((p) => p.module === module);
    return perm?.can_edit ?? false;
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
        signUp,
        signIn,
        signOut,
        canView,
        canEdit,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
