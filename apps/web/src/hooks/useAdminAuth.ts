 import { useState, useEffect } from "react";
 import { User } from "@supabase/supabase-js";
 import { supabase } from "@/integrations/supabase/client";
 import { toast } from "sonner";
 
  export const useAdminAuth = () => {
    const [user, setUser] = useState<User | null>(null);
   const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
   const [roleLoading, setRoleLoading] = useState(true); // Start true to prevent premature redirects
 
   const checkAdminRole = async (userId: string) => {
    setRoleLoading(true);
     try {
       const { data, error } = await supabase
         .from("user_roles")
         .select("role")
        .eq("user_id", userId);
 
       if (error) {
         console.error("Error checking admin role:", error);
         setIsAdmin(false);
         return;
       }
 
      // Check if any of the user's roles is 'admin'
      const roles = data?.map(r => r.role) || [];
      setIsAdmin(roles.includes("admin"));
     } catch (error) {
       console.error("Error in checkAdminRole:", error);
       setIsAdmin(false);
      } finally {
        setRoleLoading(false);
     }
   };
 
    useEffect(() => {
    let initialised = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Skip the first event — getSession handles initialisation
        if (!initialised) return;

        const nextUser = session?.user ?? null;
        setUser(nextUser);

        if (nextUser) {
          await checkAdminRole(nextUser.id);
        } else {
          setIsAdmin(false);
          setRoleLoading(false);
        }
      }
    );

     supabase.auth.getSession().then(async ({ data: { session } }) => {
       const nextUser = session?.user ?? null;
       setUser(nextUser);

       if (nextUser) {
         await checkAdminRole(nextUser.id);
       } else {
         setIsAdmin(false);
         setRoleLoading(false);
       }

       setLoading(false);
       initialised = true;
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

     // Immediately hydrate admin role to avoid redirect flicker
     if (data.user) {
       setUser(data.user);
       
       const { data: roleData } = await supabase
         .from("user_roles")
         .select("role")
         .eq("user_id", data.user.id);
       
       const roles = roleData?.map(r => r.role) || [];
       const adminStatus = roles.includes("admin");
       setIsAdmin(adminStatus);
       setRoleLoading(false);
  
       toast.success("Welcome to Control Center!");
       return { isAdmin: adminStatus };
     }
    };
 
   const signOut = async () => {
     const { error } = await supabase.auth.signOut();
     if (error) {
       toast.error(error.message);
       throw error;
     }
     setIsAdmin(false);
     toast.success("Signed out successfully");
   };
 
   return {
     user,
     loading,
     isAdmin,
    roleLoading,
     signIn,
     signOut,
   };
 };