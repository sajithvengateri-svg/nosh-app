import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface VendorProfile {
  id: string;
  user_id: string;
  business_name: string;
  abn: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  address: string | null;
  postcode: string | null;
  delivery_areas: string[];
  categories: string[];
  logo_url: string | null;
  status: string | null;
}

interface VendorAuthContextType {
  user: User | null;
  session: Session | null;
  vendorProfile: VendorProfile | null;
  isLoading: boolean;
  isVendorApproved: boolean;
  isDevBypass: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, businessName: string, contactName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  devEnter: () => void;
}

const VendorAuthContext = createContext<VendorAuthContextType | undefined>(undefined);

export const useVendorAuth = () => {
  const context = useContext(VendorAuthContext);
  if (!context) {
    throw new Error("useVendorAuth must be used within a VendorAuthProvider");
  }
  return context;
};

const DEV_FAKE_USER = {
  id: "dev-vendor-user",
  email: "vendor@chefos.local",
  app_metadata: {},
  user_metadata: { full_name: "Dev Vendor" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as unknown as User;

const DEV_FAKE_PROFILE: VendorProfile = {
  id: "dev-vendor-profile",
  user_id: "dev-vendor-user",
  business_name: "Dev Butchery",
  abn: null,
  contact_name: "Dev Vendor",
  contact_email: "vendor@chefos.local",
  contact_phone: null,
  address: "123 Dev St",
  postcode: "4005",
  delivery_areas: ["4005", "4006", "4000"],
  categories: ["Meat", "Produce"],
  logo_url: null,
  status: "approved",
};

export const VendorAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevBypass, setIsDevBypass] = useState(false);

  const fetchVendorProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("vendor_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching vendor profile:", error);
        return;
      }

      setVendorProfile(data);
    } catch (error) {
      console.error("Error in fetchVendorProfile:", error);
    }
  };

  const refreshProfile = async () => {
    if (user && !isDevBypass) await fetchVendorProfile(user.id);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchVendorProfile(session.user.id), 0);
      } else {
        setVendorProfile(null);
      }
      setIsLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchVendorProfile(session.user.id);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: new Error(error.message) };

    if (data.user) {
      setUser(data.user);
      await fetchVendorProfile(data.user.id);
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, businessName: string, contactName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: contactName,
          signup_source: "vendor",
        },
      },
    });

    if (error) return { error: new Error(error.message) };

    if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
      return { error: new Error("An account with this email already exists.") };
    }

    if (data.user) {
      const { error: profileError } = await supabase
        .from("vendor_profiles")
        .insert({
          user_id: data.user.id,
          business_name: businessName,
          contact_name: contactName,
          contact_email: email,
          status: "pending",
        });

      if (profileError) {
        return { error: new Error(profileError.message) };
      }
    }

    return { error: null };
  };

  const devEnter = () => {
    if (!__DEV__) return;
    setUser(DEV_FAKE_USER);
    setVendorProfile(DEV_FAKE_PROFILE);
    setIsDevBypass(true);
    setIsLoading(false);
  };

  const signOut = async () => {
    if (isDevBypass) {
      setUser(null);
      setSession(null);
      setVendorProfile(null);
      setIsDevBypass(false);
      return;
    }
    await supabase.auth.signOut();
    setVendorProfile(null);
  };

  const isVendorApproved =
    vendorProfile?.status === "approved" || vendorProfile?.status === "pending" || false;

  return (
    <VendorAuthContext.Provider
      value={{
        user,
        session,
        vendorProfile,
        isLoading,
        isVendorApproved,
        isDevBypass,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        devEnter,
      }}
    >
      {children}
    </VendorAuthContext.Provider>
  );
};
