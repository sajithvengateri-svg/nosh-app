import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "@/contexts/OrgContext";
import { fetchPOSStore, upsertPOSStore } from "@/lib/shared/queries/posQueries";
import { Loader2 } from "lucide-react";

interface StoreSettings {
  venue_name?: string;
  abn?: string;
  address?: string;
  phone?: string;
  email?: string;
  gst_registered?: boolean;
  gst_rate?: number;
  prices_include_gst?: boolean;
  surcharges?: { day: string; rate: string; enabled: boolean }[];
  receipt_show_abn?: boolean;
  receipt_show_wifi?: boolean;
  wifi_password?: string;
  trading_hours?: Record<string, { open: string; close: string }>;
  notifications?: {
    order_alerts?: boolean;
    kds_sounds?: boolean;
    low_stock_alerts?: boolean;
  };
}

const DEFAULT_SURCHARGES = [
  { day: "Sunday", rate: "10", enabled: true },
  { day: "Public Holiday", rate: "15", enabled: true },
  { day: "Saturday (after 6pm)", rate: "0", enabled: false },
  { day: "Credit Card", rate: "1.5", enabled: true },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_HOURS: Record<string, { open: string; close: string }> = Object.fromEntries(
  DAYS.map((d) => [d, { open: d === "Sunday" ? "10:00" : "11:00", close: ["Friday", "Saturday"].includes(d) ? "00:00" : "22:00" }])
);

export default function POSStoreSettings() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const qc = useQueryClient();

  const { data: store, isLoading } = useQuery({
    queryKey: ["pos-store", orgId],
    queryFn: () => fetchPOSStore(orgId!),
    enabled: !!orgId,
  });

  const [storeName, setStoreName] = useState("");
  const [taxRate, setTaxRate] = useState("10");
  const [cardSurcharge, setCardSurcharge] = useState("1.5");
  const [receiptHeader, setReceiptHeader] = useState("");
  const [receiptFooter, setReceiptFooter] = useState("");
  const [settings, setSettings] = useState<StoreSettings>({});
  const [tradingHours, setTradingHours] = useState<Record<string, { open: string; close: string }>>(DEFAULT_HOURS);

  useEffect(() => {
    if (store) {
      setStoreName(store.store_name || "");
      setTaxRate(String((Number(store.tax_rate) * 100).toFixed(1)));
      setCardSurcharge(String((Number(store.card_surcharge_pct) * 100).toFixed(1)));
      setReceiptHeader(store.receipt_header || "");
      setReceiptFooter(store.receipt_footer || "");
      const s = (store.settings as StoreSettings) || {};
      setSettings(s);
      setTradingHours((store.trading_hours as Record<string, { open: string; close: string }>) || DEFAULT_HOURS);
    }
  }, [store]);

  const upsert = useMutation({
    mutationFn: (payload: Record<string, unknown>) => upsertPOSStore(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pos-store"] });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const save = (extra?: Record<string, unknown>) => {
    upsert.mutate({
      org_id: orgId,
      store_name: storeName,
      tax_rate: Number(taxRate) / 100,
      card_surcharge_pct: Number(cardSurcharge) / 100,
      receipt_header: receiptHeader,
      receipt_footer: receiptFooter,
      trading_hours: tradingHours,
      settings: { ...settings, ...(extra || {}) },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Store Settings</h1>
        <p className="text-sm text-slate-400">Venue configuration, tax, and operational settings</p>
      </div>

      <Tabs defaultValue="venue">
        <TabsList className="bg-white/5">
          <TabsTrigger value="venue">Venue</TabsTrigger>
          <TabsTrigger value="tax">Tax / GST</TabsTrigger>
          <TabsTrigger value="surcharges">Surcharges</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
          <TabsTrigger value="hours">Trading Hours</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* ====== VENUE ====== */}
        <TabsContent value="venue" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="text-sm text-white">Venue Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-slate-300">Venue Name</Label>
                  <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div><Label className="text-slate-300">ABN</Label>
                  <Input value={settings.abn || ""} onChange={(e) => setSettings((p) => ({ ...p, abn: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              <div><Label className="text-slate-300">Address</Label>
                <Input value={settings.address || ""} onChange={(e) => setSettings((p) => ({ ...p, address: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-slate-300">Phone</Label>
                  <Input value={settings.phone || ""} onChange={(e) => setSettings((p) => ({ ...p, phone: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
                <div><Label className="text-slate-300">Email</Label>
                  <Input value={settings.email || ""} onChange={(e) => setSettings((p) => ({ ...p, email: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
              </div>
              <Button onClick={() => save()} disabled={upsert.isPending}>
                {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== TAX ====== */}
        <TabsContent value="tax" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="text-sm text-white">Tax Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label className="text-slate-300">GST Registered</Label><p className="text-xs text-slate-500">Prices include GST</p></div>
                <Switch checked={settings.gst_registered !== false} onCheckedChange={(v) => setSettings((p) => ({ ...p, gst_registered: v }))} />
              </div>
              <div><Label className="text-slate-300">GST Rate (%)</Label>
                <Input type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="bg-white/5 border-white/10 text-white w-24" />
              </div>
              <div className="flex items-center justify-between">
                <div><Label className="text-slate-300">Prices Include GST</Label><p className="text-xs text-slate-500">Menu prices are GST-inclusive</p></div>
                <Switch checked={settings.prices_include_gst !== false} onCheckedChange={(v) => setSettings((p) => ({ ...p, prices_include_gst: v }))} />
              </div>
              <Button onClick={() => save()} disabled={upsert.isPending}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== SURCHARGES ====== */}
        <TabsContent value="surcharges" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="text-sm text-white">Surcharge Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {(settings.surcharges || DEFAULT_SURCHARGES).map((s, i) => (
                <div key={s.day} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={s.enabled}
                      onCheckedChange={(v) => {
                        const surcharges = [...(settings.surcharges || DEFAULT_SURCHARGES)];
                        surcharges[i] = { ...surcharges[i], enabled: v };
                        setSettings((p) => ({ ...p, surcharges }));
                      }}
                    />
                    <Label className="text-slate-300">{s.day}</Label>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      value={s.rate}
                      onChange={(e) => {
                        const surcharges = [...(settings.surcharges || DEFAULT_SURCHARGES)];
                        surcharges[i] = { ...surcharges[i], rate: e.target.value };
                        setSettings((p) => ({ ...p, surcharges }));
                      }}
                      className="w-16 bg-white/5 border-white/10 text-white text-center"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                </div>
              ))}
              <Button onClick={() => save()} disabled={upsert.isPending}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== RECEIPT ====== */}
        <TabsContent value="receipt" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="text-sm text-white">Receipt Customisation</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="text-slate-300">Header Text</Label>
                <Input value={receiptHeader} onChange={(e) => setReceiptHeader(e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div><Label className="text-slate-300">Footer Text</Label>
                <Input value={receiptFooter} onChange={(e) => setReceiptFooter(e.target.value)} className="bg-white/5 border-white/10 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Show ABN on Receipt</Label>
                <Switch checked={settings.receipt_show_abn !== false} onCheckedChange={(v) => setSettings((p) => ({ ...p, receipt_show_abn: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Show WiFi Password</Label>
                <Switch checked={settings.receipt_show_wifi || false} onCheckedChange={(v) => setSettings((p) => ({ ...p, receipt_show_wifi: v }))} />
              </div>
              {settings.receipt_show_wifi && (
                <div><Label className="text-slate-300">WiFi Password</Label>
                  <Input value={settings.wifi_password || ""} onChange={(e) => setSettings((p) => ({ ...p, wifi_password: e.target.value }))} className="bg-white/5 border-white/10 text-white" />
                </div>
              )}
              <Button onClick={() => save()} disabled={upsert.isPending}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== TRADING HOURS ====== */}
        <TabsContent value="hours" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="text-sm text-white">Trading Hours</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center justify-between py-1">
                  <span className="text-sm text-slate-300 w-24">{day}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={tradingHours[day]?.open || "11:00"}
                      onChange={(e) => setTradingHours((p) => ({ ...p, [day]: { ...p[day], open: e.target.value } }))}
                      className="w-28 bg-white/5 border-white/10 text-white text-sm"
                    />
                    <span className="text-slate-500">–</span>
                    <Input
                      type="time"
                      value={tradingHours[day]?.close || "22:00"}
                      onChange={(e) => setTradingHours((p) => ({ ...p, [day]: { ...p[day], close: e.target.value } }))}
                      className="w-28 bg-white/5 border-white/10 text-white text-sm"
                    />
                  </div>
                </div>
              ))}
              <Button onClick={() => save()} disabled={upsert.isPending}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== PAYMENTS ====== */}
        <TabsContent value="payments" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="text-sm text-white">Payment Terminal</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-slate-500">Stripe Terminal configuration for card readers.</p>
              <div><Label className="text-slate-300">Stripe Account ID</Label>
                <Input value={store?.stripe_account_id || ""} disabled className="bg-white/5 border-white/10 text-slate-500" placeholder="Connected via settings" />
              </div>
              <div><Label className="text-slate-300">Reader ID</Label>
                <Input value={store?.stripe_reader_id || ""} disabled className="bg-white/5 border-white/10 text-slate-500" placeholder="Auto-detected" />
              </div>
              <div><Label className="text-slate-300">Card Surcharge (%)</Label>
                <Input type="number" value={cardSurcharge} onChange={(e) => setCardSurcharge(e.target.value)} className="bg-white/5 border-white/10 text-white w-24" />
              </div>
              <Button onClick={() => save()} disabled={upsert.isPending}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ====== NOTIFICATIONS ====== */}
        <TabsContent value="notifications" className="mt-4">
          <Card className="bg-white/5 border-white/10">
            <CardHeader><CardTitle className="text-sm text-white">Notification Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div><Label className="text-slate-300">Order Alert Sounds</Label><p className="text-xs text-slate-500">Play a chime when new orders come in</p></div>
                <Switch
                  checked={settings.notifications?.order_alerts !== false}
                  onCheckedChange={(v) => setSettings((p) => ({ ...p, notifications: { ...p.notifications, order_alerts: v } }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div><Label className="text-slate-300">KDS Sounds</Label><p className="text-xs text-slate-500">Audio alerts on KDS screens</p></div>
                <Switch
                  checked={settings.notifications?.kds_sounds !== false}
                  onCheckedChange={(v) => setSettings((p) => ({ ...p, notifications: { ...p.notifications, kds_sounds: v } }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div><Label className="text-slate-300">Low Stock Alerts</Label><p className="text-xs text-slate-500">Notify when menu items hit par level</p></div>
                <Switch
                  checked={settings.notifications?.low_stock_alerts || false}
                  onCheckedChange={(v) => setSettings((p) => ({ ...p, notifications: { ...p.notifications, low_stock_alerts: v } }))}
                />
              </div>
              <Button onClick={() => save()} disabled={upsert.isPending}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
