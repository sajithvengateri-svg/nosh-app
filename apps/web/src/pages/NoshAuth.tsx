import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Mail, Lock, User, Gift, Loader2, CheckCircle2, Wrench } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { haptic } from "@/lib/haptics";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordStrengthMeter } from "@/components/landing/PasswordStrengthMeter";
import noshLogo from "@/assets/nosh-logo.png";

const NOSH = {
  primary: "#D94878",
  primaryDark: "#C13B68",
  secondary: "#2A1F2D",
  bg: "#FBF6F8",
  card: "#FDFBFC",
  border: "rgba(232,221,226,0.5)",
  muted: "#7A6B75",
  textMuted: "#A89DA3",
};

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

function friendlyError(msg: string): string {
  if (msg.includes("Invalid login credentials"))
    return "That email/password combination didn't work. Double-check and try again.";
  if (msg.includes("User already registered"))
    return "Looks like you already have an account! Try logging in instead.";
  if (msg.includes("Email not confirmed"))
    return "Please verify your email first. Check your inbox for a verification link.";
  if (msg.includes("rate limit") || msg.includes("too many"))
    return "Too many attempts. Please wait a moment and try again.";
  return msg;
}

const inputClass =
  "w-full h-11 pl-10 pr-4 rounded-full text-sm outline-none transition-all bg-white border focus:ring-2 focus:ring-[#D94878]/20 focus:border-[#D94878]";

const NoshSocialLoginButtons = () => {
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
          redirectTo: `${window.location.origin}/nosh/welcome`,
        },
      });
      if (error) {
        toast.error(`Sign in with ${provider} failed: ${error.message}`);
        haptic("error");
      }
    } catch {
      toast.error(`Sign in with ${provider} failed`);
      haptic("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={googleLoading || appleLoading}
        className="w-full h-11 flex items-center justify-center gap-3 rounded-full text-sm font-medium transition-all hover:shadow-md"
        style={{ background: "#fff", border: `1px solid ${NOSH.border}`, color: NOSH.secondary }}
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
      </button>

      <button
        type="button"
        onClick={() => handleOAuth("apple")}
        disabled={googleLoading || appleLoading}
        className="w-full h-11 flex items-center justify-center gap-3 rounded-full text-sm font-medium transition-all hover:shadow-md"
        style={{ background: "#fff", border: `1px solid ${NOSH.border}`, color: NOSH.secondary }}
      >
        {appleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
        )}
        Continue with Apple
      </button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full" style={{ borderTop: `1px solid ${NOSH.border}` }} />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-2" style={{ background: NOSH.card, color: NOSH.textMuted }}>or</span>
        </div>
      </div>
    </div>
  );
};

const formVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction > 0 ? 20 : -20 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction > 0 ? -20 : 20 }),
};

const NoshAuth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "signup">(
    searchParams.get("tab") === "signup" || searchParams.get("ref") ? "signup" : "login"
  );
  const [direction, setDirection] = useState(0);
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

  const signupSource = searchParams.get("source") || "nosh";

  const switchTab = (tab: "login" | "signup") => {
    setDirection(tab === "signup" ? 1 : -1);
    setActiveTab(tab);
    setLoginError(null);
    setSignupError(null);
  };

  useEffect(() => {
    if (user) {
      navigate("/nosh/welcome", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      supabase
        .from("referral_codes_public" as any)
        .select("code")
        .eq("code", ref)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setReferrerName("a friend");
        });
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const result = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!result.success) {
      setLoginError(result.error.errors[0].message);
      return;
    }

    haptic("medium");
    setIsLoading(true);
    try {
      await signIn(loginEmail, loginPassword);
      haptic("success");
      navigate("/nosh/welcome");
    } catch (error: any) {
      haptic("error");
      setLoginError(friendlyError(error?.message || "Something went wrong. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    const result = signupSchema.safeParse({ name: signupName, email: signupEmail, password: signupPassword });
    if (!result.success) {
      setSignupError(result.error.errors[0].message);
      return;
    }

    haptic("medium");
    setIsLoading(true);
    try {
      await signUp(signupEmail, signupPassword, signupName, signupName + "'s Kitchen", "home_cook", signupSource);
      haptic("success");
      setVerifyEmailAddress(signupEmail);
      setShowVerifyEmail(true);
    } catch (error: any) {
      haptic("error");
      setSignupError(friendlyError(error?.message || "Something went wrong. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  if (showVerifyEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: NOSH.bg }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 30 }}
          className="w-full max-w-md rounded-[20px] p-8 text-center"
          style={{ background: NOSH.card, border: `1px solid ${NOSH.border}`, boxShadow: "0 20px 60px rgba(217,72,120,0.08), 0 4px 12px rgba(0,0,0,0.04)" }}
        >
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${NOSH.primary}15` }}>
              <CheckCircle2 className="w-8 h-8" style={{ color: NOSH.primary }} />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: NOSH.secondary, fontFamily: "'Playfair Display', serif" }}>Check your email</h2>
          <p className="text-sm mb-6" style={{ color: NOSH.muted }}>
            We've sent a verification link to <strong style={{ color: NOSH.secondary }}>{verifyEmailAddress}</strong>
          </p>
          <p className="text-sm mb-6" style={{ color: NOSH.textMuted }}>
            Click the link in the email to verify your account and get started. The link expires in 24 hours.
          </p>
          <button
            onClick={() => { setShowVerifyEmail(false); setVerifyEmailAddress(""); switchTab("login"); }}
            className="w-full py-3 rounded-full text-sm font-semibold transition-all hover:shadow-md"
            style={{ background: "#fff", border: `1px solid ${NOSH.border}`, color: NOSH.secondary }}
          >
            Back to Login
          </button>
          <p className="text-xs mt-4" style={{ color: NOSH.textMuted }}>
            Didn't receive it? Check your spam folder or try signing up again.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: NOSH.bg }}>
      {/* Background glow */}
      <div
        className="fixed top-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${NOSH.primary}06 0%, transparent 70%)` }}
      />
      <div
        className="fixed bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, rgba(200,180,220,0.06) 0%, transparent 70%)` }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="relative w-full max-w-md rounded-[20px] overflow-hidden"
        style={{
          background: NOSH.card,
          border: `1px solid ${NOSH.border}`,
          boxShadow: "0 20px 60px rgba(217,72,120,0.08), 0 4px 12px rgba(0,0,0,0.04)",
        }}
      >
        {/* Header */}
        <div className="text-center pt-8 pb-4 px-8">
          <div
            className="inline-block mb-3 cursor-pointer select-none"
            onClick={handleLogoTap}
          >
            <img src={noshLogo} alt="Prep Mi" className="w-20 h-20 rounded-2xl shadow-md mx-auto" />
          </div>
          <p className="text-xl font-bold" style={{ color: NOSH.primary, letterSpacing: "6px" }}>Prep Mi</p>
          <p className="text-sm mt-1" style={{ color: NOSH.muted }}>Cook smarter. Eat better.</p>
          {showDev && (
            <button
              onClick={async () => {
                setIsLoading(true);
                try {
                  await signIn("admin@chefos.app", "ChefOS2026x");
                  navigate("/nosh/welcome");
                } catch {
                  toast.error("Dev login failed");
                } finally {
                  setIsLoading(false);
                }
              }}
              className="mt-3 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ background: "#5BA37A15", color: "#5BA37A", border: "1px solid #5BA37A40" }}
            >
              {isLoading ? "Logging in..." : "Dev Access"}
            </button>
          )}
          {referralCode && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs" style={{ background: `${NOSH.primary}10`, color: NOSH.primary }}>
              <Gift className="w-3.5 h-3.5" />
              {referrerName ? `Invited by ${referrerName}` : `Referral: ${referralCode}`}
            </div>
          )}
        </div>

        {/* Tab Toggle with sliding indicator */}
        <div className="px-8 pb-4">
          <div className="relative flex rounded-full p-0.5" style={{ background: NOSH.border }}>
            <motion.div
              className="absolute top-0.5 bottom-0.5 rounded-full"
              style={{ background: NOSH.primary, width: "calc(50% - 2px)" }}
              animate={{ left: activeTab === "login" ? "2px" : "calc(50% + 2px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
            <button
              onClick={() => switchTab("login")}
              className="relative z-10 flex-1 py-2 rounded-full text-xs font-semibold transition-colors"
              style={{ color: activeTab === "login" ? "#fff" : NOSH.muted }}
            >
              Login
            </button>
            <button
              onClick={() => switchTab("signup")}
              className="relative z-10 flex-1 py-2 rounded-full text-xs font-semibold transition-colors"
              style={{ color: activeTab === "signup" ? "#fff" : NOSH.muted }}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form Content with animated transitions */}
        <div className="px-8 pb-8">
          <NoshSocialLoginButtons />

          <AnimatePresence mode="wait" custom={direction}>
            {activeTab === "login" ? (
              <motion.form
                key="login"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="nosh-login-email" className="text-xs font-medium" style={{ color: NOSH.secondary }}>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: NOSH.textMuted }} />
                    <input
                      id="nosh-login-email"
                      type="email"
                      placeholder="you@email.com"
                      className={inputClass}
                      style={{ borderColor: NOSH.border, color: NOSH.secondary }}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nosh-login-password" className="text-xs font-medium" style={{ color: NOSH.secondary }}>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: NOSH.textMuted }} />
                    <input
                      id="nosh-login-password"
                      type="password"
                      placeholder="Your password"
                      className={inputClass}
                      style={{ borderColor: NOSH.border, color: NOSH.secondary }}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {loginError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl px-4 py-3 text-sm flex items-start gap-2 overflow-hidden"
                      style={{ background: "#FEE2E2", color: "#DC2626" }}
                    >
                      <span className="shrink-0 mt-0.5 text-xs">!</span>
                      <span>{loginError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${NOSH.primary}, ${NOSH.primaryDark})` }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in...
                      </span>
                    ) : "Sign In"}
                  </button>
                </motion.div>
                <button
                  type="button"
                  onClick={() => navigate("/reset-password?source=nosh")}
                  className="text-xs w-full text-center mt-2 hover:underline"
                  style={{ color: NOSH.primary }}
                >
                  Forgot password?
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}
                onSubmit={handleSignup}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="nosh-signup-name" className="text-xs font-medium" style={{ color: NOSH.secondary }}>Your Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: NOSH.textMuted }} />
                    <input
                      id="nosh-signup-name"
                      type="text"
                      placeholder="Your name"
                      className={inputClass}
                      style={{ borderColor: NOSH.border, color: NOSH.secondary }}
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nosh-signup-email" className="text-xs font-medium" style={{ color: NOSH.secondary }}>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: NOSH.textMuted }} />
                    <input
                      id="nosh-signup-email"
                      type="email"
                      placeholder="you@email.com"
                      className={inputClass}
                      style={{ borderColor: NOSH.border, color: NOSH.secondary }}
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nosh-signup-password" className="text-xs font-medium" style={{ color: NOSH.secondary }}>Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: NOSH.textMuted }} />
                    <input
                      id="nosh-signup-password"
                      type="password"
                      placeholder="8+ characters"
                      className={inputClass}
                      style={{ borderColor: NOSH.border, color: NOSH.secondary }}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </div>
                  <PasswordStrengthMeter password={signupPassword} />
                </div>

                {referralCode && (
                  <div className="flex items-center gap-2 p-3 rounded-xl text-sm" style={{ background: `${NOSH.primary}08`, border: `1px solid ${NOSH.primary}20` }}>
                    <Gift className="w-4 h-4" style={{ color: NOSH.primary }} />
                    <span style={{ color: NOSH.muted }}>
                      Referral code: <strong>{referralCode}</strong>
                    </span>
                  </div>
                )}

                <AnimatePresence>
                  {signupError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="rounded-xl px-4 py-3 text-sm flex items-start gap-2 overflow-hidden"
                      style={{ background: "#FEE2E2", color: "#DC2626" }}
                    >
                      <span className="shrink-0 mt-0.5 text-xs">!</span>
                      <span>{signupError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-50 hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${NOSH.primary}, ${NOSH.primaryDark})` }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating account...
                      </span>
                    ) : "Create Account"}
                  </button>
                </motion.div>
                <p className="text-xs text-center" style={{ color: NOSH.textMuted }}>
                  Start discovering recipes, deals & more
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Admin spanner */}
        <div
          className="flex items-center justify-center gap-1.5 py-3 cursor-pointer transition-all hover:opacity-70"
          style={{ borderTop: `1px solid ${NOSH.border}` }}
          onClick={() => navigate("/nosh/admin")}
        >
          <Wrench className="w-3 h-3" style={{ color: NOSH.textMuted }} strokeWidth={1.5} />
          <span className="text-[11px]" style={{ color: NOSH.textMuted, letterSpacing: "0.5px" }}>Admin</span>
        </div>
      </motion.div>
    </div>
  );
};

export default NoshAuth;
