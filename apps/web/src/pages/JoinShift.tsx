import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, CheckCircle2, XCircle, Clock } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  foh_admin: "FOH Admin",
  shift_manager: "Shift Manager",
  server: "Server",
  host: "Host",
};

const JoinShift = () => {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "valid" | "expired" | "used" | "error">("loading");
  const [tokenData, setTokenData] = useState<any>(null);

  useEffect(() => {
    if (!token) { setStatus("error"); return; }

    const validateToken = async () => {
      const { data, error } = await supabase
        .from("res_access_tokens")
        .select("*, organizations(name)")
        .eq("token", token)
        .single();

      if (error || !data) { setStatus("error"); return; }
      if (data.is_revoked) { setStatus("expired"); return; }
      if (data.used_at && data.used_by !== user?.id) { setStatus("used"); return; }
      if (new Date(data.expires_at) < new Date()) { setStatus("expired"); return; }

      setTokenData(data);
      setStatus("valid");
    };

    validateToken();
  }, [token, user]);

  const handleAccept = async () => {
    if (!user || !tokenData) return;

    // Mark token as used
    await supabase.from("res_access_tokens").update({
      used_at: new Date().toISOString(),
      used_by: user.id,
    }).eq("id", tokenData.id);

    // Check if user already has membership
    const { data: existing } = await supabase
      .from("org_memberships")
      .select("id")
      .eq("org_id", tokenData.org_id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Update existing membership role
      await supabase.from("org_memberships").update({
        role: tokenData.granted_role,
        is_active: true,
      }).eq("id", existing.id);
    } else {
      // Create new membership
      await supabase.from("org_memberships").insert({
        org_id: tokenData.org_id,
        user_id: user.id,
        role: tokenData.granted_role,
        is_active: true,
      });
    }

    navigate("/reservation/dashboard");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center space-y-4">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold">Sign in required</h2>
            <p className="text-sm text-muted-foreground">Please sign in to accept this shift access invitation.</p>
            <Button onClick={() => navigate(`/auth?shift_token=${token}`)}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        {status === "loading" && (
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Validating access token...</p>
          </CardContent>
        )}

        {status === "valid" && tokenData && (
          <>
            <CardHeader className="text-center">
              <Shield className="w-10 h-10 mx-auto text-primary mb-2" />
              <CardTitle>Shift Access Invitation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm">You've been granted access to</p>
                <p className="text-lg font-bold">{tokenData.organizations?.name || "Venue"}</p>
                <Badge className="text-sm">{ROLE_LABELS[tokenData.granted_role] || tokenData.granted_role}</Badge>
              </div>
              {tokenData.label && (
                <p className="text-sm text-muted-foreground text-center">{tokenData.label}</p>
              )}
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                Expires: {new Date(tokenData.expires_at).toLocaleString()}
              </div>
              <Button className="w-full" onClick={handleAccept}>
                <CheckCircle2 className="w-4 h-4 mr-2" /> Accept & Start Shift
              </Button>
            </CardContent>
          </>
        )}

        {status === "expired" && (
          <CardContent className="py-8 text-center space-y-3">
            <XCircle className="w-10 h-10 mx-auto text-red-500" />
            <h2 className="text-lg font-semibold">Token Expired</h2>
            <p className="text-sm text-muted-foreground">This access token has expired or been revoked. Ask your manager for a new one.</p>
          </CardContent>
        )}

        {status === "used" && (
          <CardContent className="py-8 text-center space-y-3">
            <XCircle className="w-10 h-10 mx-auto text-amber-500" />
            <h2 className="text-lg font-semibold">Already Used</h2>
            <p className="text-sm text-muted-foreground">This access token has already been claimed by another user.</p>
          </CardContent>
        )}

        {status === "error" && (
          <CardContent className="py-8 text-center space-y-3">
            <XCircle className="w-10 h-10 mx-auto text-red-500" />
            <h2 className="text-lg font-semibold">Invalid Token</h2>
            <p className="text-sm text-muted-foreground">This access link is not valid. Please check the URL or contact your manager.</p>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default JoinShift;
