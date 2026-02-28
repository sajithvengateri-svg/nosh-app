import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  orgId: string | null;
  isLoading: boolean;
  devMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  enterDevMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devMode, setDevMode] = useState(false);

  const enterDevMode = () => {
    setDevMode(true);
    setOrgId("dev-org");
    setUser({ id: "dev-user", email: "dev@moneyos.local" } as User);
    setIsLoading(false);
  };

  const fetchOrgId = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("org_memberships")
        .select("org_id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1)
        .single();
      setOrgId(data?.org_id ?? null);
    } catch {
      setOrgId(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchOrgId(session.user.id), 0);
        } else {
          setOrgId(null);
        }
        setIsLoading(false);
      },
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchOrgId(session.user.id);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, orgId, isLoading, devMode, signIn, signOut, enterDevMode }}>
      {children}
    </AuthContext.Provider>
  );
};
