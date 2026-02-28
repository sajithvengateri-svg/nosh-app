import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, XCircle } from "lucide-react";

export default function GrowthSettings() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketing Settings</h1>
        <p className="text-muted-foreground text-sm">Configure channels, branding, and consent</p>
      </div>

      <Tabs defaultValue="sender">
        <TabsList>
          <TabsTrigger value="sender">Sender Details</TabsTrigger>
          <TabsTrigger value="brand">Brand Assets</TabsTrigger>
          <TabsTrigger value="consent">Consent</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="sender" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Default Sender Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>From Name</Label><Input defaultValue="CHICC.iT Brisbane" /></div>
                <div><Label>Reply-To Email</Label><Input defaultValue="hello@chiccit.com.au" type="email" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>SMS Sender ID</Label><Input defaultValue="CHICCIT" maxLength={11} /></div>
                <div><Label>SMS Number</Label><Input defaultValue="+61400123456" /></div>
              </div>
              <Button onClick={() => toast.success("Sender details saved")}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Brand Assets for Templates</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Logo URL</Label><Input defaultValue="https://chiccit.com.au/logo.png" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Primary Colour</Label><Input defaultValue="#f43f5e" type="color" className="h-10 w-20" /></div>
                <div><Label>Secondary Colour</Label><Input defaultValue="#0f172a" type="color" className="h-10 w-20" /></div>
              </div>
              <div><Label>Default Footer</Label><Input defaultValue="123 Eagle St, Brisbane QLD 4000 · Unsubscribe" /></div>
              <Button onClick={() => toast.success("Brand assets saved")}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Unsubscribe & Consent Management</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>Auto-add unsubscribe link</Label><p className="text-xs text-muted-foreground">Required by Australian spam laws</p></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>Double opt-in for new subscribers</Label><p className="text-xs text-muted-foreground">Send confirmation before adding to list</p></div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div><Label>Honour global do-not-contact</Label><p className="text-xs text-muted-foreground">Respect guest communication preferences</p></div>
                <Switch defaultChecked />
              </div>
              <Button onClick={() => toast.success("Consent settings saved")}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Channel Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { channel: "Email", enabled: true, desc: "Send promotional emails and newsletters" },
                { channel: "SMS", enabled: true, desc: "Send text messages (charges apply)" },
                { channel: "Social Media", enabled: false, desc: "Post to connected social accounts" },
              ].map((c) => (
                <div key={c.channel} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <Label>{c.channel}</Label>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                  <Switch defaultChecked={c.enabled} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Integration Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "ReservationOS Guests", connected: true, desc: "Auto-sync guest profiles" },
                { name: "RestOS Orders", connected: true, desc: "Track dining frequency" },
                { name: "Mailgun / Resend", connected: false, desc: "Email delivery provider" },
                { name: "Twilio", connected: false, desc: "SMS delivery provider" },
              ].map((i) => (
                <div key={i.name} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    {i.connected ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                    <div>
                      <p className="text-sm font-medium text-foreground">{i.name}</p>
                      <p className="text-xs text-muted-foreground">{i.desc}</p>
                    </div>
                  </div>
                  <Badge variant={i.connected ? "default" : "outline"}>{i.connected ? "Connected" : "Not Connected"}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
