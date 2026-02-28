import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Settings as SettingsIcon,
  Scale,
  Image,
  Shield,
  Bell,
  Palette,
  LayoutGrid,
  LogOut,
  User,
  ChevronRight,
  Check,
  RotateCcw,
  Moon,
  Sun,
   Smartphone,
   Sparkles,
   ScrollText,
   Headset,
   HardDrive,
   Link2,
   ChefHat,
   Camera,
   Thermometer,
     Bug,
     ToggleLeft,
     UserPlus,
     Gamepad2,
     Globe,
     FlaskConical
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NavigationSettings from "@/components/settings/NavigationSettings";
import ProfileSettings from "@/components/settings/ProfileSettings";
 import AISettings from "@/components/settings/AISettings";
import AuditLogSettings from "@/components/settings/AuditLogSettings";
import ServiceDeskSettings from "@/components/settings/ServiceDeskSettings";
import StorageRetentionSettings from "@/components/settings/StorageRetentionSettings";
import IntegrationsSettings from "@/components/settings/IntegrationsSettings";
import { useAppSettings, AppSettings } from "@/hooks/useAppSettings";
import { useHomeCookRecipeView, type RecipeViewSections } from "@/hooks/useHomeCookRecipeView";
import ThemePicker, { ThemeOption } from "@/components/settings/ThemePicker";
import { haptic } from "@/lib/haptics";
import AppWalkthrough from "@/components/onboarding/AppWalkthrough";
import { useOrg } from "@/contexts/OrgContext";
import { isHomeCookMode } from "@/lib/shared/modeConfig";
import { useFeatureGate } from "@/hooks/useFeatureGate";
import { isCompliance } from "@queitos/shared";
import SocialSettings from "@/components/settings/SocialSettings";
import { Share2 } from "lucide-react";
import SaveInvoiceFilesToggle from "@/components/settings/SaveInvoiceFilesToggle";
import UIFeedbackSettings from "@/components/settings/UIFeedbackSettings";
import InviteLandingSettings from "@/components/settings/InviteLandingSettings";
import LanguageSelector from "@/components/settings/LanguageSelector";
import UpgradeBanner from "@/components/settings/UpgradeBanner";

const SECTION_LABELS: Record<keyof RecipeViewSections, { label: string; desc: string }> = {
  recipeType: { label: "Recipe Type Selector", desc: "Dish, component, batch prep types" },
  costDetails: { label: "Cost Analysis Details", desc: "Food cost %, max allowed cost, margin" },
  foodCostAlerts: { label: "Food Cost Alerts", desc: "Over/under budget warnings" },
  storageNotes: { label: "Storage Notes & Resting", desc: "Hours, notes, curing/proofing" },
  ccp: { label: "Critical Control Points", desc: "HACCP timeline editor" },
  platingGuide: { label: "Plating Guide", desc: "Visual plating instructions" },
  tastingNotes: { label: "Tasting Notes", desc: "Flavour profile on recipe cards" },
  complaints: { label: "Complaint Warnings", desc: "Open complaint banners on recipes" },
};

const RecipeViewSettings = () => {
  const { viewMode, sections, updateViewMode, toggleSection } = useHomeCookRecipeView();
  const isFull = viewMode === "full";

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="w-5 h-5" />
          Recipe View
        </CardTitle>
        <CardDescription>Choose how much detail to show on recipe pages</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>Full Detail Mode</Label>
            <p className="text-sm text-muted-foreground">Show all professional sections</p>
          </div>
          <Switch
            checked={isFull}
            onCheckedChange={(v) => updateViewMode(v ? "full" : "simple")}
          />
        </div>

        {!isFull && (
          <>
            <Separator />
            <div>
              <Label className="mb-2 block">Show these extra sections</Label>
              <p className="text-sm text-muted-foreground mb-3">Toggle individual sections to customise your simple view</p>
              <div className="space-y-3">
                {(Object.keys(SECTION_LABELS) as (keyof RecipeViewSections)[]).map((key) => (
                  <div key={key} className="flex items-start gap-3">
                    <Checkbox
                      id={`section-${key}`}
                      checked={sections[key]}
                      onCheckedChange={() => toggleSection(key)}
                    />
                    <div className="grid gap-0.5 leading-none">
                      <label htmlFor={`section-${key}`} className="text-sm font-medium cursor-pointer">
                        {SECTION_LABELS[key].label}
                      </label>
                      <p className="text-xs text-muted-foreground">{SECTION_LABELS[key].desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const HOME_COOK_TABS = ["general", "profile", "units", "privacy", "social"];
const EATSAFE_TABS = ["general", "profile", "units", "privacy", "feedback"];

const Settings = () => {
  const { profile, signOut, isHeadChef } = useAuth();
  const { settings, updateSettings, resetSettings } = useAppSettings();
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const { storeMode } = useOrg();
  const { variant } = useFeatureGate();
  const isHomeCook = isHomeCookMode(storeMode);
  const isEatSafe = isCompliance(variant);
  const showTab = (tab: string) => {
    if (isHomeCook) return HOME_COOK_TABS.includes(tab);
    if (isEatSafe) return EATSAFE_TABS.includes(tab);
    return true;
  };

  const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettings({ [key]: value });
    toast.success("Setting updated");
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="page-title font-display">Settings</h1>
          <p className="page-subtitle">{isHomeCook ? "Make it yours" : isEatSafe ? "Customize your EatSafe experience" : "Customize your ChefOS experience"}</p>
        </motion.div>

        <UpgradeBanner />

        <Tabs defaultValue="general" className="space-y-6">
           <TabsList className={`grid w-full h-auto ${isHomeCook ? "grid-cols-3 sm:grid-cols-5" : isEatSafe ? "grid-cols-3 sm:grid-cols-5" : "grid-cols-3 sm:grid-cols-5 lg:grid-cols-11"}`}>
            <TabsTrigger value="general" className="gap-2">
              <SettingsIcon className="w-4 h-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            {showTab("ai") && (
              <TabsTrigger value="ai" className="gap-2">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="units" className="gap-2">
              <Scale className="w-4 h-4" />
              <span className="hidden sm:inline">Units</span>
            </TabsTrigger>
            {showTab("navigation") && (
              <TabsTrigger value="navigation" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Navigation</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="privacy" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            {showTab("social") && isHomeCook && (
              <TabsTrigger value="social" className="gap-2">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Social</span>
              </TabsTrigger>
            )}
            {showTab("audit") && isHeadChef && (
              <TabsTrigger value="audit" className="gap-2">
                <ScrollText className="w-4 h-4" />
                <span className="hidden sm:inline">Audit Log</span>
              </TabsTrigger>
            )}
            {showTab("storage") && isHeadChef && (
              <TabsTrigger value="storage" className="gap-2">
                <HardDrive className="w-4 h-4" />
                <span className="hidden sm:inline">Storage</span>
              </TabsTrigger>
            )}
            {showTab("service") && isHeadChef && (
              <TabsTrigger value="service" className="gap-2">
                <Headset className="w-4 h-4" />
                <span className="hidden sm:inline">Service</span>
              </TabsTrigger>
            )}
             {showTab("integrations") && isHeadChef && (
               <TabsTrigger value="integrations" className="gap-2">
                 <Link2 className="w-4 h-4" />
                 <span className="hidden sm:inline">Integrations</span>
               </TabsTrigger>
             )}
             {showTab("invite") && isHeadChef && (
               <TabsTrigger value="invite" className="gap-2">
                 <UserPlus className="w-4 h-4" />
                 <span className="hidden sm:inline">Invite Page</span>
               </TabsTrigger>
             )}
             <TabsTrigger value="feedback" className="gap-2">
               <ToggleLeft className="w-4 h-4" />
               <span className="hidden sm:inline">Feedback</span>
             </TabsTrigger>
            </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Appearance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Appearance
                  </CardTitle>
                  <CardDescription>{isEatSafe ? "Customize how EatSafe looks" : "Customize how ChefOS looks"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Theme</Label>
                    <p className="text-sm text-muted-foreground mb-3">Choose your preferred color scheme</p>
                    <ThemePicker
                      value={settings.theme as ThemeOption}
                      onChange={(v) => handleSettingChange("theme", v)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Compact Mode</Label>
                      <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                    </div>
                    <Switch 
                      checked={settings.compactMode}
                      onCheckedChange={(v) => handleSettingChange("compactMode", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Animations</Label>
                      <p className="text-sm text-muted-foreground">Enable smooth transitions</p>
                    </div>
                    <Switch 
                      checked={settings.animationsEnabled}
                      onCheckedChange={(v) => handleSettingChange("animationsEnabled", v)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Quick Action Button</Label>
                      <p className="text-sm text-muted-foreground">Floating + button for quick actions</p>
                    </div>
                    <Switch 
                      checked={settings.fabEnabled}
                      onCheckedChange={(v) => handleSettingChange("fabEnabled", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>In-App Toast Messages</Label>
                      <p className="text-sm text-muted-foreground">Brief pop-up confirmations (e.g. "Setting updated")</p>
                    </div>
                    <Switch 
                      checked={settings.toastsEnabled}
                      onCheckedChange={(v) => handleSettingChange("toastsEnabled", v)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Image Settings */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Image Optimization
                  </CardTitle>
                  <CardDescription>Control image quality and data usage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-compress Images</Label>
                      <p className="text-sm text-muted-foreground">Reduce image size before upload (like WhatsApp)</p>
                    </div>
                    <Switch 
                      checked={settings.autoCompressImages}
                      onCheckedChange={(v) => handleSettingChange("autoCompressImages", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Image Quality</Label>
                      <p className="text-sm text-muted-foreground">Higher = better quality, more data</p>
                    </div>
                    <Select 
                      value={settings.imageQuality} 
                      onValueChange={(v) => handleSettingChange("imageQuality", v as "low" | "medium" | "high")}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low (50%)</SelectItem>
                        <SelectItem value="medium">Medium (70%)</SelectItem>
                        <SelectItem value="high">High (90%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Max Image Size</Label>
                      <p className="text-sm text-muted-foreground">Resize large images automatically</p>
                    </div>
                    <Select 
                      value={settings.maxImageSize} 
                      onValueChange={(v) => handleSettingChange("maxImageSize", v as "1024" | "1600" | "2048")}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1024">1024px</SelectItem>
                        <SelectItem value="1600">1600px</SelectItem>
                        <SelectItem value="2048">2048px</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Language */}
              <LanguageSelector />

              {/* Notifications */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notifications
                  </CardTitle>
                  <CardDescription>Manage alerts and reminders</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">Receive alerts on your device</p>
                    </div>
                    <Switch 
                      checked={settings.pushNotifications}
                      onCheckedChange={(v) => handleSettingChange("pushNotifications", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Get updates via email</p>
                    </div>
                    <Switch 
                      checked={settings.emailNotifications}
                      onCheckedChange={(v) => handleSettingChange("emailNotifications", v)}
                    />
                  </div>

                  {!isHomeCook && !isEatSafe && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Prep List Reminders</Label>
                      <p className="text-sm text-muted-foreground">Daily prep list notifications</p>
                    </div>
                    <Switch
                      checked={settings.prepListReminders}
                      onCheckedChange={(v) => handleSettingChange("prepListReminders", v)}
                    />
                  </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Expiry Alerts</Label>
                      <p className="text-sm text-muted-foreground">Inventory expiry warnings</p>
                    </div>
                    <Switch 
                      checked={settings.expiryAlerts}
                      onCheckedChange={(v) => handleSettingChange("expiryAlerts", v)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Induction Settings - hidden for home cooks and EatSafe */}
              {!isHomeCook && !isEatSafe && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5" />
                    Induction Guide
                  </CardTitle>
                  <CardDescription>Manage the 14-day onboarding programme</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Induction Guide</Label>
                      <p className="text-sm text-muted-foreground">Step-by-step setup walkthrough</p>
                    </div>
                    <Switch 
                      checked={settings.inductionEnabled}
                      onCheckedChange={(v) => handleSettingChange("inductionEnabled", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Daily Workflow Reminders</Label>
                      <p className="text-sm text-muted-foreground">Morning, service, and close routine</p>
                    </div>
                    <Switch 
                      checked={settings.showDailyWorkflow}
                      onCheckedChange={(v) => handleSettingChange("showDailyWorkflow", v)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Reset Induction</Label>
                      <p className="text-sm text-muted-foreground">Start the 14-day guide over</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        handleSettingChange("inductionEnabled", true);
                        handleSettingChange("inductionStartDate", new Date().toISOString().split("T")[0]);
                        toast.success("Induction reset — Day 1 starts now");
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>App Tour</Label>
                      <p className="text-sm text-muted-foreground">Replay the full app walkthrough</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowWalkthrough(true)}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Replay Tour
                    </Button>
                  </div>
                </CardContent>
              </Card>
              )}

              {/* Recipe View — home cook only */}
              {isHomeCook && (
              <RecipeViewSettings />
              )}

              {/* Food Safety Compliance (hidden for home cooks) */}
              {!isHomeCook && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#000080]" />
                    Food Safety
                  </CardTitle>
                  <CardDescription>{isEatSafe ? "Compliance settings for your region" : "Food safety compliance mode"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Compliance Mode</Label>
                      <p className="text-sm text-muted-foreground">Enable daily evidence logging, training register, and audit-ready reports for your food safety framework</p>
                    </div>
                    <Switch
                      checked={settings.bccEatSafeEnabled}
                      onCheckedChange={(v) => handleSettingChange("bccEatSafeEnabled", v)}
                    />
                  </div>

                  {settings.bccEatSafeEnabled && (
                    <>
                      <Separator />
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">AI-Powered Compliance Add-ons</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <Camera className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <Label>AI Visual Closing Audit</Label>
                            <p className="text-sm text-muted-foreground">Take nightly closing photos and get AI compliance checks against reference images</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.aiVisualAuditEnabled}
                          onCheckedChange={(v) => handleSettingChange("aiVisualAuditEnabled", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <Thermometer className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <Label>Smart Thermometers</Label>
                            <p className="text-sm text-muted-foreground">Register IoT temperature sensors for automated fridge and food temp monitoring</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.aiSmartThermometersEnabled}
                          onCheckedChange={(v) => handleSettingChange("aiSmartThermometersEnabled", v)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-start gap-3">
                          <Bug className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <Label>AI Pest Scanner</Label>
                            <p className="text-sm text-muted-foreground">Use camera photos to detect pest evidence with AI analysis and alerts</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings.aiPestScannerEnabled}
                          onCheckedChange={(v) => handleSettingChange("aiPestScannerEnabled", v)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              )}

              {/* Dev / Testing Toggles (ChefOS only) */}
              {!isHomeCook && !isEatSafe && (
              <Card className="mt-6 border-dashed border-amber-500/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-amber-500" />
                    Dev / Testing
                  </CardTitle>
                  <CardDescription>Test toggles for variant switching and feature bypass</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Globe className="w-4 h-4 mt-0.5 text-emerald-600" />
                      <div>
                        <Label>GCC UAE Mode</Label>
                        <p className="text-sm text-muted-foreground">Simulate gcc_uae variant — shows Dubai/Abu Dhabi/Sharjah compliance, AED currency, halal tracking</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.devGccModeEnabled}
                      onCheckedChange={(v) => handleSettingChange("devGccModeEnabled", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-3">
                      <Gamepad2 className="w-4 h-4 mt-0.5 text-violet-500" />
                      <div>
                        <Label>Bypass Game Compliance Gate</Label>
                        <p className="text-sm text-muted-foreground">Unlock Mastery Suite games without completing daily compliance tasks</p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.devGameUnlockBypass}
                      onCheckedChange={(v) => handleSettingChange("devGameUnlockBypass", v)}
                    />
                  </div>
                </CardContent>
              </Card>
              )}
            </motion.div>
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>
 
          {/* AI Settings */}
          <TabsContent value="ai">
            <AISettings />
          </TabsContent>

          {/* Units Settings */}
          <TabsContent value="units" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Measurement Units
                  </CardTitle>
                  <CardDescription>{isEatSafe ? "Set your preferred units for temperature and compliance logs" : "Set your preferred units for recipes and ingredients"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weight Units</Label>
                      <p className="text-sm text-muted-foreground">Primary weight measurement</p>
                    </div>
                    <Select 
                      value={settings.weightUnit} 
                      onValueChange={(v) => handleSettingChange("weightUnit", v as "metric" | "imperial")}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Metric (kg/g)</SelectItem>
                        <SelectItem value="imperial">Imperial (lb/oz)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Volume Units</Label>
                      <p className="text-sm text-muted-foreground">Primary volume measurement</p>
                    </div>
                    <Select 
                      value={settings.volumeUnit} 
                      onValueChange={(v) => handleSettingChange("volumeUnit", v as "metric" | "imperial")}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Metric (L/mL)</SelectItem>
                        <SelectItem value="imperial">Imperial (gal/fl oz)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Temperature Units</Label>
                      <p className="text-sm text-muted-foreground">For cooking temperatures</p>
                    </div>
                    <Select 
                      value={settings.temperatureUnit} 
                      onValueChange={(v) => handleSettingChange("temperatureUnit", v as "celsius" | "fahrenheit")}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="celsius">Celsius (°C)</SelectItem>
                        <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Currency</Label>
                      <p className="text-sm text-muted-foreground">For costing and pricing</p>
                    </div>
                    <Select 
                      value={settings.currency} 
                      onValueChange={(v) => handleSettingChange("currency", v)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUD">AUD ($)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="NZD">NZD ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Date Format</Label>
                      <p className="text-sm text-muted-foreground">How dates are displayed</p>
                    </div>
                    <Select 
                      value={settings.dateFormat} 
                      onValueChange={(v) => handleSettingChange("dateFormat", v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Time Format</Label>
                      <p className="text-sm text-muted-foreground">12-hour or 24-hour clock</p>
                    </div>
                    <Select 
                      value={settings.timeFormat} 
                      onValueChange={(v) => handleSettingChange("timeFormat", v as "12h" | "24h")}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour</SelectItem>
                        <SelectItem value="24h">24-hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Default GST / Tax — hidden for EatSafe (no costing features) */}
              {!isEatSafe && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Tax Settings</CardTitle>
                  <CardDescription>Default tax rates for costing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Default GST/Tax Rate</Label>
                      <p className="text-sm text-muted-foreground">Applied to recipe pricing</p>
                    </div>
                    <Select
                      value={settings.defaultGstPercent.toString()}
                      onValueChange={(v) => handleSettingChange("defaultGstPercent", parseInt(v))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="15">15%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Target Food Cost %</Label>
                      <p className="text-sm text-muted-foreground">Default target for new recipes</p>
                    </div>
                    <Select
                      value={settings.defaultFoodCostTarget.toString()}
                      onValueChange={(v) => handleSettingChange("defaultFoodCostTarget", parseInt(v))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                        <SelectItem value="30">30%</SelectItem>
                        <SelectItem value="32">32%</SelectItem>
                        <SelectItem value="35">35%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
              )}
            </motion.div>
          </TabsContent>

          {/* Navigation Settings */}
          {showTab("navigation") && (
            <TabsContent value="navigation">
              <NavigationSettings />
            </TabsContent>
          )}

          {/* Social Settings - home cook only */}
          {isHomeCook && (
            <TabsContent value="social">
              <SocialSettings />
            </TabsContent>
          )}

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Privacy & Security
                  </CardTitle>
                  <CardDescription>Control your data and security settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{isEatSafe ? "Share Compliance Analytics" : "Share Recipe Analytics"}</Label>
                      <p className="text-sm text-muted-foreground">Contribute to anonymized stats</p>
                    </div>
                    <Switch
                      checked={settings.shareAnalytics}
                      onCheckedChange={(v) => handleSettingChange("shareAnalytics", v)}
                    />
                  </div>

                  <Separator />

                  <SaveInvoiceFilesToggle />

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Set Up
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Session Timeout</Label>
                      <p className="text-sm text-muted-foreground">Auto logout after inactivity</p>
                    </div>
                    <Select 
                      value={settings.sessionTimeout} 
                      onValueChange={(v) => handleSettingChange("sessionTimeout", v)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30m">30 minutes</SelectItem>
                        <SelectItem value="1h">1 hour</SelectItem>
                        <SelectItem value="4h">4 hours</SelectItem>
                        <SelectItem value="24h">24 hours</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Data Management */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>Manage your stored data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Export My Data</Label>
                      <p className="text-sm text-muted-foreground">{isEatSafe ? "Download all compliance records and data" : "Download all your recipes and data"}</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Export
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Clear Local Cache</Label>
                      <p className="text-sm text-muted-foreground">Remove locally stored data</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        localStorage.clear();
                        toast.success("Cache cleared");
                      }}
                    >
                      Clear
                    </Button>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-destructive">Delete Account</Label>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
                    </div>
                    <Button variant="destructive" size="sm">
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Sign Out */}
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => { haptic("medium"); signOut(); }}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>

              {/* Reset All Settings */}
              <div className="text-center pt-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => {
                    resetSettings();
                    toast.success("All settings reset to defaults");
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset All Settings to Defaults
                </Button>
              </div>
            </motion.div>
          </TabsContent>

          {/* Audit Log — admin/head only */}
          {isHeadChef && (
            <TabsContent value="audit">
              <AuditLogSettings />
            </TabsContent>
          )}

          {isHeadChef && (
            <TabsContent value="storage">
              <StorageRetentionSettings />
            </TabsContent>
          )}

          {isHeadChef && (
            <TabsContent value="service">
              <ServiceDeskSettings />
            </TabsContent>
          )}

          {isHeadChef && (
            <TabsContent value="integrations">
              <IntegrationsSettings />
            </TabsContent>
           )}

          {isHeadChef && (
            <TabsContent value="invite">
              <InviteLandingSettings />
            </TabsContent>
          )}

           <TabsContent value="feedback">
             <UIFeedbackSettings />
           </TabsContent>
         </Tabs>
      </div>

      <AppWalkthrough
        open={showWalkthrough}
        onComplete={() => setShowWalkthrough(false)}
      />
    </AppLayout>
  );
};

export default Settings;
