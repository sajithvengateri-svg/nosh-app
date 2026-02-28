import { useOrg } from "@/contexts/OrgContext";

export function useOrgId(): string | null {
  const { currentOrg } = useOrg();
  return currentOrg?.id ?? null;
}
