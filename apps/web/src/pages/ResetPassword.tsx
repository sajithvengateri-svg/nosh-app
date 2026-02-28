import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Lock, ArrowLeft, ChefHat, CheckCircle, Mail } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Determine mode: "request" (enter email) or "update" (set new password)
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // If we have a recovery token in the URL hash, switch to update mode
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setMode("update");
    }
  }, []);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setEmailSent(true);
      toast.success("Password reset link sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully!");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  const portalPath = searchParams.get("portal") === "admin" ? "/admin/auth" : "/auth";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
              <ChefHat className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-display">
            {mode === "request" ? "Reset Password" : "Set New Password"}
          </CardTitle>
          <CardDescription>
            {mode === "request"
              ? "Enter your email to receive a reset link"
              : "Choose a new password for your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "request" && !emailSent && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="chef@kitchen.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2"
                onClick={() => navigate(portalPath)}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Button>
            </form>
          )}

          {mode === "request" && emailSent && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-primary mx-auto" />
              <p className="text-muted-foreground">
                Check your email for a password reset link. It may take a few minutes.
              </p>
              <Button
                variant="ghost"
                className="w-full gap-2"
                onClick={() => navigate(portalPath)}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Button>
            </div>
          )}

          {mode === "update" && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
