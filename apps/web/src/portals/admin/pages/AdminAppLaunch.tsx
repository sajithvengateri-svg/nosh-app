import { useState } from "react";
import { Copy, ExternalLink, Mail, Check, Globe, LogIn, Rocket, Heart, Shield, RefreshCw, Truck, ChefHat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_REGISTRY } from "@/lib/shared/appRegistry";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = "https://chefos.ai";

interface LinkCard {
  label: string;
  path: string;
  description: string;
  icon: React.ReactNode;
  live: boolean;
}

const liveLinks: LinkCard[] = [
  { label: "ChefOS Landing Page", path: "/", description: "Public marketing page — shareable with anyone", icon: <Globe className="w-5 h-5" />, live: true },
  { label: "Home Cook Landing", path: "/home-cook", description: "Home cook marketing page — shareable publicly", icon: <Heart className="w-5 h-5" />, live: true },
  { label: "Chef Login", path: "/auth", description: "Sign in for professional kitchen users", icon: <LogIn className="w-5 h-5" />, live: true },
  { label: "Home Cook Login", path: "/auth?mode=home_cook&tab=login", description: "Sign in for home cook users", icon: <LogIn className="w-5 h-5" />, live: true },
  { label: "Admin Login", path: "/admin/auth", description: "Control centre access — admin only", icon: <Shield className="w-5 h-5" />, live: true },
  { label: "Dev Launcher", path: "/launch", description: "Internal module selector (all portals)", icon: <Rocket className="w-5 h-5" />, live: true },
  { label: "Vendor Landing", path: "/vendor-landing", description: "Vendor marketplace — connect suppliers with chefs", icon: <Truck className="w-5 h-5" />, live: true },
  { label: "Food Safety Landing", path: "/food-safety", description: "Brisbane BCC Eat Safe compliance landing page", icon: <Shield className="w-5 h-5" />, live: true },
  { label: "India ChefOS Landing", path: "/chefos-india", description: "ChefOS India market landing page", icon: <ChefHat className="w-5 h-5" />, live: true },
];

const AdminAppLaunch = () => {
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast({ title: "Copied!", description: text });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openInNewTab = (path: string) => window.open(`${BASE_URL}${path}`, "_blank");

  const sendEmail = (label: string, path: string) => {
    const url = `${BASE_URL}${path}`;
    const subject = encodeURIComponent(`Check out ${label}`);
    const body = encodeURIComponent(`Hey!\n\nHere's the link:\n${url}\n\nLet me know what you think!`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const ecosystem = APP_REGISTRY.filter((a) => a.key !== "admin");

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">App Launch Hub</h1>
          <p className="text-muted-foreground mt-1">Manage landing pages, shareable links &amp; quick actions</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Published URL banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Published URL</p>
              <p className="font-mono font-semibold text-foreground">{BASE_URL}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => copyToClipboard(BASE_URL, "base")}>
            {copiedKey === "base" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </CardContent>
      </Card>

      {/* Live Links */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Live Links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {liveLinks.map((link) => {
            const fullUrl = `${BASE_URL}${link.path}`;
            const key = link.path;
            return (
              <Card key={key}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {link.icon}
                      <CardTitle className="text-base">{link.label}</CardTitle>
                    </div>
                    <Badge variant="default" className="text-[10px]">Live</Badge>
                  </div>
                  <CardDescription className="text-xs">{link.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-2 pt-0">
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(fullUrl, key)}>
                    {copiedKey === key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span className="ml-1">Copy</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openInNewTab(link.path)}>
                    <ExternalLink className="w-3 h-3" /><span className="ml-1">Open</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => sendEmail(link.label, link.path)}>
                    <Mail className="w-3 h-3" /><span className="ml-1">Email</span>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Product Roadmap */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Product Roadmap</h2>
        <p className="text-sm text-muted-foreground">Future landing pages — these will light up as each product launches.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ecosystem.map((app) => {
            const isChef = app.key === "chef";
            return (
              <Card key={app.key} className={isChef ? "border-primary/40" : "opacity-70"}>
                <CardContent className="flex items-center gap-3 py-4">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${app.gradient} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {app.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground truncate">{app.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{app.subtitle}</p>
                  </div>
                  <Badge variant={isChef ? "default" : "secondary"} className="text-[10px] shrink-0">
                    {isChef ? "Live" : "Planned"}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default AdminAppLaunch;
