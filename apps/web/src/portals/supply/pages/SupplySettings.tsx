import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function SupplySettings() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Supply Settings</h1>
        <p className="text-muted-foreground text-sm">Configure procurement defaults and workflows</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="reorder">Auto-Reorder</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Payment & Delivery Defaults</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Default Payment Terms</Label>
                  <Select defaultValue="net14"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cod">COD</SelectItem>
                      <SelectItem value="net7">Net 7</SelectItem>
                      <SelectItem value="net14">Net 14</SelectItem>
                      <SelectItem value="net30">Net 30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Default Delivery Window</Label>
                  <Select defaultValue="am"><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="am">Morning (6-10am)</SelectItem>
                      <SelectItem value="mid">Midday (10am-2pm)</SelectItem>
                      <SelectItem value="pm">Afternoon (2-6pm)</SelectItem>
                      <SelectItem value="any">Any Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Receiving Dock / Location</Label><Input defaultValue="Back dock, loading bay 2" /></div>
              <Button onClick={() => toast.success("Settings saved")}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reorder" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Auto-Reorder Thresholds</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>Enable Auto-Reorder Suggestions</Label><p className="text-xs text-muted-foreground">Get PO suggestions when stock falls below par</p></div>
                <Switch defaultChecked />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Alert Threshold (%)</Label><Input type="number" defaultValue="25" /><p className="text-xs text-muted-foreground">Alert when stock is this % below par</p></div>
                <div><Label>Lead Time Buffer (days)</Label><Input type="number" defaultValue="2" /><p className="text-xs text-muted-foreground">Order this many days before stock-out</p></div>
              </div>
              <Button onClick={() => toast.success("Reorder settings saved")}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">PO Approval Workflows</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label>Require Approval for POs</Label><p className="text-xs text-muted-foreground">POs above threshold require manager sign-off</p></div>
                <Switch defaultChecked />
              </div>
              <div><Label>Auto-Approve Under ($)</Label><Input type="number" defaultValue="500" /><p className="text-xs text-muted-foreground">POs below this value are auto-approved</p></div>
              <div><Label>Require 2nd Approval Over ($)</Label><Input type="number" defaultValue="5000" /><p className="text-xs text-muted-foreground">High-value POs require additional sign-off</p></div>
              <Button onClick={() => toast.success("Approval rules saved")}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  { label: "Price drift alerts", desc: "When supplier prices exceed threshold", checked: true },
                  { label: "Delivery reminders", desc: "Day-before delivery notifications", checked: true },
                  { label: "Low stock alerts", desc: "When ingredients drop below par level", checked: true },
                  { label: "PO approval requests", desc: "When POs need your approval", checked: true },
                  { label: "Invoice match failures", desc: "When invoices don't match POs", checked: false },
                ].map((n) => (
                  <div key={n.label} className="flex items-center justify-between py-2">
                    <div><Label>{n.label}</Label><p className="text-xs text-muted-foreground">{n.desc}</p></div>
                    <Switch defaultChecked={n.checked} />
                  </div>
                ))}
              </div>
              <Button onClick={() => toast.success("Notifications saved")}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
