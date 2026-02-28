 import { useState } from "react";
 import { motion } from "framer-motion";
 import { useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useVendorAuth } from "@/hooks/useVendorAuth";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Settings, Building2, MapPin, Phone, Mail } from "lucide-react";
 import { toast } from "sonner";
 
 const VendorSettings = () => {
   const { vendorProfile, refreshProfile } = useVendorAuth();
   const queryClient = useQueryClient();
 
   const [businessName, setBusinessName] = useState(vendorProfile?.business_name || "");
   const [contactName, setContactName] = useState(vendorProfile?.contact_name || "");
   const [contactEmail, setContactEmail] = useState(vendorProfile?.contact_email || "");
   const [contactPhone, setContactPhone] = useState(vendorProfile?.contact_phone || "");
   const [address, setAddress] = useState(vendorProfile?.address || "");
   const [postcode, setPostcode] = useState(vendorProfile?.postcode || "");
   const [deliveryAreas, setDeliveryAreas] = useState(
     vendorProfile?.delivery_areas?.join(", ") || ""
   );
   const [abn, setAbn] = useState(vendorProfile?.abn || "");
 
   const updateProfile = useMutation({
     mutationFn: async () => {
       if (!vendorProfile) return;
       const { error } = await supabase
         .from("vendor_profiles")
         .update({
           business_name: businessName,
           contact_name: contactName,
           contact_email: contactEmail,
           contact_phone: contactPhone || null,
           address: address || null,
           postcode: postcode || null,
           delivery_areas: deliveryAreas
             ? deliveryAreas.split(",").map((a) => a.trim())
             : [],
           abn: abn || null,
         })
         .eq("id", vendorProfile.id);
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["vendor-profile"] });
       refreshProfile();
       toast.success("Profile updated successfully");
     },
     onError: () => {
       toast.error("Failed to update profile");
     },
   });
 
   return (
     <div className="p-6 lg:p-8 space-y-6">
       <motion.div
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
       >
         <h1 className="text-3xl font-bold flex items-center gap-3">
           <Settings className="w-8 h-8 text-primary" />
           Settings
         </h1>
         <p className="text-muted-foreground mt-1">
           Manage your vendor profile and preferences
         </p>
       </motion.div>
 
       <div className="grid gap-6 max-w-2xl">
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Building2 className="w-5 h-5" />
               Business Information
             </CardTitle>
           </CardHeader>
           <CardContent>
             <form
               onSubmit={(e) => {
                 e.preventDefault();
                 updateProfile.mutate();
               }}
               className="space-y-4"
             >
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Business Name</Label>
                   <Input
                     value={businessName}
                     onChange={(e) => setBusinessName(e.target.value)}
                     required
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>ABN</Label>
                   <Input
                     value={abn}
                     onChange={(e) => setAbn(e.target.value)}
                     placeholder="XX XXX XXX XXX"
                   />
                 </div>
               </div>
 
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Contact Name</Label>
                   <div className="relative">
                     <Input
                       value={contactName}
                       onChange={(e) => setContactName(e.target.value)}
                       required
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label>Contact Email</Label>
                   <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       type="email"
                       value={contactEmail}
                       onChange={(e) => setContactEmail(e.target.value)}
                       className="pl-10"
                       required
                     />
                   </div>
                 </div>
               </div>
 
               <div className="space-y-2">
                 <Label>Phone</Label>
                 <div className="relative">
                   <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                   <Input
                     type="tel"
                     value={contactPhone}
                     onChange={(e) => setContactPhone(e.target.value)}
                     className="pl-10"
                     placeholder="04XX XXX XXX"
                   />
                 </div>
               </div>
 
               <div className="space-y-2">
                 <Label>Address</Label>
                 <Textarea
                   value={address}
                   onChange={(e) => setAddress(e.target.value)}
                   placeholder="123 Business St, Sydney NSW"
                   rows={2}
                 />
               </div>
 
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Postcode</Label>
                   <div className="relative">
                     <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                     <Input
                       value={postcode}
                       onChange={(e) => setPostcode(e.target.value)}
                       className="pl-10"
                       placeholder="2000"
                     />
                   </div>
                 </div>
                 <div className="space-y-2">
                   <Label>Delivery Areas (postcodes, comma-separated)</Label>
                   <Input
                     value={deliveryAreas}
                     onChange={(e) => setDeliveryAreas(e.target.value)}
                     placeholder="2000, 2010, 2020"
                   />
                 </div>
               </div>
 
               <Button type="submit" disabled={updateProfile.isPending}>
                 {updateProfile.isPending ? "Saving..." : "Save Changes"}
               </Button>
             </form>
           </CardContent>
         </Card>
       </div>
     </div>
   );
 };
 
 export default VendorSettings;