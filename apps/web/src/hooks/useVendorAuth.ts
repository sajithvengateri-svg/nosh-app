 import { useState, useEffect } from "react";
 import { User } from "@supabase/supabase-js";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
 interface VendorProfile {
   id: string;
   user_id: string;
   business_name: string;
   contact_name: string;
   contact_email: string;
   contact_phone: string | null;
   address: string | null;
   postcode: string | null;
   categories: string[] | null;
   delivery_areas: string[] | null;
   status: string | null;
   logo_url: string | null;
   abn: string | null;
 }
 
  export const useVendorAuth = () => {
   const [user, setUser] = useState<User | null>(null);
   const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
   const [loading, setLoading] = useState(true);
   const [isVendor, setIsVendor] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
 
   const fetchVendorProfile = async (userId: string) => {
    setProfileLoading(true);
     try {
       const { data, error } = await supabase
         .from("vendor_profiles")
         .select("*")
         .eq("user_id", userId)
        .maybeSingle();
 
       if (error) {
         console.error("Error fetching vendor profile:", error);
         setIsVendor(false);
        setProfileLoading(false);
         return;
       }
 
       setVendorProfile(data);
      setIsVendor(data?.status === "approved" || data?.status === "pending" || false);
     } catch (error) {
       console.error("Error in fetchVendorProfile:", error);
       setIsVendor(false);
    } finally {
      setProfileLoading(false);
     }
   };
 
   useEffect(() => {
     // Set up auth state listener
     const { data: { subscription } } = supabase.auth.onAuthStateChange(
       (event, session) => {
         setUser(session?.user ?? null);
         
         if (session?.user) {
           setTimeout(() => fetchVendorProfile(session.user.id), 0);
         } else {
           setVendorProfile(null);
           setIsVendor(false);
         }
         setLoading(false);
       }
     );
 
     // Check for existing session
     supabase.auth.getSession().then(({ data: { session } }) => {
       setUser(session?.user ?? null);
       if (session?.user) {
         fetchVendorProfile(session.user.id);
       }
       setLoading(false);
     });
 
     return () => subscription.unsubscribe();
   }, []);
 
    const signIn = async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
       email,
       password,
     });
 
     if (error) {
       toast.error(error.message);
       throw error;
     }

      // Immediately hydrate vendor profile to avoid redirect flicker
      if (data.user) {
        setUser(data.user);
        await fetchVendorProfile(data.user.id);
      }
 
     toast.success("Welcome back!");
   };
 
   const signUp = async (email: string, password: string, businessName: string, contactName: string) => {
     const { data, error } = await supabase.auth.signUp({
       email,
       password,
       options: {
         emailRedirectTo: `${window.location.origin}/vendor/dashboard`,
         data: {
           full_name: contactName,
           signup_source: "vendor",
         },
       },
     });
 
     if (error) {
       toast.error(error.message);
       throw error;
     }
 
     // Create vendor profile
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
         console.error("Error creating vendor profile:", profileError);
         toast.error("Failed to create vendor profile");
         throw profileError;
       }
     }
 
     toast.success("Check your email to confirm your account!");
   };
 
   const signOut = async () => {
     const { error } = await supabase.auth.signOut();
     if (error) {
       toast.error(error.message);
       throw error;
     }
     setVendorProfile(null);
     setIsVendor(false);
     toast.success("Signed out successfully");
   };
 
   return {
     user,
     vendorProfile,
    loading: loading || profileLoading,
     isVendor,
     signIn,
     signUp,
     signOut,
     refreshProfile: () => user && fetchVendorProfile(user.id),
   };
 };