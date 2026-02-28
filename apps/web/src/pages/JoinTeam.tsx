import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChefHat, Users, MapPin, ShieldCheck } from "lucide-react";

interface InviteDetails {
  invite_id: string;
  email: string;
  role: string;
  expires_at: string;
  accepted_at: string | null;
  org_id: string;
  org_name: string;
  org_logo_url: string | null;
  org_welcome_message: string | null;
  org_cover_image_url: string | null;
  inviter_name: string;
  venue_name: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  head_chef: "Head Chef",
  sous_chef: "Sous Chef",
  line_chef: "Line Chef",
  kitchen_hand: "Kitchen Hand",
  owner: "Owner",
  bar_manager: "Bar Manager",
  asst_bar_manager: "Asst Bar Manager",
  senior_bartender: "Senior Bartender",
  bartender: "Bartender",
  bar_back: "Bar-back",
  barista: "Barista",
};

const JoinTeam = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link");
      setLoading(false);
      return;
    }

    const fetchInvite = async () => {
      const { data, error: rpcError } = await supabase.rpc("get_invite_details", { _token: token });
      if (rpcError || !data?.length) {
        setError("This invite link is invalid or has expired.");
        setLoading(false);
        return;
      }
      setInvite(data[0] as unknown as InviteDetails);
      setLoading(false);
    };

    fetchInvite();
  }, [token]);

  const handleAccept = () => {
    navigate(`/auth?invite=${token}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <ChefHat className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold">Invite Not Found</h1>
            <p className="text-muted-foreground text-sm">
              {error || "This invite link is invalid or has expired."}
            </p>
            <Button variant="outline" onClick={() => navigate("/auth")}>
              Go to Sign Up
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleLabel = ROLE_LABELS[invite.role] || invite.role;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Cover image */}
      {invite.org_cover_image_url && (
        <div
          className="h-48 sm:h-56 bg-cover bg-center"
          style={{ backgroundImage: `url(${invite.org_cover_image_url})` }}
        />
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-8 pb-6 space-y-6">
            {/* Org logo + name */}
            <div className="text-center space-y-3">
              {invite.org_logo_url ? (
                <img
                  src={invite.org_logo_url}
                  alt={invite.org_name}
                  className="w-20 h-20 rounded-2xl mx-auto object-cover border"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <ChefHat className="w-10 h-10 text-primary" />
                </div>
              )}
              <h1 className="text-2xl font-bold">{invite.org_name || "Your Team"}</h1>
            </div>

            {/* Invitation message */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-foreground">
                <strong>{invite.inviter_name}</strong> has invited you to join
                {invite.org_name ? ` ${invite.org_name}` : " their team"} as:
              </p>
              <Badge variant="secondary" className="text-sm">
                {roleLabel}
              </Badge>
              {invite.venue_name && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{invite.venue_name}</span>
                </div>
              )}
            </div>

            {/* Custom welcome message */}
            {invite.org_welcome_message && (
              <p className="text-sm text-muted-foreground italic text-center">
                "{invite.org_welcome_message}"
              </p>
            )}

            {/* What you'll get */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                You'll get access to
              </p>
              <div className="grid grid-cols-1 gap-1.5 text-sm">
                {[
                  { icon: Users, text: "Prep lists & daily tasks" },
                  { icon: ChefHat, text: "Recipes & training materials" },
                  { icon: ShieldCheck, text: "Food safety & compliance" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="w-4 h-4 text-primary" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Button onClick={handleAccept} className="w-full" size="lg">
              Create Your Account
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Sign up with <strong>{invite.email}</strong> to automatically join the team.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinTeam;
