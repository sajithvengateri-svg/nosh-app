 import { useState } from "react";
 import { motion } from "framer-motion";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { useVendorAuth } from "@/hooks/useVendorAuth";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { MessageSquare, Send, User } from "lucide-react";
 import { toast } from "sonner";
 import { format } from "date-fns";
 
 const VendorMessages = () => {
   const { vendorProfile, user } = useVendorAuth();
   const queryClient = useQueryClient();
   const [selectedChat, setSelectedChat] = useState<string | null>(null);
   const [newMessage, setNewMessage] = useState("");
 
   // Get unique conversations
   const { data: conversations, isLoading } = useQuery({
     queryKey: ["vendor-conversations", vendorProfile?.id],
     queryFn: async () => {
       if (!vendorProfile) return [];
       const { data } = await supabase
         .from("vendor_messages")
         .select("chef_user_id, message, created_at, read_at, sender_type")
         .eq("vendor_id", vendorProfile.id)
         .order("created_at", { ascending: false });
       
       // Group by chef_user_id to get unique conversations
       const grouped = new Map();
       data?.forEach((msg) => {
         if (!grouped.has(msg.chef_user_id)) {
           grouped.set(msg.chef_user_id, msg);
         }
       });
       return Array.from(grouped.values());
     },
     enabled: !!vendorProfile,
   });
 
   // Get messages for selected conversation
   const { data: messages } = useQuery({
     queryKey: ["vendor-chat-messages", vendorProfile?.id, selectedChat],
     queryFn: async () => {
       if (!vendorProfile || !selectedChat) return [];
       const { data } = await supabase
         .from("vendor_messages")
         .select("*")
         .eq("vendor_id", vendorProfile.id)
         .eq("chef_user_id", selectedChat)
         .order("created_at", { ascending: true });
       return data || [];
     },
     enabled: !!vendorProfile && !!selectedChat,
   });
 
   const sendMessage = useMutation({
     mutationFn: async () => {
       if (!vendorProfile || !selectedChat || !user) return;
       const { error } = await supabase
         .from("vendor_messages")
         .insert({
           vendor_id: vendorProfile.id,
           chef_user_id: selectedChat,
           sender_id: user.id,
           sender_type: "vendor",
           message: newMessage,
         });
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["vendor-chat-messages"] });
       queryClient.invalidateQueries({ queryKey: ["vendor-conversations"] });
       setNewMessage("");
     },
     onError: () => {
       toast.error("Failed to send message");
     },
   });
 
   return (
     <div className="p-6 lg:p-8 h-[calc(100vh-2rem)]">
       <motion.div
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         className="mb-6"
       >
         <h1 className="text-3xl font-bold flex items-center gap-3">
           <MessageSquare className="w-8 h-8 text-primary" />
           Messages
         </h1>
         <p className="text-muted-foreground mt-1">
           Chat with chefs about orders and inquiries
         </p>
       </motion.div>
 
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100%-5rem)]">
         {/* Conversations List */}
         <Card className="lg:col-span-1">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm">Conversations</CardTitle>
           </CardHeader>
           <CardContent className="p-0">
             <ScrollArea className="h-[400px] lg:h-[500px]">
               {isLoading ? (
                 <div className="p-4 text-center text-muted-foreground">Loading...</div>
               ) : conversations && conversations.length > 0 ? (
                 conversations.map((conv) => (
                   <button
                     key={conv.chef_user_id}
                     onClick={() => setSelectedChat(conv.chef_user_id)}
                     className={`w-full p-4 text-left border-b hover:bg-muted transition-colors ${
                       selectedChat === conv.chef_user_id ? "bg-muted" : ""
                     }`}
                   >
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                         <User className="w-5 h-5 text-primary" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="font-medium truncate">
                           Chef {conv.chef_user_id.slice(0, 8)}...
                         </p>
                         <p className="text-sm text-muted-foreground truncate">
                           {conv.message}
                         </p>
                       </div>
                     </div>
                   </button>
                 ))
               ) : (
                 <div className="p-4 text-center text-muted-foreground">
                   No conversations yet
                 </div>
               )}
             </ScrollArea>
           </CardContent>
         </Card>
 
         {/* Chat Area */}
         <Card className="lg:col-span-2">
           <CardContent className="p-4 h-full flex flex-col">
             {selectedChat ? (
               <>
                 <ScrollArea className="flex-1 pr-4">
                   <div className="space-y-4">
                     {messages?.map((msg) => (
                       <div
                         key={msg.id}
                         className={`flex ${msg.sender_type === "vendor" ? "justify-end" : "justify-start"}`}
                       >
                         <div
                           className={`max-w-[70%] rounded-lg p-3 ${
                             msg.sender_type === "vendor"
                               ? "bg-primary text-primary-foreground"
                               : "bg-muted"
                           }`}
                         >
                           <p className="text-sm">{msg.message}</p>
                           <p className="text-xs opacity-70 mt-1">
                             {format(new Date(msg.created_at), "HH:mm")}
                           </p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </ScrollArea>
                 <form
                   onSubmit={(e) => {
                     e.preventDefault();
                     if (newMessage.trim()) {
                       sendMessage.mutate();
                     }
                   }}
                   className="flex gap-2 pt-4 border-t mt-4"
                 >
                   <Input
                     value={newMessage}
                     onChange={(e) => setNewMessage(e.target.value)}
                     placeholder="Type a message..."
                     className="flex-1"
                   />
                   <Button type="submit" disabled={sendMessage.isPending}>
                     <Send className="w-4 h-4" />
                   </Button>
                 </form>
               </>
             ) : (
               <div className="flex-1 flex items-center justify-center text-muted-foreground">
                 Select a conversation to start messaging
               </div>
             )}
           </CardContent>
         </Card>
       </div>
     </div>
   );
 };
 
 export default VendorMessages;