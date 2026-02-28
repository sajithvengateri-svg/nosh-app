import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { useAuth } from "./AuthProvider";
import { supabase } from "../lib/supabase";
import { isHomeCook } from "@queitos/shared";
import type { StoreMode, AppVariant } from "@queitos/shared";

const APP_VARIANT = (Constants.expoConfig?.extra?.appVariant ?? "chefos") as AppVariant;

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  store_mode?: string;
  subscription_tier: string;
  onboarding_completed_at: string | null;
}

interface OrgMembership {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  venue_id: string | null;
  is_active: boolean;
}

interface OrgContextType {
  currentOrg: Organization | null;
  orgs: Organization[];
  membership: OrgMembership | null;
  memberships: OrgMembership[];
  isOwner: boolean;
  isOrgHeadChef: boolean;
  storeMode: StoreMode;
  switchOrg: (orgId: string) => void;
  refreshOrg: () => Promise<void>;
  isLoading: boolean;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within an OrgProvider");
  }
  return context;
};

export const OrgProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const membership =
    memberships.find(
      (m) => m.org_id === currentOrg?.id && m.user_id === user?.id
    ) ?? null;

  const isOwner = membership?.role === "owner";
  const isOrgHeadChef =
    membership?.role === "owner" || membership?.role === "head_chef";
  const storeMode: StoreMode =
    (currentOrg?.store_mode as StoreMode) || "restaurant";

  const fetchOrgData = async (userId: string) => {
    try {
      // Dev bypass — provide a fake org so the app is fully functional
      if (userId === "dev-bypass-user") {
        const fakeOrg: Organization = {
          id: "00000000-0000-0000-0000-000000000000",
          name: "Dev Kitchen",
          slug: "dev-kitchen",
          logo_url: null,
          owner_id: "dev-bypass-user",
          store_mode: isHomeCook(APP_VARIANT) ? "home_cook" : "restaurant",
          subscription_tier: "pro",
          onboarding_completed_at: null,
        };
        const fakeMembership: OrgMembership = {
          id: "00000000-0000-0000-0000-000000000001",
          org_id: "00000000-0000-0000-0000-000000000000",
          user_id: "dev-bypass-user",
          role: "owner",
          venue_id: null,
          is_active: true,
        };
        setOrgs([fakeOrg]);
        setCurrentOrg(fakeOrg);
        setMemberships([fakeMembership]);
        setIsLoading(false);
        return;
      }

      const { data: memberData, error: memberError } = await supabase
        .from("org_memberships")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (memberError) throw memberError;
      setMemberships(memberData || []);

      if (!memberData?.length) {
        setOrgs([]);
        setCurrentOrg(null);
        setIsLoading(false);
        return;
      }

      const orgIds = memberData.map((m) => m.org_id);

      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .in("id", orgIds);

      if (orgError) throw orgError;
      setOrgs(orgData || []);

      // Restore saved org from SecureStore
      const savedOrgId = await SecureStore.getItemAsync("chefos_current_org");
      const savedOrg = orgData?.find((o) => o.id === savedOrgId);
      setCurrentOrg(savedOrg || orgData?.[0] || null);
    } catch (error) {
      console.error("Error fetching org data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchOrg = (orgId: string) => {
    const org = orgs.find((o) => o.id === orgId);
    if (org) {
      setCurrentOrg(org);
      SecureStore.setItemAsync("chefos_current_org", orgId);
    }
  };

  const refreshOrg = async () => {
    if (user) await fetchOrgData(user.id);
  };

  useEffect(() => {
    if (user) {
      fetchOrgData(user.id);
    } else {
      setOrgs([]);
      setCurrentOrg(null);
      setMemberships([]);
      setIsLoading(false);
    }
  }, [user]);

  return (
    <OrgContext.Provider
      value={{
        currentOrg,
        orgs,
        membership,
        memberships,
        isOwner,
        isOrgHeadChef,
        storeMode,
        switchOrg,
        refreshOrg,
        isLoading,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
};
