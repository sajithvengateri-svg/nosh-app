import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { Loader2, Eye, Save, UserPlus, ChefHat, MapPin, ShieldCheck, Users, ExternalLink } from "lucide-react";

const InviteLandingSettings = () => {
  const { currentOrg, refreshOrg } = useOrg();
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (currentOrg) {
      setWelcomeMessage((currentOrg as any).welcome_message || "");
      setCoverImageUrl((currentOrg as any).cover_image_url || "");
    }
  }, [currentOrg]);

  const handleSave = async () => {
    if (!currentOrg) return;
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        welcome_message: welcomeMessage || null,
        cover_image_url: coverImageUrl || null,
      } as any)
      .eq("id", currentOrg.id);

    if (error) {
      toast.error("Failed to save");
      console.error(error);
    } else {
      toast.success("Invite page updated");
      await refreshOrg();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Invite Landing Page
          </CardTitle>
          <CardDescription>
            Customise the page new team members see when they click their invite link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Welcome Message */}
          <div className="space-y-2">
            <Label>Welcome Message</Label>
            <Textarea
              placeholder="Welcome to our team! We're excited to have you join us..."
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Displayed as a quote on the invite page. Leave blank for no message.
            </p>
          </div>

          {/* Cover Image */}
          <div className="space-y-2">
            <Label>Cover Image URL</Label>
            <Input
              placeholder="https://example.com/your-kitchen-photo.jpg"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              A hero banner displayed at the top of the invite page. Use a wide landscape image.
            </p>
          </div>

          {/* Cover image preview */}
          {coverImageUrl && (
            <div className="rounded-lg overflow-hidden border h-32 sm:h-40">
              <img
                src={coverImageUrl}
                alt="Cover preview"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          )}

          <Separator />

          {/* Info about what's already shown */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">Auto-included from your org profile</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Organisation name: <strong>{currentOrg?.name || "—"}</strong></li>
              <li>• Logo: {currentOrg?.logo_url ? "✅ Set" : "❌ Not set (shows default icon)"}</li>
              <li>• Inviter's name (from their profile)</li>
              <li>• Role & venue (from the invite itself)</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="gap-2">
              <Eye className="w-4 h-4" />
              {showPreview ? "Hide" : "Preview"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      {showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Preview</CardTitle>
            <CardDescription>This is what invitees will see</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-xl overflow-hidden bg-background">
              {/* Cover */}
              {coverImageUrl && (
                <div
                  className="h-32 sm:h-40 bg-cover bg-center"
                  style={{ backgroundImage: `url(${coverImageUrl})` }}
                />
              )}

              <div className="p-6 space-y-4 text-center">
                {/* Logo */}
                {currentOrg?.logo_url ? (
                  <img
                    src={currentOrg.logo_url}
                    alt={currentOrg.name}
                    className="w-16 h-16 rounded-2xl mx-auto object-cover border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <ChefHat className="w-8 h-8 text-primary" />
                  </div>
                )}

                <h2 className="text-xl font-bold">{currentOrg?.name || "Your Team"}</h2>

                {/* Invite details */}
                <div className="bg-muted/50 rounded-lg p-3 text-left space-y-2">
                  <p className="text-sm">
                    <strong>John Smith</strong> has invited you to join {currentOrg?.name} as:
                  </p>
                  <Badge variant="secondary" className="text-xs">Line Chef</Badge>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    <span>Main Kitchen</span>
                  </div>
                </div>

                {/* Welcome message */}
                {welcomeMessage && (
                  <p className="text-sm text-muted-foreground italic">"{welcomeMessage}"</p>
                )}

                {/* Features */}
                <div className="text-left space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">You'll get access to</p>
                  {[
                    { icon: Users, text: "Prep lists & daily tasks" },
                    { icon: ChefHat, text: "Recipes & training materials" },
                    { icon: ShieldCheck, text: "Food safety & compliance" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                <Button className="w-full" size="sm" disabled>
                  Create Your Account
                </Button>

                <p className="text-[10px] text-muted-foreground">
                  Sign up with <strong>invitee@email.com</strong> to join
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InviteLandingSettings;
