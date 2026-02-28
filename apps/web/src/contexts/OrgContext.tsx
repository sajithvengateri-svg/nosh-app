import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { DEV_MODE } from "@/lib/devMode";
import type { StoreMode } from "@/lib/shared/types/store.types";

interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  subscription_tier: string;
  max_venues: number;
  max_members: number;
  settings: unknown;
  created_at: string;
}

interface OrgVenue {
  id: string;
  org_id: string;
  name: string;
  address: string | null;
  postcode: string | null;
  phone: string | null;
  is_active: boolean;
}

interface OrgMembership {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  venue_id: string | null;
  is_active: boolean;
  joined_at: string;
}

interface OrgContextType {
  currentOrg: Organization | null;
  orgs: Organization[];
  venues: OrgVenue[];
  membership: OrgMembership | null;
  memberships: OrgMembership[];
  isOwner: boolean;
  isOrgHeadChef: boolean;
  isFohAdmin: boolean;
  isShiftManager: boolean;
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

// Dev mode defaults
const DEV_ORG: Organization = {
  id: "dev-org-id",
  name: "Dev Kitchen",
  slug: "dev-kitchen",
  logo_url: null,
  owner_id: "dev-user",
  subscription_tier: "free",
  max_venues: 5,
  max_members: 20,
  settings: {},
  created_at: new Date().toISOString(),
};

export const OrgProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [venues, setVenues] = useState<OrgVenue[]>([]);
  const [memberships, setMemberships] = useState<OrgMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const membership = memberships.find(
    (m) => m.org_id === currentOrg?.id && m.user_id === user?.id
  ) ?? null;

  const isOwner = membership?.role === "owner";
  const isOrgHeadChef = membership?.role === "owner" || membership?.role === "head_chef";
  const isFohAdmin = isOwner || membership?.role === "foh_admin" || membership?.role === "head_chef";
  const isShiftManager = isFohAdmin || membership?.role === "shift_manager";
  const storeMode: StoreMode = ((currentOrg as any)?.store_mode as StoreMode) || "restaurant";

  const fetchOrgData = async (userId: string) => {
    try {
      // Fetch all memberships for this user
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
        setVenues([]);
        setIsLoading(false);
        return;
      }

      const orgIds = memberData.map((m) => m.org_id);

      // Fetch orgs
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .in("id", orgIds);

      if (orgError) throw orgError;
      setOrgs(orgData || []);

      // Set current org from localStorage or first org
      const savedOrgId = localStorage.getItem("chefos_current_org");
      const savedOrg = orgData?.find((o) => o.id === savedOrgId);
      const activeOrg = savedOrg || orgData?.[0] || null;
      setCurrentOrg(activeOrg);

      // Fetch venues for current org
      if (activeOrg) {
        const { data: venueData } = await supabase
          .from("org_venues")
          .select("*")
          .eq("org_id", activeOrg.id)
          .eq("is_active", true);
        setVenues(venueData || []);
      }
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
      localStorage.setItem("chefos_current_org", orgId);
      // Reload venues
      supabase
        .from("org_venues")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .then(({ data }) => setVenues(data || []));
    }
  };

  const refreshOrg = async () => {
    if (user) await fetchOrgData(user.id);
  };

  useEffect(() => {
    if (DEV_MODE) {
      setOrgs([DEV_ORG]);
      setCurrentOrg(DEV_ORG);
      setIsLoading(false);
      return;
    }

    if (user) {
      fetchOrgData(user.id);
    } else {
      setOrgs([]);
      setCurrentOrg(null);
      setMemberships([]);
      setVenues([]);
      setIsLoading(false);
    }
  }, [user]);

  return (
    <OrgContext.Provider
      value={{
        currentOrg,
        orgs,
        venues,
        membership,
        memberships,
        isOwner,
        isOrgHeadChef,
        isFohAdmin,
        isShiftManager,
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
