import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAppSettings, AppSettings } from "@/hooks/useAppSettings";
import { toast } from "sonner";
import { Instagram, Facebook, MessageCircle, Share2 } from "lucide-react";

const SocialSettings = () => {
  const { settings, updateSettings } = useAppSettings();

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettings({ [key]: value });
    toast.success("Setting updated");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Social Channels
        </CardTitle>
        <CardDescription>Connect your social media for order tracking</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Instagram className="w-4 h-4" />
            Instagram Handle
          </Label>
          <Input
            placeholder="@yourkitchen"
            value={(settings as any).socialInstagram || ""}
            onChange={e => handleChange("socialInstagram" as any, e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Facebook className="w-4 h-4" />
            Facebook Page URL
          </Label>
          <Input
            placeholder="https://facebook.com/yourkitchen"
            value={(settings as any).socialFacebook || ""}
            onChange={e => handleChange("socialFacebook" as any, e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>TikTok Handle</Label>
          <Input
            placeholder="@yourkitchen"
            value={(settings as any).socialTiktok || ""}
            onChange={e => handleChange("socialTiktok" as any, e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            WhatsApp Business Number
          </Label>
          <Input
            placeholder="+61 400 000 000"
            value={(settings as any).socialWhatsapp || ""}
            onChange={e => handleChange("socialWhatsapp" as any, e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div>
            <Label>Track Orders by Channel</Label>
            <p className="text-sm text-muted-foreground">Log which platform orders come from</p>
          </div>
          <Switch
            checked={(settings as any).socialTrackOrders ?? true}
            onCheckedChange={v => handleChange("socialTrackOrders" as any, v)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SocialSettings;
