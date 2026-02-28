 import { motion } from "framer-motion";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Megaphone, Mail, Bell, Send } from "lucide-react";
 
 const AdminMarketing = () => {
   return (
     <div className="space-y-6">
       <div>
         <h1 className="text-3xl font-bold flex items-center gap-3">
           <Megaphone className="w-8 h-8 text-primary" />
           Marketing
         </h1>
         <p className="text-muted-foreground mt-1">
           Email campaigns and push notifications
         </p>
       </div>
 
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
         >
           <Card className="h-full">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Mail className="w-5 h-5 text-primary" />
                 Email Campaigns
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <p className="text-muted-foreground">
                 Create and send email campaigns to users and vendors
               </p>
               <Button disabled>
                 <Send className="w-4 h-4 mr-2" />
                 Coming Soon
               </Button>
             </CardContent>
           </Card>
         </motion.div>
 
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.05 }}
         >
           <Card className="h-full">
             <CardHeader>
               <CardTitle className="flex items-center gap-2">
                 <Bell className="w-5 h-5 text-primary" />
                 Push Notifications
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <p className="text-muted-foreground">
                 Send push notifications to mobile app users
               </p>
               <Button disabled>
                 <Send className="w-4 h-4 mr-2" />
                 Coming Soon
               </Button>
             </CardContent>
           </Card>
         </motion.div>
       </div>
     </div>
   );
 };
 
 export default AdminMarketing;