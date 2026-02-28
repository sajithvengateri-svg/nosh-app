 import { motion } from "framer-motion";
 import { Bot, Mic, ScanLine, Sparkles, CreditCard } from "lucide-react";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 import { Separator } from "@/components/ui/separator";
 import { Badge } from "@/components/ui/badge";
 import { useAppSettings, AppSettings } from "@/hooks/useAppSettings";
 import { toast } from "sonner";
 
 const AISettings = () => {
   const { settings, updateSettings } = useAppSettings();
 
   const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
     updateSettings({ [key]: value });
     toast.success("AI setting updated");
   };
 
   return (
     <motion.div
       initial={{ opacity: 0, y: 10 }}
       animate={{ opacity: 1, y: 0 }}
       className="space-y-6"
     >
       {/* AI Credits Notice */}
       <Card className="border-primary/20 bg-primary/5">
         <CardContent className="pt-6">
           <div className="flex items-start gap-4">
             <div className="p-2 rounded-lg bg-primary/10">
               <CreditCard className="w-5 h-5 text-primary" />
             </div>
             <div className="flex-1">
               <h3 className="font-medium text-foreground">AI Features Use Credits</h3>
               <p className="text-sm text-muted-foreground mt-1">
                 AI features like chat, voice commands, and OCR scanning consume credits. 
                 Enable only what you need to optimize usage.
               </p>
             </div>
           </div>
         </CardContent>
       </Card>
 
       {/* LLM Chat */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Bot className="w-5 h-5" />
             Chef AI Assistant
             <Badge variant="secondary" className="ml-auto">
               <Sparkles className="w-3 h-3 mr-1" />
               Credits
             </Badge>
           </CardTitle>
           <CardDescription>
             Ask questions about recipes, food safety, inventory, and app usage
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="flex items-center justify-between">
             <div>
               <Label>Enable AI Chat</Label>
               <p className="text-sm text-muted-foreground">
                 Floating chat bubble for instant help
               </p>
             </div>
             <Switch
               checked={settings.aiLlmEnabled}
               onCheckedChange={(v) => handleSettingChange("aiLlmEnabled", v)}
             />
           </div>
 
           {settings.aiLlmEnabled && (
             <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
               <p className="font-medium text-foreground mb-1">What you can ask:</p>
               <ul className="list-disc list-inside space-y-1">
                 <li>Recipe substitutions, scaling, and techniques</li>
                 <li>HACCP, temps, storage times, cross-contamination</li>
                 <li>Inventory ordering and food cost optimization</li>
                 <li>How to use features in ChefOS</li>
               </ul>
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* Voice Control */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Mic className="w-5 h-5" />
             Voice Commands
             <Badge variant="secondary" className="ml-auto">
               <Sparkles className="w-3 h-3 mr-1" />
               Credits
             </Badge>
           </CardTitle>
           <CardDescription>
             Hands-free control for busy kitchen environments
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="flex items-center justify-between">
             <div>
               <Label>Enable Voice Control</Label>
               <p className="text-sm text-muted-foreground">
                 Use voice to navigate and control the app
               </p>
             </div>
             <Switch
               checked={settings.aiVoiceEnabled}
               onCheckedChange={(v) => handleSettingChange("aiVoiceEnabled", v)}
             />
           </div>
 
           {settings.aiVoiceEnabled && (
             <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
               <p className="font-medium text-foreground mb-1">Voice commands:</p>
               <ul className="list-disc list-inside space-y-1">
                 <li>"Open recipes" - Navigate to pages</li>
                 <li>"Next / Skip" - Navigate cards</li>
                 <li>"Start prep" - Trigger actions</li>
                 <li>"Show temp chart" - Quick lookups</li>
               </ul>
             </div>
           )}
         </CardContent>
       </Card>
 
       {/* OCR Scanning */}
       <Card>
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <ScanLine className="w-5 h-5" />
             Smart Scanning (OCR)
             <Badge variant="secondary" className="ml-auto">
               <Sparkles className="w-3 h-3 mr-1" />
               Credits
             </Badge>
           </CardTitle>
           <CardDescription>
             AI-powered document and image scanning
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-4">
           <div className="flex items-center justify-between">
             <div>
               <Label>Enable OCR Scanning</Label>
               <p className="text-sm text-muted-foreground">
                 Scan invoices, recipes, and labels
               </p>
             </div>
             <Switch
               checked={settings.aiOcrEnabled}
               onCheckedChange={(v) => handleSettingChange("aiOcrEnabled", v)}
             />
           </div>
 
           {settings.aiOcrEnabled && (
             <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
               <p className="font-medium text-foreground mb-1">What you can scan:</p>
               <ul className="list-disc list-inside space-y-1">
                 <li>Supplier invoices to auto-update inventory</li>
                 <li>Recipe cards and cookbook pages</li>
                 <li>Equipment labels and manuals</li>
                 <li>Cleaning verification photos</li>
               </ul>
             </div>
           )}
         </CardContent>
       </Card>
 
       <Separator />
 
       {/* Summary */}
       <div className="text-center text-sm text-muted-foreground">
         <p>
           {[settings.aiLlmEnabled, settings.aiVoiceEnabled, settings.aiOcrEnabled].filter(Boolean).length} of 3 AI features enabled
         </p>
       </div>
     </motion.div>
   );
 };
 
 export default AISettings;