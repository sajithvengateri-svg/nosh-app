import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Copy,
  ExternalLink,
  Check,
  Plus,
  Trash2,
  Layout,
  Code,
  Wrench,
  Link2,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { PAGE_LINKS, DOMAINS, EXTERNAL_SERVICES, buildUrl, getLinksByType } from "@/lib/shared/linkRegistry";
import { APP_REGISTRY } from "@/lib/shared/appRegistry";

interface LinkItem {
  label: string;
  path: string;
  custom?: boolean;
}

// Derive app portal links from APP_REGISTRY (auto-propagates when new apps are added)
const appPortalLinks: LinkItem[] = APP_REGISTRY
  .filter((a) => a.key !== "admin")
  .map((a) => ({ label: a.name, path: a.entryRoute }));

// Merge registry app/admin links + auto-derived portal links (deduped)
const devPageLinks: LinkItem[] = (() => {
  const registryLinks = [...getLinksByType("app"), ...getLinksByType("admin")].map((l) => ({
    label: l.label,
    path: l.path,
  }));
  const seen = new Set(registryLinks.map((l) => l.path));
  const portalOnly = appPortalLinks.filter((l) => !seen.has(l.path));
  return [...registryLinks, ...portalOnly];
})();

const STORAGE_KEY = "admin_custom_links";

function loadCustomLinks(): LinkItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomLinks(links: LinkItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export default function AdminDomainLinks() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customLinks, setCustomLinks] = useState<LinkItem[]>(loadCustomLinks);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newPath, setNewPath] = useState("");

  const landingLinks = getLinksByType("landing").map((l) => ({ label: l.label, path: l.path }));

  const copyUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const addCustomLink = () => {
    if (!newLabel.trim() || !newPath.trim()) return;
    const path = newPath.startsWith("/") ? newPath : `/${newPath}`;
    const updated = [...customLinks, { label: newLabel.trim(), path, custom: true }];
    setCustomLinks(updated);
    saveCustomLinks(updated);
    setNewLabel("");
    setNewPath("");
    setAdding(false);
    toast.success("Link added");
  };

  const removeCustomLink = (index: number) => {
    const updated = customLinks.filter((_, i) => i !== index);
    setCustomLinks(updated);
    saveCustomLinks(updated);
    toast.success("Link removed");
  };

  const renderLinkRow = (link: LinkItem, sectionKey: string, customIndex?: number) => {
    const rowKey = `${sectionKey}-${link.path}`;
    return (
      <div key={rowKey} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group">
        <span className="text-sm font-medium w-36 shrink-0 truncate">{link.label}</span>
        <div className="flex gap-1.5 flex-1 overflow-x-auto">
          {DOMAINS.map((d) => {
            const fullUrl = buildUrl(d.base, link.path);
            const copyKey = `${d.key}-${link.path}`;
            return (
              <div key={d.key} className="flex items-center gap-0.5">
                <button
                  onClick={() => copyUrl(fullUrl, copyKey)}
                  className="text-[11px] text-muted-foreground hover:text-foreground truncate max-w-[180px] font-mono"
                  title={fullUrl}
                >
                  {d.label}
                </button>
                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => copyUrl(fullUrl, copyKey)}>
                  {copiedKey === copyKey ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => window.open(fullUrl, "_blank")}>
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
        {link.custom && customIndex !== undefined && (
          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100" onClick={() => removeCustomLink(customIndex)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Globe className="w-6 h-6" /> Domain Links
        </h1>
        <p className="text-sm text-muted-foreground">
          All ChefOS URLs across every domain — click to copy, open to preview
        </p>
      </div>

      {/* Domain legend */}
      <div className="flex flex-wrap gap-2">
        {DOMAINS.map((d) => (
          <Badge key={d.key} variant="outline" className="gap-1.5 py-1">
            <span className={`w-2 h-2 rounded-full ${d.color}`} />
            {d.label}
            <span className="text-[10px] text-muted-foreground">({d.badge})</span>
          </Badge>
        ))}
      </div>

      {/* Landing Pages — from linkRegistry */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Layout className="w-4 h-4" /> Landing Pages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0.5">
          {landingLinks.map((link) => renderLinkRow(link, "landing"))}
        </CardContent>
      </Card>

      {/* Dev / App Pages — from linkRegistry + APP_REGISTRY */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="w-4 h-4" /> Dev / App Pages
            <Badge variant="secondary" className="ml-2 text-[10px]">
              <Monitor className="w-3 h-3 mr-1" /> Auto-synced from App Registry
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0.5">
          {devPageLinks.map((link) => renderLinkRow(link, "dev"))}
        </CardContent>
      </Card>

      {/* Custom Links */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="w-4 h-4" /> Custom Links
            <Button variant="outline" size="sm" className="ml-auto h-7 text-xs" onClick={() => setAdding(!adding)}>
              <Plus className="w-3 h-3 mr-1" /> Add Link
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {adding && (
            <div className="flex gap-2 items-center pb-2 border-b mb-2">
              <Input placeholder="Label" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="h-8 text-sm w-36" />
              <Input placeholder="/path" value={newPath} onChange={(e) => setNewPath(e.target.value)} className="h-8 text-sm font-mono flex-1" />
              <Button size="sm" className="h-8" onClick={addCustomLink}>Add</Button>
            </div>
          )}
          {customLinks.length === 0 && !adding && (
            <p className="text-sm text-muted-foreground py-2">No custom links yet. Click "Add Link" to add your own.</p>
          )}
          {customLinks.map((link, i) => renderLinkRow(link, "custom", i))}
        </CardContent>
      </Card>

      {/* External Services — from linkRegistry */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="w-4 h-4" /> External Services
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0.5">
          {EXTERNAL_SERVICES.map((link) => (
            <div key={link.url} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 group">
              <span className="text-sm font-medium w-36 shrink-0">{link.label}</span>
              <span className="text-[11px] text-muted-foreground font-mono truncate flex-1">{link.url}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => copyUrl(link.url, link.label)}>
                {copiedKey === link.label ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => window.open(link.url, "_blank")}>
                <ExternalLink className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
