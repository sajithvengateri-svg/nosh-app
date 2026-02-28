 import { useState, useEffect, useRef, useCallback } from "react";
 import { useNavigate } from "react-router-dom";
 import { motion } from "framer-motion";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { useVendorAuth } from "@/hooks/useVendorAuth";
 import { Loader2, Building2, Mail, Lock, User } from "lucide-react";

 const VendorAuth = () => {
   const navigate = useNavigate();
   const { user, isVendor, signIn, signUp, loading } = useVendorAuth();
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Stealth dev access: tap logo 5 times within 3s
   const [showDev, setShowDev] = useState(false);
   const tapCount = useRef(0);
   const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
   const handleLogoTap = useCallback(() => {
     tapCount.current += 1;
     if (tapTimer.current) clearTimeout(tapTimer.current);
     if (tapCount.current >= 5) {
       setShowDev(true);
       tapCount.current = 0;
     } else {
       tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 3000);
     }
   }, []);
 
   // Login form state
   const [loginEmail, setLoginEmail] = useState("");
   const [loginPassword, setLoginPassword] = useState("");
 
   // Signup form state
   const [signupEmail, setSignupEmail] = useState("");
   const [signupPassword, setSignupPassword] = useState("");
   const [businessName, setBusinessName] = useState("");
   const [contactName, setContactName] = useState("");
 
   useEffect(() => {
     if (!loading && user && isVendor) {
       navigate("/vendor/dashboard");
     }
   }, [user, isVendor, loading, navigate]);
 
   const handleLogin = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSubmitting(true);
     try {
       await signIn(loginEmail, loginPassword);
      // Navigation happens in the effect once vendor profile is loaded
     } catch (error) {
       // Error handled in hook
     } finally {
       setIsSubmitting(false);
     }
   };
 
   const handleSignup = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSubmitting(true);
     try {
       await signUp(signupEmail, signupPassword, businessName, contactName);
     } catch (error) {
       // Error handled in hook
     } finally {
       setIsSubmitting(false);
     }
   };
 
   if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <Loader2 className="w-8 h-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
       <motion.div
         initial={{ opacity: 0, y: 20 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ duration: 0.5 }}
       >
         <Card className="w-full max-w-md border-border/50 shadow-xl">
           <CardHeader className="text-center pb-2">
             <div className="flex justify-center mb-4">
               <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center cursor-pointer select-none" onClick={handleLogoTap}>
                 <Building2 className="w-10 h-10 text-primary-foreground" />
               </div>
             </div>
             <CardTitle className="text-2xl font-bold">VendorOS</CardTitle>
             <CardDescription>Supplier Portal for ChefOS</CardDescription>
             {showDev && (
               <Button
                 size="sm"
                 variant="outline"
                 className="mt-2 text-xs border-emerald-500 text-emerald-500 hover:bg-emerald-500/10"
                 onClick={() => navigate("/vendor/dashboard")}
               >
                 SKIP AUTH (Dev)
               </Button>
             )}
           </CardHeader>
           <CardContent>
             <Tabs defaultValue="login" className="w-full">
               <TabsList className="grid w-full grid-cols-2">
                 <TabsTrigger value="login">Login</TabsTrigger>
                 <TabsTrigger value="signup">Sign Up</TabsTrigger>
               </TabsList>
 
               <TabsContent value="login">
                 <form onSubmit={handleLogin} className="space-y-4 mt-4">
                   <div className="space-y-2">
                     <Label htmlFor="login-email">Email</Label>
                     <div className="relative">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="login-email"
                         type="email"
                         placeholder="vendor@company.com"
                         className="pl-10"
                         value={loginEmail}
                         onChange={(e) => setLoginEmail(e.target.value)}
                         required
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="login-password">Password</Label>
                     <div className="relative">
                       <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="login-password"
                         type="password"
                         placeholder="••••••••"
                         className="pl-10"
                         value={loginPassword}
                         onChange={(e) => setLoginPassword(e.target.value)}
                         required
                       />
                     </div>
                   </div>
                   <Button type="submit" className="w-full" disabled={isSubmitting}>
                     {isSubmitting ? "Signing in..." : "Sign In"}
                   </Button>
                 </form>
               </TabsContent>
 
               <TabsContent value="signup">
                 <form onSubmit={handleSignup} className="space-y-4 mt-4">
                   <div className="space-y-2">
                     <Label htmlFor="business-name">Business Name</Label>
                     <div className="relative">
                       <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="business-name"
                         type="text"
                         placeholder="Acme Foods Pty Ltd"
                         className="pl-10"
                         value={businessName}
                         onChange={(e) => setBusinessName(e.target.value)}
                         required
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="contact-name">Contact Name</Label>
                     <div className="relative">
                       <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="contact-name"
                         type="text"
                         placeholder="John Smith"
                         className="pl-10"
                         value={contactName}
                         onChange={(e) => setContactName(e.target.value)}
                         required
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="signup-email">Email</Label>
                     <div className="relative">
                       <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="signup-email"
                         type="email"
                         placeholder="vendor@company.com"
                         className="pl-10"
                         value={signupEmail}
                         onChange={(e) => setSignupEmail(e.target.value)}
                         required
                       />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="signup-password">Password</Label>
                     <div className="relative">
                       <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                       <Input
                         id="signup-password"
                         type="password"
                         placeholder="••••••••"
                         className="pl-10"
                         value={signupPassword}
                         onChange={(e) => setSignupPassword(e.target.value)}
                         required
                         minLength={6}
                       />
                     </div>
                   </div>
                   <Button type="submit" className="w-full" disabled={isSubmitting}>
                     {isSubmitting ? "Creating account..." : "Create Vendor Account"}
                   </Button>
                   <p className="text-xs text-muted-foreground text-center">
                     Your account will be reviewed before activation
                   </p>
                 </form>
               </TabsContent>
             </Tabs>
           </CardContent>
         </Card>
       </motion.div>
     </div>
   );
 };
 
 export default VendorAuth;