import { Copy, Check, Gift } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useReferralCode } from "@/hooks/useReferralCode";

interface Props {
  compact?: boolean;
}

const ReferralCodeCard = ({ compact }: Props) => {
  const { data: codeData, isLoading } = useReferralCode();
  const [copied, setCopied] = useState(false);

  const code = codeData?.code || "";
  const shareLink = code ? `${window.location.origin}/auth?ref=${code}` : "";

  const handleCopy = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className={compact ? "p-3" : "p-5"}>
          <div className="animate-pulse h-8 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!code) return null;

  if (compact) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-3 flex items-center gap-3">
          <Gift className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Refer & Save</p>
            <p className="text-xs text-muted-foreground font-mono truncate">{code}</p>
          </div>
          <Button size="sm" variant="outline" onClick={handleCopy} className="flex-shrink-0">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Your Referral Code</h3>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 font-mono text-lg font-bold text-foreground">
          {code}
        </div>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={shareLink}
            className="flex-1 text-xs bg-muted/30 rounded px-2 py-1.5 text-muted-foreground truncate border border-border"
          />
          <Button size="sm" variant="secondary" onClick={handleCopy}>
            {copied ? <><Check className="w-3 h-3 mr-1" /> Copied</> : <><Copy className="w-3 h-3 mr-1" /> Copy</>}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralCodeCard;
