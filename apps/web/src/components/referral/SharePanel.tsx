import { Mail, MessageSquare, Share2, Facebook, Linkedin, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useReferralCode } from "@/hooks/useReferralCode";
import { toast } from "sonner";

const SharePanel = () => {
  const { data: codeData } = useReferralCode();
  const [copied, setCopied] = useState(false);
  const code = codeData?.code || "";
  const link = code ? `${window.location.origin}/auth?ref=${code}` : "";
  const message = `Hey — I use ChefOS to manage my kitchen costs and prep. Sign up with my code ${code} and we both get a reward → ${link}`;

  const logShare = async (channel: string) => {
    if (!codeData?.id) return;
    await supabase.from("referral_shares").insert({ code_id: codeData.id, channel });
  };

  const shareChannels = [
    {
      icon: Mail, label: "Email", channel: "email",
      action: () => { window.open(`mailto:?subject=Try ChefOS&body=${encodeURIComponent(message)}`); },
    },
    {
      icon: MessageSquare, label: "SMS", channel: "sms",
      action: () => { window.open(`sms:?body=${encodeURIComponent(message)}`); },
    },
    {
      icon: Share2, label: "WhatsApp", channel: "whatsapp",
      action: () => { window.open(`https://wa.me/?text=${encodeURIComponent(message)}`); },
    },
    {
      icon: Facebook, label: "Facebook", channel: "facebook",
      action: () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`); },
    },
    {
      icon: Linkedin, label: "LinkedIn", channel: "linkedin",
      action: () => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`); },
    },
  ];

  const handleShare = async (channel: string, action: () => void) => {
    await logShare(channel);
    action();
    toast.success(`Shared via ${channel}`);
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(link);
    await logShare("direct_link");
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!code) return null;

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <h3 className="font-semibold text-foreground">Share & Earn</h3>
        <p className="text-sm text-muted-foreground">Share your code with friends and earn credits when they sign up.</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {shareChannels.map((ch) => (
            <Button
              key={ch.channel}
              variant="outline"
              size="sm"
              className="flex flex-col items-center gap-1 h-auto py-3"
              onClick={() => handleShare(ch.channel, ch.action)}
            >
              <ch.icon className="w-4 h-4" />
              <span className="text-[10px]">{ch.label}</span>
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-3"
            onClick={handleCopyLink}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span className="text-[10px]">{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SharePanel;
