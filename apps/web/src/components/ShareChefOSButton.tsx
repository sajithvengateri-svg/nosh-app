import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const SHARE_URL = "https://chefos.ai";
const SHARE_TITLE = "ChefOS — The Operating System for Professional Kitchens";
const SHARE_TEXT = "Check out ChefOS — the operating system for professional kitchens!";

interface ShareChefOSButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const ShareChefOSButton = ({ variant = "outline", size = "default", className }: ShareChefOSButtonProps) => {
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url: SHARE_URL });
      } else {
        await navigator.clipboard.writeText(SHARE_URL);
        toast({ title: "Link copied to clipboard!", description: "Share it with a chef who'd love ChefOS." });
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast({ title: "Couldn't share", description: "Please copy the link manually.", variant: "destructive" });
      }
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleShare} className={className}>
      <Share2 className="w-4 h-4" />
      Share ChefOS
    </Button>
  );
};

export default ShareChefOSButton;
