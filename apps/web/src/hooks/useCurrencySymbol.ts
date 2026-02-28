import { useMemo } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { currencySymbol } from "@queitos/shared";

/**
 * Returns the currency symbol for the current org's region.
 * Reads the `currency` field from org settings, falling back to "$".
 */
export function useCurrencySymbol(): string {
  const { currentOrg } = useOrg();

  return useMemo(() => {
    const currency = (currentOrg as any)?.currency
      || (currentOrg as any)?.settings?.currency;
    if (currency) return currencySymbol(currency);
    // Fallback: derive from store_mode
    const mode = (currentOrg as any)?.store_mode;
    if (mode === "india") return "₹";
    if (mode === "gcc" || mode === "uae") return "د.إ";
    return "$";
  }, [currentOrg]);
}
