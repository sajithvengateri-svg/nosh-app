import { useEffect, useRef } from "react";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

/**
 * Detects `?upgrade=success` in the URL after returning from Stripe checkout.
 * Shows a success toast and refreshes org data to pick up the new tier.
 */
export function useUpgradeSuccess() {
  const { refreshOrg } = useOrg();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;

    const params = new URLSearchParams(window.location.search);
    const upgradeStatus = params.get("upgrade");

    if (upgradeStatus === "success") {
      handled.current = true;
      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("upgrade");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.toString());

      // Refresh org to pick up new subscription tier
      refreshOrg().then(() => {
        toast.success("Upgrade successful! Welcome to ChefOS Pro.", {
          duration: 5000,
        });
      });
    } else if (upgradeStatus === "cancelled") {
      handled.current = true;
      const url = new URL(window.location.href);
      url.searchParams.delete("upgrade");
      window.history.replaceState({}, "", url.toString());
      toast.info("Checkout cancelled. You can upgrade anytime.");
    }
  }, [refreshOrg]);
}
