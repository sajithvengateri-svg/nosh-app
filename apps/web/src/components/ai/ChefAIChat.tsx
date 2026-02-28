 import { useState, useRef, useEffect } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { 
   Bot, 
   X, 
   Send, 
   Loader2,
   ChefHat,
   Sparkles,
   HelpCircle
 } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { useAppSettings } from "@/hooks/useAppSettings";
 import { supabase } from "@/integrations/supabase/client";
 import ReactMarkdown from "react-markdown";
 
 interface Message {
   id: string;
   role: "user" | "assistant";
   content: string;
 }
 
 const SUGGESTED_QUESTIONS = [
   "What temp should I cook chicken to?",
   "How do I scale a recipe for 50 people?",
   "What can I substitute for heavy cream?",
   "How do I use the prep list feature?",
 ];
 
 const ChefAIChat = () => {
   const { settings } = useAppSettings();
   const [isOpen, setIsOpen] = useState(false);
   const [messages, setMessages] = useState<Message[]>([]);
   const [input, setInput] = useState("");
   const [isLoading, setIsLoading] = useState(false);
   const scrollRef = useRef<HTMLDivElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
 
   const scrollToBottom = () => {
     if (scrollRef.current) {
       scrollRef.current.scrollIntoView({ behavior: "smooth" });
     }
   };
 
   useEffect(() => {
     scrollToBottom();
   }, [messages]);
 
   useEffect(() => {
     if (isOpen && inputRef.current) {
       inputRef.current.focus();
     }
   }, [isOpen]);
 
   // Don't render if AI chat is disabled
   if (!settings.aiLlmEnabled) {
     return null;
   }
 
   const sendMessage = async (messageText: string) => {
     if (!messageText.trim() || isLoading) return;
 
     const userMessage: Message = {
       id: Date.now().toString(),
       role: "user",
       content: messageText.trim(),
     };
 
     setMessages((prev) => [...prev, userMessage]);
     setInput("");
     setIsLoading(true);
 
     try {
       const { data, error } = await supabase.functions.invoke("chef-ai-chat", {
         body: {
           messages: [...messages, userMessage].map((m) => ({
             role: m.role,
             content: m.content,
           })),
         },
       });
 
       if (error) throw error;
 
       const assistantMessage: Message = {
         id: (Date.now() + 1).toString(),
         role: "assistant",
         content: data.content || "I apologize, but I couldn't process that request. Please try again.",
       };
 
       setMessages((prev) => [...prev, assistantMessage]);
     } catch (error) {
       console.error("Chef AI error:", error);
       const errorMessage: Message = {
         id: (Date.now() + 1).toString(),
         role: "assistant",
         content: "Sorry, I'm having trouble connecting. Please check your connection and try again.",
       };
       setMessages((prev) => [...prev, errorMessage]);
     } finally {
       setIsLoading(false);
     }
   };
 
   const handleSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     sendMessage(input);
   };
 
   return (
     <>
       {/* Floating Button */}
       <AnimatePresence>
         {!isOpen && (
           <motion.div
             initial={{ scale: 0, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ scale: 0, opacity: 0 }}
             className="fixed bottom-20 right-4 z-50 md:bottom-6"
           >
             <Button
               onClick={() => setIsOpen(true)}
               size="lg"
               className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
             >
               <ChefHat className="w-6 h-6" />
             </Button>
             <span className="absolute -top-1 -right-1 flex h-4 w-4">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
               <span className="relative inline-flex rounded-full h-4 w-4 bg-accent items-center justify-center">
                 <Sparkles className="w-2.5 h-2.5 text-accent-foreground" />
               </span>
             </span>
           </motion.div>
         )}
       </AnimatePresence>
 
       {/* Chat Panel */}
       <AnimatePresence>
         {isOpen && (
           <motion.div
             initial={{ opacity: 0, y: 20, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             exit={{ opacity: 0, y: 20, scale: 0.95 }}
             className="fixed bottom-20 right-4 left-4 z-50 md:bottom-6 md:left-auto md:w-96"
           >
             <div className="bg-background border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
               {/* Header */}
               <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                 <div className="flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-primary/10">
                     <ChefHat className="w-5 h-5 text-primary" />
                   </div>
                   <div>
                     <h3 className="font-semibold text-foreground">Chef AI</h3>
                     <p className="text-xs text-muted-foreground">Kitchen assistant</p>
                   </div>
                 </div>
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={() => setIsOpen(false)}
                 >
                   <X className="w-4 h-4" />
                 </Button>
               </div>
 
               {/* Messages */}
               <ScrollArea className="flex-1 p-4 min-h-[300px]">
                 {messages.length === 0 ? (
                   <div className="space-y-4">
                     <div className="text-center py-4">
                       <Bot className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                       <p className="text-sm text-muted-foreground">
                         Ask me anything about recipes, food safety, inventory, or how to use ChefOS!
                       </p>
                     </div>
                     <div className="space-y-2">
                       <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                         <HelpCircle className="w-3 h-3" />
                         Try asking:
                       </p>
                       {SUGGESTED_QUESTIONS.map((q, i) => (
                         <button
                           key={i}
                           onClick={() => sendMessage(q)}
                           className="w-full text-left text-sm p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                         >
                           {q}
                         </button>
                       ))}
                     </div>
                   </div>
                 ) : (
                   <div className="space-y-4">
                     {messages.map((message) => (
                       <div
                         key={message.id}
                         className={`flex ${
                           message.role === "user" ? "justify-end" : "justify-start"
                         }`}
                       >
                         <div
                           className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                             message.role === "user"
                               ? "bg-primary text-primary-foreground"
                               : "bg-muted"
                           }`}
                         >
                           {message.role === "assistant" ? (
                             <div className="prose prose-sm dark:prose-invert max-w-none">
                               <ReactMarkdown>{message.content}</ReactMarkdown>
                             </div>
                           ) : (
                             <p className="text-sm">{message.content}</p>
                           )}
                         </div>
                       </div>
                     ))}
                     {isLoading && (
                       <div className="flex justify-start">
                         <div className="bg-muted rounded-2xl px-4 py-3">
                           <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                         </div>
                       </div>
                     )}
                     <div ref={scrollRef} />
                   </div>
                 )}
               </ScrollArea>
 
               {/* Input */}
               <form onSubmit={handleSubmit} className="p-3 border-t bg-muted/20">
                 <div className="flex gap-2">
                   <Input
                     ref={inputRef}
                     value={input}
                     onChange={(e) => setInput(e.target.value)}
                     placeholder="Ask Chef AI..."
                     disabled={isLoading}
                     className="flex-1"
                   />
                   <Button
                     type="submit"
                     size="icon"
                     disabled={!input.trim() || isLoading}
                   >
                     <Send className="w-4 h-4" />
                   </Button>
                 </div>
                 <p className="text-xs text-muted-foreground text-center mt-2">
                   Each message uses AI credits
                 </p>
               </form>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
     </>
   );
 };
 
 export default ChefAIChat;