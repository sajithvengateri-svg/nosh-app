import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Mail, Lock, User, Gift, Building2, Loader2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import chefLogo from "@/assets/chefos-logo-new.png";
import { haptic } from "@/lib/haptics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { SEO } from "@/lib/seoConfig";

const SocialLoginButtons = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const handleOAuth = async (provider: "google" | "apple") => {
    const setLoading = provider === "google" ? setGoogleLoading : setAppleLoading;
    setLoading(true);
    haptic("medium");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) {
        toast.error(`Sign in with ${provider} failed: ${error.message}`);
        haptic("error");
      }
    } catch (error: any) {
      toast.error(`Sign in with ${provider} failed`);
      haptic("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-3"
        onClick={() => handleOAuth("google")}
        disabled={googleLoading || appleLoading}
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        )}
        Continue with Google
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full h-11 gap-3"
        onClick={() => handleOAuth("apple")}
        disabled={googleLoading || appleLoading}
      >
        {appleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
        )}
        Continue with Apple
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>
    </div>
  );
};

const Auth = () => {
  useSEO(SEO["/auth"]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [verifyEmailAddress, setVerifyEmailAddress] = useState("");

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupOrgName, setSignupOrgName] = useState("");

  // Detect mode and signup source
  const isHomeCook = searchParams.get("mode") === "home_cook";
  const signupSource = searchParams.get("source") || undefined;
  const defaultTab = searchParams.get("tab") || (referralCode ? "signup" : "login");

  // Derive store_mode from source/mode params
  const isFoodSafetySource = signupSource?.includes("food_safety") ?? false;
  const derivedStoreMode = isHomeCook
    ? "home_cook"
    : isFoodSafetySource
    ? "food_safety"
    : undefined;

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  // Check for referral code in URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      // Use public view to validate code exists (doesn't expose user_id)
      supabase
        .from("referral_codes_public" as any)
        .select("code")
        .eq("code", ref)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setReferrerName("a friend");
          }
        });
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic("medium");
    setIsLoading(true);
    setLoginError(null);
    try {
      await signIn(loginEmail, loginPassword);
      haptic("success");
      navigate("/dashboard");
    } catch (error: any) {
      haptic("error");
      const msg = error?.message || "Invalid login credentials";
      setLoginError(
        msg.includes("Invalid login credentials")
          ? "Incorrect email or password. Please try again."
          : msg
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    haptic("medium");
    setIsLoading(true);
    setSignupError(null);
    try {
      await signUp(signupEmail, signupPassword, signupName, signupOrgName, derivedStoreMode, signupSource);
      haptic("success");
      setVerifyEmailAddress(signupEmail);
      setShowVerifyEmail(true);
    } catch (error: any) {
      haptic("error");
      const msg = error?.message || "Something went wrong. Please try again.";
      setSignupError(
        msg.includes("User already registered")
          ? "An account with this email already exists. Please log in instead."
          : msg
      );
      console.error("Signup error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerifyEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-display">Check Your Email</CardTitle>
            <CardDescription className="mt-2">
              We've sent a verification link to <strong className="text-foreground">{verifyEmailAddress}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Click the link in the email to verify your account and get started. The link expires in 24 hours.
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowVerifyEmail(false);
                  setVerifyEmailAddress("");
                }}
              >
                Back to Login
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Didn't receive it? Check your spam folder or try signing up again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to={isHomeCook ? "/home-cook" : "/"} className="flex justify-center mb-4">
            <img src={chefLogo} alt="ChefOS logo" className="w-16 h-16 rounded-2xl shadow-md hover:shadow-lg transition-shadow" />
          </Link>
          <CardTitle className="text-2xl font-display">{isHomeCook ? "ChefOS Home" : "ChefOS"}</CardTitle>
          <CardDescription>{isHomeCook ? "Home Kitchen Organiser" : "Kitchen Management System"}</CardDescription>
          {referralCode && (
            <div className="mt-3">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                <Gift className="w-3.5 h-3.5" />
                {referrerName
                  ? `Invited by ${referrerName}`
                  : `Referral: ${referralCode}`}
              </Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <div className="mt-4 space-y-4">
                <SocialLoginButtons />
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-email" type="email" placeholder="chef@kitchen.com" className="pl-10" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-password" type="password" placeholder="••••••••" className="pl-10" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                    </div>
                  </div>
                  {loginError && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-start gap-2">
                      <span className="mt-0.5">⚠️</span>
                      <span>{loginError}</span>
                    </div>
                  )}
                  <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Sign In"}
                    </Button>
                  </motion.div>
                  <button
                    type="button"
                    onClick={() => navigate("/reset-password")}
                    className="text-xs text-primary hover:underline w-full text-center mt-2"
                  >
                    Forgot password?
                  </button>
                </form>
              </div>
            </TabsContent>

            <TabsContent value="signup">
              <div className="mt-4 space-y-4">
                <SocialLoginButtons />
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-org">{isHomeCook ? "Your Kitchen Name" : "Kitchen / Restaurant Name"}</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-org" type="text" placeholder={isHomeCook ? "Sarah's Kitchen" : "Ramsay's Kitchen"} className="pl-10" value={signupOrgName} onChange={(e) => setSignupOrgName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Your Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-name" type="text" placeholder="Gordon Ramsay" className="pl-10" value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-email" type="email" placeholder="chef@kitchen.com" className="pl-10" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-password" type="password" placeholder="••••••••" className="pl-10" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required minLength={6} />
                    </div>
                  </div>
                  {referralCode && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                      <Gift className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Referral code: <strong>{referralCode}</strong>
                      </span>
                    </div>
                  )}
                  {signupError && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive flex items-start gap-2">
                      <span className="mt-0.5">⚠️</span>
                      <span>{signupError}</span>
                    </div>
                  )}
                  <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account...</> : "Create Account"}
                    </Button>
                  </motion.div>
                  <p className="text-xs text-muted-foreground text-center">
                    You'll be set up as Owner & Head Chef of your organisation
                  </p>
                </form>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
