import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings, Wine, LayoutGrid, Palette, Bell, Scale,
  Moon, Sun, Smartphone, RotateCcw, Droplets, Brain, Scan, Mic, Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import BevNavigationSettings from "@/portals/bev/components/BevNavigationSettings";
import BevBottomNavSettings from "@/portals/bev/components/BevBottomNavSettings";

const BevSettings = () => {
  const [pourSize, setPourSize] = useState<"30" | "45">("30");
  const [winePourSize, setWinePourSize] = useState<"120" | "150" | "180">("150");
  const [trackCoravinGas, setTrackCoravinGas] = useState(true);
  const [bevCostTarget, setBevCostTarget] = useState(22);
  const [lineCleanFreq, setLineCleanFreq] = useState<"7" | "14" | "21">("14");
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [stockAlerts, setStockAlerts] = useState(true);
  const [tempUnit, setTempUnit] = useState<"celsius" | "fahrenheit">("celsius");
  const [volumeUnit, setVolumeUnit] = useState<"ml" | "oz">("ml");
  // AI Feature Toggles
  const [aiLlmEnabled, setAiLlmEnabled] = useState(false);
  const [aiOcrEnabled, setAiOcrEnabled] = useState(true);
  const [aiVoiceEnabled, setAiVoiceEnabled] = useState(false);
  const [aiLabelScan, setAiLabelScan] = useState(true);
  const [aiInvoiceScan, setAiInvoiceScan] = useState(true);
  const [aiBarcodeScan, setAiBarcodeScan] = useState(true);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold font-display text-foreground">BevOS Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your bar management preferences</p>
      </motion.div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="bar" className="gap-2">
            <Wine className="w-4 h-4" />
            <span className="hidden sm:inline">Bar</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-2">
            <Scale className="w-4 h-4" />
            <span className="hidden sm:inline">Units</span>
          </TabsTrigger>
          <TabsTrigger value="navigation" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Nav</span>
          </TabsTrigger>
        </TabsList>

        {/* ───── General ───── */}
        <TabsContent value="general" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />Appearance</CardTitle>
                <CardDescription>Customize how BevOS looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><Label>Theme</Label><p className="text-sm text-muted-foreground">Choose your preferred color scheme</p></div>
                  <Select value={theme} onValueChange={(v) => { setTheme(v as any); toast.success("Theme updated"); }}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light"><div className="flex items-center gap-2"><Sun className="w-4 h-4" />Light</div></SelectItem>
                      <SelectItem value="dark"><div className="flex items-center gap-2"><Moon className="w-4 h-4" />Dark</div></SelectItem>
                      <SelectItem value="system"><div className="flex items-center gap-2"><Smartphone className="w-4 h-4" />System</div></SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div><Label>Compact Mode</Label><p className="text-sm text-muted-foreground">Reduce spacing for more content</p></div>
                  <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Animations</Label><p className="text-sm text-muted-foreground">Enable smooth transitions</p></div>
                  <Switch checked={animations} onCheckedChange={setAnimations} />
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />Notifications</CardTitle>
                <CardDescription>Manage alerts and reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><Label>Push Notifications</Label><p className="text-sm text-muted-foreground">Receive alerts on your device</p></div>
                  <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Email Notifications</Label><p className="text-sm text-muted-foreground">Get updates via email</p></div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Low Stock Alerts</Label><p className="text-sm text-muted-foreground">When cellar items drop below par</p></div>
                  <Switch checked={stockAlerts} onCheckedChange={setStockAlerts} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ───── Bar ───── */}
        <TabsContent value="bar" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Pour Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wine className="w-5 h-5" />Pour Settings</CardTitle>
                <CardDescription>Standard spirit and wine pour sizes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Standard Spirit Pour</Label>
                  <div className="flex gap-2">
                    {(["30", "45"] as const).map((size) => (
                      <button key={size} onClick={() => setPourSize(size)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          pourSize === size ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                        {size}ml
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="mb-2 block">Standard Wine Pour</Label>
                  <div className="flex gap-2">
                    {(["120", "150", "180"] as const).map((size) => (
                      <button key={size} onClick={() => setWinePourSize(size)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          winePourSize === size ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                        {size}ml
                      </button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="mb-2 block">Bev Cost Target %</Label>
                  <div className="flex gap-2 flex-wrap">
                    {[18, 20, 22, 25, 28].map((pct) => (
                      <button key={pct} onClick={() => setBevCostTarget(pct)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          bevCostTarget === pct ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}>
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coravin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Droplets className="w-5 h-5" />Coravin</CardTitle>
                <CardDescription>By-the-glass wine preservation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div><Label>Track Gas Usage</Label><p className="text-sm text-muted-foreground">Monitor capsule usage per pour</p></div>
                  <Switch checked={trackCoravinGas} onCheckedChange={setTrackCoravinGas} />
                </div>
              </CardContent>
            </Card>

            {/* Line Cleaning */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Line Cleaning Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div><Label>Cleaning Frequency</Label><p className="text-sm text-muted-foreground">Days between scheduled line cleans</p></div>
                  <Select value={lineCleanFreq} onValueChange={(v) => { setLineCleanFreq(v as any); toast.success("Updated"); }}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Every 7 days</SelectItem>
                      <SelectItem value="14">Every 14 days</SelectItem>
                      <SelectItem value="21">Every 21 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ───── AI Features ───── */}
        <TabsContent value="ai" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Brain className="w-5 h-5" />AI Features</CardTitle>
                <CardDescription>Enable or disable AI-powered capabilities (opt-in)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><Label>AI Chat Assistant</Label><p className="text-sm text-muted-foreground">BevAI chat for recipes, pairings, and bar advice</p></div>
                  <Switch checked={aiLlmEnabled} onCheckedChange={(v) => { setAiLlmEnabled(v); toast.success(v ? "AI Chat enabled" : "AI Chat disabled"); }} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div><Label>Voice Commands</Label><p className="text-sm text-muted-foreground">Hands-free voice control during service</p></div>
                  <Switch checked={aiVoiceEnabled} onCheckedChange={(v) => { setAiVoiceEnabled(v); toast.success(v ? "Voice enabled" : "Voice disabled"); }} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Scan className="w-5 h-5" />OCR & Scanning</CardTitle>
                <CardDescription>AI-powered image recognition for labels, tags, and codes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><Label>Invoice OCR</Label><p className="text-sm text-muted-foreground">Extract line items from supplier invoices</p></div>
                  <Switch checked={aiInvoiceScan} onCheckedChange={(v) => { setAiInvoiceScan(v); toast.success(v ? "Invoice OCR enabled" : "Invoice OCR disabled"); }} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div><Label>Label Scanning</Label><p className="text-sm text-muted-foreground">Read wine, spirit, and beer labels automatically</p></div>
                  <Switch checked={aiLabelScan} onCheckedChange={(v) => { setAiLabelScan(v); toast.success(v ? "Label scan enabled" : "Label scan disabled"); }} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div><Label>QR & Barcode Reader</Label><p className="text-sm text-muted-foreground">Decode QR codes and barcodes from product images</p></div>
                  <Switch checked={aiBarcodeScan} onCheckedChange={(v) => { setAiBarcodeScan(v); toast.success(v ? "Barcode scan enabled" : "Barcode scan disabled"); }} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div><Label>Equipment Tag OCR</Label><p className="text-sm text-muted-foreground">Extract serial numbers and specs from equipment labels</p></div>
                  <Switch checked={aiOcrEnabled} onCheckedChange={(v) => { setAiOcrEnabled(v); toast.success(v ? "Equipment OCR enabled" : "Equipment OCR disabled"); }} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm text-foreground">About AI Features</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      All AI features are opt-in and processed securely. Image scans are not stored after processing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* ───── Units ───── */}
        <TabsContent value="units" className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Scale className="w-5 h-5" />Measurement Units</CardTitle>
                <CardDescription>Set your preferred units for bar operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><Label>Temperature</Label><p className="text-sm text-muted-foreground">For cellar & fridge monitoring</p></div>
                  <Select value={tempUnit} onValueChange={(v) => setTempUnit(v as any)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="celsius">Celsius (°C)</SelectItem>
                      <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div><Label>Volume</Label><p className="text-sm text-muted-foreground">For pour sizes and recipes</p></div>
                  <Select value={volumeUnit} onValueChange={(v) => setVolumeUnit(v as any)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ml">Metric (mL / L)</SelectItem>
                      <SelectItem value="oz">Imperial (fl oz)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="navigation" className="space-y-6">
          <BevBottomNavSettings />
          <BevNavigationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BevSettings;
