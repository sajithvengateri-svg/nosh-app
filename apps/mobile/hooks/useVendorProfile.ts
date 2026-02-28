import { useMutation } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { useVendorAuth } from "../contexts/VendorAuthProvider";

export { useVendorAuth } from "../contexts/VendorAuthProvider";

interface UpdateProfileInput {
  business_name?: string;
  abn?: string | null;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string | null;
  address?: string | null;
  postcode?: string | null;
  delivery_areas?: string[];
  categories?: string[];
}

/**
 * Updates the vendor profile and refreshes the auth context.
 */
export function useUpdateVendorProfile() {
  const { vendorProfile, refreshProfile } = useVendorAuth();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      const { error } = await supabase
        .from("vendor_profiles")
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq("id", vendorProfile!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      refreshProfile();
    },
  });
}
