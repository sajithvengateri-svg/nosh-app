import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useBetaTrack } from "@/hooks/useBetaTrack";
import { motion } from "framer-motion";
import { 
  Plus,
  Thermometer,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Truck,
  Phone,
  Mail,
  ExternalLink,
  Search,
  Pencil,
  Trash2,
  X,
  Save,
  Camera,
  Loader2,
  SprayCan,
  Package,
  Image,
  Snowflake,
  Flame,
  Wind,
  FileText,
  Zap,
  Shield
} from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DailyTempChecks from "@/components/food-safety/DailyTempChecks";
import DutyRosterTab from "@/components/food-safety/DutyRosterTab";
import DocketScanner from "@/components/food-safety/DocketScanner";
import { isHomeCookMode } from "@/lib/shared/modeConfig";
import { useAppSettings } from "@/hooks/useAppSettings";
import BCCFoodSafetyDashboard from "@/components/food-safety/bcc/BCCFoodSafetyDashboard";
import GCCFoodSafetyDashboard from "@/components/food-safety/gcc/GCCFoodSafetyDashboard";
import BCCReceivingLog from "@/components/food-safety/bcc/BCCReceivingLog";
import BCCCleaningLog from "@/components/food-safety/bcc/BCCCleaningLog";

// ---------- Types ----------

interface SafetyLog {
  id: string;
  log_type: "temperature" | "cleaning" | "receiving" | "delivery";
  location: string | null;
  readings: Record<string, unknown> | null;
  status: "pass" | "warning" | "fail" | null;
  recorded_by_name: string | null;
  time: string;
  date: string;
  notes: string | null;
  corrective_action: string | null;
  reference_image_url?: string | null;
  verification_image_url?: string | null;
  ai_verification_status?: string | null;
  ai_verification_notes?: string | null;
  receiving_data?: Record<string, unknown> | null;
  temp_image_url?: string | null;
}

interface CleaningArea {
  id: string;
  name: string;
  location: string | null;
  reference_image_url: string | null;
  cleaning_frequency: string;
  instructions: string | null;
}

interface Supplier {
  id: string;
  name: string;
  category: string;
  products: string | null;
  rep_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  credit_status: string | null;
}

interface ReceivingItem {
  name: string;
  qty: string;
  temp: string;
  condition: "pass" | "fail";
}

// ---------- Temperature Zone Config ----------

type LocationType = "fridge" | "freezer" | "hot_hold" | "ambient" | "delivery_cold" | "delivery_frozen";

interface TempZone {
  label: string;
  icon: React.ReactNode;
  pass: [number, number]; // [min, max] inclusive
  warning: [number, number];
  // anything outside warning is fail
}

const TEMP_ZONES: Record<LocationType, TempZone> = {
  fridge: { label: "Fridge / Walk-in", icon: <Snowflake className="w-4 h-4" />, pass: [0, 5], warning: [5.1, 8] },
  freezer: { label: "Freezer", icon: <Snowflake className="w-4 h-4" />, pass: [-50, -18], warning: [-17.9, -15] },
  hot_hold: { label: "Hot Hold", icon: <Flame className="w-4 h-4" />, pass: [63, 100], warning: [60, 62.9] },
  ambient: { label: "Ambient", icon: <Wind className="w-4 h-4" />, pass: [15, 25], warning: [25.1, 30] },
  delivery_cold: { label: "Delivery (Cold)", icon: <Truck className="w-4 h-4" />, pass: [0, 5], warning: [5.1, 8] },
  delivery_frozen: { label: "Delivery (Frozen)", icon: <Truck className="w-4 h-4" />, pass: [-50, -18], warning: [-17.9, -12] },
};

const getAutoStatus = (temp: number, locationType: LocationType): "pass" | "warning" | "fail" => {
  const zone = TEMP_ZONES[locationType];
  if (!zone) return "pass";
  if (temp >= zone.pass[0] && temp <= zone.pass[1]) return "pass";
  if (temp >= zone.warning[0] && temp <= zone.warning[1]) return "warning";
  return "fail";
};

// ---------- Constants ----------

const logTypes = [
  { value: "temperature", label: "Temperature Check", icon: Thermometer },
  { value: "cleaning", label: "Cleaning Log", icon: SprayCan },
  { value: "receiving", label: "Receiving Log", icon: Package },
];

const statusStyles = {
  pass: { bg: "bg-success/10", text: "text-success", icon: CheckCircle2, label: "Passed" },
  warning: { bg: "bg-warning/10", text: "text-warning", icon: AlertTriangle, label: "Warning" },
  fail: { bg: "bg-destructive/10", text: "text-destructive", icon: AlertTriangle, label: "Failed" },
};

const creditStyles: Record<string, { bg: string; text: string }> = {
  done: { bg: "bg-success/10", text: "text-success" },
  approved: { bg: "bg-success/10", text: "text-success" },
  applied: { bg: "bg-warning/10", text: "text-warning" },
  pending: { bg: "bg-muted", text: "text-muted-foreground" },
};

const categories = ["All", "Meat", "Fish", "Cheese", "Pantry", "Veg", "Supplies"];

const QUICK_LOCATIONS: { key: LocationType; label: string }[] = [
  { key: "fridge", label: "Walk-in" },
  { key: "freezer", label: "Freezer" },
  { key: "hot_hold", label: "Hot Hold" },
  { key: "ambient", label: "Ambient" },
];

const HOME_COOK_LOCATIONS: { key: LocationType; label: string }[] = [
  { key: "fridge", label: "Fridge 1" },
  { key: "fridge", label: "Fridge 2" },
  { key: "freezer", label: "Freezer 1" },
  { key: "freezer", label: "Freezer 2" },
];

const TODAY_TARGET = 8; // target temp checks per day

// ---------- Component ----------

const FoodSafety = () => {
  const { user, canEdit } = useAuth();
  const { currentOrg, storeMode } = useOrg();
  const betaTrack = useBetaTrack((currentOrg as any)?.app_variant || "chefos_au");
  useEffect(() => { betaTrack.pageView("food-safety"); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const isHomeCook = isHomeCookMode(storeMode);
  const { settings, updateSettings } = useAppSettings();
  const bccEnabled = settings.bccEatSafeEnabled;
  const isGCC = (currentOrg as any)?.app_variant === "gcc_uae" || settings.devGccModeEnabled;
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "daily");
  const [logTypeFilter, setLogTypeFilter] = useState("all");
  const [supplierCategory, setSupplierCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const locations = isHomeCook ? HOME_COOK_LOCATIONS : QUICK_LOCATIONS;
  const [logsDateFrom, setLogsDateFrom] = useState("");
  const [logsDateTo, setLogsDateTo] = useState("");
  const [receivingDateFrom, setReceivingDateFrom] = useState("");
  const [receivingDateTo, setReceivingDateTo] = useState("");
  
  // Data states
  const [logs, setLogs] = useState<SafetyLog[]>([]);
  const [cleaningAreas, setCleaningAreas] = useState<CleaningArea[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [logDialogOpen, setLogDialogOpen] = useState(false);
  const [areaDialogOpen, setAreaDialogOpen] = useState(false);
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [receivingDialogOpen, setReceivingDialogOpen] = useState(false);
  
  // Edit states
  const [editingLog, setEditingLog] = useState<SafetyLog | null>(null);
  const [editingArea, setEditingArea] = useState<CleaningArea | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingItem, setDeletingItem] = useState<{ type: string; item: SafetyLog | CleaningArea | Supplier } | null>(null);
  
  // Verification states
  const [verifyingArea, setVerifyingArea] = useState<CleaningArea | null>(null);
  const [verificationImage, setVerificationImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ status: string; notes: string } | null>(null);
  
  // Temp log states
  const [tempInputMode, setTempInputMode] = useState<"manual" | "snap" | "batch">("manual");
  const [tempLocation, setTempLocation] = useState<LocationType>("fridge");
  const [tempValue, setTempValue] = useState("");
  const [tempUnit, setTempUnit] = useState<"C" | "F">("C");
  const [tempNotes, setTempNotes] = useState("");
  const [tempCorrectiveAction, setTempCorrectiveAction] = useState("");
  const [isReadingTemp, setIsReadingTemp] = useState(false);
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  
  // Batch temp states
  const [batchEntries, setBatchEntries] = useState<{ location: LocationType; label: string; temp: string; status: "pass" | "warning" | "fail" | null }[]>(
    locations.map(q => ({ location: q.key, label: q.label, temp: "", status: null }))
  );
  
  // Receiving states
  const [receivingMode, setReceivingMode] = useState<"manual" | "snap_invoice" | "snap_temp">("manual");
  const [receivingSupplier, setReceivingSupplier] = useState("");
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([{ name: "", qty: "", temp: "", condition: "pass" }]);
  const [receivingChecklist, setReceivingChecklist] = useState({
    packaging_ok: true,
    temp_ok: true,
    dates_ok: true,
    vehicle_clean: true,
  });
  const [receivingNotes, setReceivingNotes] = useState("");
  const [isExtractingInvoice, setIsExtractingInvoice] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceFileRef = useRef<HTMLInputElement>(null);
  const tempPhotoRef = useRef<HTMLInputElement>(null);
  const invoicePhotoRef = useRef<HTMLInputElement>(null);
  const receivingTempPhotoRef = useRef<HTMLInputElement>(null);
  
  // Legacy log form (for cleaning type)
  const [logForm, setLogForm] = useState({
    log_type: "temperature" as SafetyLog["log_type"],
    location: "",
    readings: {} as Record<string, string>,
    status: "pass" as "pass" | "warning" | "fail",
    notes: "",
    corrective_action: "",
  });
  
  const [areaForm, setAreaForm] = useState({
    name: "",
    location: "",
    cleaning_frequency: "daily",
    instructions: "",
    reference_image_url: "",
  });
  
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    category: "Meat",
    products: "",
    rep_name: "",
    phone: "",
    email: "",
    website: "",
    credit_status: "pending",
  });
  
  const hasEditPermission = canEdit("food-safety");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [logsRes, areasRes, suppliersRes] = await Promise.all([
      supabase.from("food_safety_logs").select("*").order("date", { ascending: false }).order("time", { ascending: false }),
      supabase.from("cleaning_areas").select("*").order("name"),
      supabase.from("suppliers").select("*").order("name"),
    ]);

    if (logsRes.data) {
      setLogs(logsRes.data.map(log => ({
        ...log,
        readings: (log.readings || {}) as Record<string, unknown>,
        log_type: log.log_type as SafetyLog["log_type"],
        status: log.status as SafetyLog["status"],
        receiving_data: (log as any).receiving_data as Record<string, unknown> | null,
        temp_image_url: (log as any).temp_image_url as string | null,
      })));
    }
    if (areasRes.data) setCleaningAreas(areasRes.data);
    if (suppliersRes.data) setSuppliers(suppliersRes.data);
    
    setLoading(false);
  };

  // ---------- Photo Helpers ----------

  const uploadPhoto = async (file: File, folder: string): Promise<string | null> => {
    const fileName = `${folder}/${user?.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("cleaning-photos").upload(fileName, file);
    
    if (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from("cleaning-photos").getPublicUrl(fileName);
    return publicUrl;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ---------- Temperature Log Handlers ----------

  const autoDetectStatus = (val: string, loc: LocationType) => {
    const num = parseFloat(val);
    if (isNaN(num)) return null;
    let tempC = num;
    if (tempUnit === "F") {
      tempC = (num - 32) * 5 / 9;
    }
    return getAutoStatus(tempC, loc);
  };

  const handleTempPhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingTemp(true);
    setAiConfidence(null);

    try {
      // Upload for storage
      const uploadPromise = uploadPhoto(file, "temp-readings");
      const base64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke("read-temp-display", {
        body: { image_base64: base64, file_type: file.type },
      });

      if (error) throw error;

      const url = await uploadPromise;
      if (url) setTempPhotoUrl(url);

      if (data?.temperature !== undefined) {
        const readUnit = data.unit || "C";
        setTempUnit(readUnit);
        setTempValue(String(data.temperature));
        setAiConfidence(data.confidence);
        toast.success(`AI read: ${data.temperature}°${readUnit} (${Math.round((data.confidence || 0) * 100)}% confidence)`);
      } else {
        toast.error("Could not read temperature from photo");
      }
    } catch (err) {
      console.error("Temp reading error:", err);
      toast.error("Failed to read temperature");
    } finally {
      setIsReadingTemp(false);
    }
  };

  const handleSaveTempLog = async () => {
    if (tempInputMode === "batch") {
      // Save all batch entries that have a temp value
      const entries = batchEntries.filter(e => e.temp.trim());
      if (entries.length === 0) {
        toast.error("Enter at least one temperature");
        return;
      }

      for (const entry of entries) {
        const status = autoDetectStatus(entry.temp, entry.location) || "pass";
        await supabase.from("food_safety_logs").insert({
          log_type: "temperature",
          location: entry.label || TEMP_ZONES[entry.location].label,
          readings: { value: entry.temp, unit: tempUnit, location_type: entry.location },
          status,
          recorded_by: user?.id,
          recorded_by_name: user?.email?.split("@")[0] || "Unknown",
          date: new Date().toISOString().split("T")[0],
          time: new Date().toTimeString().split(" ")[0],
          org_id: currentOrg?.id || null,
        } as any);
      }

      toast.success(`${entries.length} temperature logs saved`);
      resetTempDialog();
      fetchData();
      return;
    }

    if (!tempValue.trim()) {
      toast.error("Enter a temperature");
      return;
    }

    const status = autoDetectStatus(tempValue, tempLocation) || "pass";

    const payload: any = {
      log_type: "temperature",
      location: TEMP_ZONES[tempLocation].label,
      readings: { value: tempValue, unit: tempUnit, location_type: tempLocation },
      status,
      notes: tempNotes || null,
      corrective_action: (status !== "pass" && tempCorrectiveAction) ? tempCorrectiveAction : null,
      recorded_by: user?.id,
      recorded_by_name: user?.email?.split("@")[0] || "Unknown",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0],
      temp_image_url: tempPhotoUrl || null,
      org_id: currentOrg?.id || null,
    };

    const { error } = await supabase.from("food_safety_logs").insert(payload);
    if (error) {
      toast.error("Failed to save log");
      return;
    }

    toast.success("Temperature logged");
    resetTempDialog();
    fetchData();
  };

  const resetTempDialog = () => {
    setLogDialogOpen(false);
    setTempInputMode("manual");
    setTempLocation("fridge");
    setTempValue("");
    setTempUnit("C");
    setTempNotes("");
    setTempCorrectiveAction("");
    setTempPhotoUrl(null);
    setAiConfidence(null);
    setBatchEntries(locations.map(q => ({ location: q.key, label: q.label, temp: "", status: null })));
    setEditingLog(null);
  };

  const openQuickTempLog = (locType: LocationType) => {
    setTempLocation(locType);
    setTempInputMode("manual");
    setLogForm({ ...logForm, log_type: "temperature" });
    setLogDialogOpen(true);
  };

  // ---------- Receiving Log Handlers ----------

  const handleInvoicePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtractingInvoice(true);

    try {
      const base64 = await fileToBase64(file);

      const { data, error } = await supabase.functions.invoke("extract-invoice", {
        body: { image_base64: base64, file_type: file.type, existing_ingredients: [] },
      });

      if (error) throw error;

      if (data?.items && data.items.length > 0) {
        setReceivingItems(
          data.items.map((item: any) => ({
            name: item.name || "",
            qty: String(item.quantity || ""),
            temp: "",
            condition: "pass" as const,
          }))
        );
        // Try to extract supplier from the first few items or use generic
        if (data.supplier) {
          setReceivingSupplier(data.supplier);
        }
        toast.success(`AI extracted ${data.items.length} items`);
      } else {
        toast.error("Could not extract items from photo");
      }
    } catch (err) {
      console.error("Invoice extraction error:", err);
      toast.error("Failed to extract invoice data");
    } finally {
      setIsExtractingInvoice(false);
    }
  };

  const handleReceivingTempPhoto = async (e: React.ChangeEvent<HTMLInputElement>, itemIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("read-temp-display", {
        body: { image_base64: base64, file_type: file.type },
      });
      if (error) throw error;

      if (data?.temperature !== undefined) {
        const updated = [...receivingItems];
        updated[itemIndex] = { ...updated[itemIndex], temp: `${data.temperature}°${data.unit || "C"}` };
        setReceivingItems(updated);
        toast.success(`AI read: ${data.temperature}°${data.unit || "C"}`);
      }
    } catch {
      toast.error("Failed to read temperature");
    }
  };

  const handleSaveReceiving = async () => {
    if (!receivingSupplier.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    const allPass = receivingChecklist.packaging_ok && receivingChecklist.temp_ok && receivingChecklist.dates_ok && receivingChecklist.vehicle_clean
      && receivingItems.every(i => i.condition === "pass");

    const payload: any = {
      log_type: "receiving",
      location: receivingSupplier,
      status: allPass ? "pass" : "fail",
      notes: receivingNotes || null,
      recorded_by: user?.id,
      recorded_by_name: user?.email?.split("@")[0] || "Unknown",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0],
      receiving_data: {
        supplier: receivingSupplier,
        items: receivingItems.filter(i => i.name.trim()),
        ...receivingChecklist,
      },
      org_id: currentOrg?.id || null,
    };

    const { error } = await supabase.from("food_safety_logs").insert(payload);
    if (error) {
      toast.error("Failed to save receiving log");
      return;
    }

    toast.success("Receiving log saved");
    resetReceivingDialog();
    fetchData();
  };

  const resetReceivingDialog = () => {
    setReceivingDialogOpen(false);
    setReceivingMode("manual");
    setReceivingSupplier("");
    setReceivingItems([{ name: "", qty: "", temp: "", condition: "pass" }]);
    setReceivingChecklist({ packaging_ok: true, temp_ok: true, dates_ok: true, vehicle_clean: true });
    setReceivingNotes("");
  };

  // ---------- Legacy Handlers (cleaning, suppliers, etc.) ----------

  const handleSaveLog = async () => {
    if (!logForm.location.trim()) {
      toast.error("Location is required");
      return;
    }

    const payload = {
      log_type: logForm.log_type,
      location: logForm.location,
      readings: logForm.readings,
      status: logForm.status,
      notes: logForm.notes || null,
      corrective_action: logForm.corrective_action || null,
      recorded_by: user?.id,
      recorded_by_name: user?.email?.split("@")[0] || "Unknown",
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().split(" ")[0],
      org_id: currentOrg?.id || null,
    };

    if (editingLog) {
      const { error } = await supabase.from("food_safety_logs").update(payload).eq("id", editingLog.id);
      if (error) { toast.error("Failed to update log"); return; }
      toast.success("Log updated");
    } else {
      const { error } = await supabase.from("food_safety_logs").insert(payload);
      if (error) { toast.error("Failed to create log"); return; }
      toast.success("Log created");
    }

    resetLogForm();
    fetchData();
  };

  const resetLogForm = () => {
    setLogDialogOpen(false);
    setEditingLog(null);
    setLogForm({ log_type: "temperature", location: "", readings: {}, status: "pass", notes: "", corrective_action: "" });
  };

  const handleSaveArea = async () => {
    if (!areaForm.name.trim()) { toast.error("Area name is required"); return; }
    const payload = {
      name: areaForm.name, location: areaForm.location || null,
      cleaning_frequency: areaForm.cleaning_frequency, instructions: areaForm.instructions || null,
      reference_image_url: areaForm.reference_image_url || null,
    };
    if (editingArea) {
      const { error } = await supabase.from("cleaning_areas").update(payload).eq("id", editingArea.id);
      if (error) { toast.error("Failed to update area"); return; }
      toast.success("Area updated");
    } else {
      const { error } = await supabase.from("cleaning_areas").insert(payload);
      if (error) { toast.error("Failed to create area"); return; }
      toast.success("Area created");
    }
    resetAreaForm();
    fetchData();
  };

  const resetAreaForm = () => {
    setAreaDialogOpen(false); setEditingArea(null);
    setAreaForm({ name: "", location: "", cleaning_frequency: "daily", instructions: "", reference_image_url: "" });
  };

  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) { toast.error("Supplier name is required"); return; }
    const payload = {
      name: supplierForm.name, category: supplierForm.category,
      products: supplierForm.products || null, rep_name: supplierForm.rep_name || null,
      phone: supplierForm.phone || null, email: supplierForm.email || null,
      website: supplierForm.website || null, credit_status: supplierForm.credit_status,
    };
    if (editingSupplier) {
      const { error } = await supabase.from("suppliers").update(payload).eq("id", editingSupplier.id);
      if (error) { toast.error("Failed to update supplier"); return; }
      toast.success("Supplier updated");
    } else {
      const { error } = await supabase.from("suppliers").insert(payload);
      if (error) { toast.error("Failed to create supplier"); return; }
      toast.success("Supplier created");
    }
    resetSupplierForm();
    fetchData();
  };

  const resetSupplierForm = () => {
    setSupplierDialogOpen(false); setEditingSupplier(null);
    setSupplierForm({ name: "", category: "Meat", products: "", rep_name: "", phone: "", email: "", website: "", credit_status: "pending" });
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    let error;
    if (deletingItem.type === "log") {
      ({ error } = await supabase.from("food_safety_logs").delete().eq("id", (deletingItem.item as SafetyLog).id));
    } else if (deletingItem.type === "area") {
      ({ error } = await supabase.from("cleaning_areas").delete().eq("id", (deletingItem.item as CleaningArea).id));
    } else if (deletingItem.type === "supplier") {
      ({ error } = await supabase.from("suppliers").delete().eq("id", (deletingItem.item as Supplier).id));
    }
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Deleted successfully");
    setDeleteDialogOpen(false); setDeletingItem(null);
    fetchData();
  };

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.loading("Uploading reference photo...");
    const url = await uploadPhoto(file, "references");
    toast.dismiss();
    if (url) { setAreaForm({ ...areaForm, reference_image_url: url }); toast.success("Reference photo uploaded"); }
  };

  const handleVerificationPhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.loading("Uploading verification photo...");
    const url = await uploadPhoto(file, "verifications");
    toast.dismiss();
    if (url) { setVerificationImage(url); toast.success("Photo uploaded"); }
  };

  const handleVerify = async () => {
    if (!verifyingArea?.reference_image_url || !verificationImage) {
      toast.error("Both reference and verification photos are required"); return;
    }
    setIsVerifying(true); setVerificationResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("verify-cleaning", {
        body: { referenceImageUrl: verifyingArea.reference_image_url, verificationImageUrl: verificationImage, areaName: verifyingArea.name },
      });
      if (error) throw error;
      setVerificationResult({ status: data.status, notes: data.notes });
      await supabase.from("food_safety_logs").insert({
        log_type: "cleaning", location: verifyingArea.name,
        status: data.status === "approved" ? "pass" : "fail",
        recorded_by: user?.id, recorded_by_name: user?.email?.split("@")[0] || "Unknown",
        date: new Date().toISOString().split("T")[0], time: new Date().toTimeString().split(" ")[0],
        reference_image_url: verifyingArea.reference_image_url, verification_image_url: verificationImage,
        ai_verification_status: data.status, ai_verification_notes: data.notes,
        notes: `AI Verification: ${data.notes}`,
      });
      toast.success(data.status === "approved" ? "Cleaning approved!" : "Cleaning needs attention");
      fetchData();
    } catch (err) {
      console.error("Verification error:", err); toast.error("Verification failed");
    } finally { setIsVerifying(false); }
  };

  const resetVerification = () => {
    setVerifyDialogOpen(false); setVerifyingArea(null);
    setVerificationImage(null); setVerificationResult(null);
  };

  // ---------- Computed ----------

  const filteredLogs = logs.filter(log => {
    if (logTypeFilter !== "all" && log.log_type !== logTypeFilter) return false;
    if (logsDateFrom && log.date < logsDateFrom) return false;
    if (logsDateTo && log.date > logsDateTo) return false;
    return true;
  });
  const filteredSuppliers = suppliers.filter(s => {
    const matchesCategory = supplierCategory === "All" || s.category === supplierCategory;
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.products?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const today = new Date().toISOString().split("T")[0];
  const todayTempLogs = logs.filter(l => l.log_type === "temperature" && l.date === today);
  const todayReceivingLogs = logs.filter(l => l.log_type === "receiving" && l.date === today);
  const passedCount = logs.filter(l => l.status === "pass").length;
  const warningCount = logs.filter(l => l.status === "warning" || l.status === "fail").length;

  const currentTempStatus = autoDetectStatus(tempValue, tempLocation);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* BCC Eat Safe Toggle Banner — hidden for GCC variant */}
        {!isGCC && <div className="flex items-center justify-between p-3 rounded-lg border border-[#000080]/20 bg-[#000080]/5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#000080] text-white">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#000080]">BCC Eat Safe Certified Mode</p>
              <p className="text-xs text-muted-foreground">Full FSANZ 3.2.2A compliance system</p>
            </div>
          </div>
          <Switch
            checked={bccEnabled}
            onCheckedChange={(v) => updateSettings({ bccEatSafeEnabled: v })}
          />
        </div>}

        {/* GCC Dashboard OR BCC Dashboard OR Original Module */}
        {isGCC ? (
          <GCCFoodSafetyDashboard />
        ) : bccEnabled ? (
          <BCCFoodSafetyDashboard isHomeCook={isHomeCook} />
        ) : (
        <>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title font-display">{isHomeCook ? "Safety Checks" : "Food Safety"}</h1>
            <p className="page-subtitle">{isHomeCook ? "Quick safety checks for your kitchen" : "HACCP compliance, logs & approved suppliers"}</p>
          </div>
        </motion.div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className={cn("grid w-full", isHomeCook ? "grid-cols-4" : "grid-cols-6")}>
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Daily</span>
            </TabsTrigger>
            {!isHomeCook && (
              <TabsTrigger value="roster" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Roster</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="cleaning" className="flex items-center gap-2">
              <SprayCan className="w-4 h-4" />
              <span className="hidden sm:inline">Cleaning</span>
            </TabsTrigger>
            {!isHomeCook && (
              <TabsTrigger value="receiving" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Receiving</span>
              </TabsTrigger>
            )}
            {!isHomeCook && (
              <TabsTrigger value="suppliers" className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                <span className="hidden sm:inline">Suppliers</span>
              </TabsTrigger>
            )}
            {/* Docket scanner moved to Kitchen > Ingredients for home cooks */}
          </TabsList>

          {/* ===================== DAILY CHECKS TAB ===================== */}
          <TabsContent value="daily" className="space-y-4">
            <DailyTempChecks />
          </TabsContent>

          {/* ===================== DUTY ROSTER TAB ===================== */}
          <TabsContent value="roster" className="space-y-4">
            <DutyRosterTab />
          </TabsContent>

          {/* ===================== LOGS TAB ===================== */}
          <TabsContent value="logs" className="space-y-4">
            {/* Today's Summary */}
            <div className="card-elevated p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground">Today's Checks</h3>
                <Badge variant={todayTempLogs.length >= TODAY_TARGET ? "default" : "secondary"}>
                  {todayTempLogs.length} / {TODAY_TARGET}
                </Badge>
              </div>
              <Progress value={Math.min((todayTempLogs.length / TODAY_TARGET) * 100, 100)} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {todayTempLogs.length >= TODAY_TARGET
                  ? "All temperature checks complete ✓"
                  : `${TODAY_TARGET - todayTempLogs.length} more checks needed today`}
              </p>
            </div>

            {/* Quick-Log Buttons */}
            {hasEditPermission && (
              <div className="flex flex-wrap gap-2">
                {locations.map((q, i) => (
                  <Button key={`${q.key}-${i}`} variant="outline" size="sm" onClick={() => openQuickTempLog(q.key)} className="gap-2">
                    {TEMP_ZONES[q.key].icon}
                    {q.label}
                  </Button>
                ))}
                <Button size="sm" onClick={() => { setLogForm({ ...logForm, log_type: "temperature" }); setLogDialogOpen(true); }} className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Log
                </Button>
              </div>
            )}

            {/* Filter buttons + Date Range */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex gap-2 flex-wrap">
                {["all", ...logTypes.map(t => t.value)].map(type => (
                  <button key={type} onClick={() => setLogTypeFilter(type)}
                    className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                      logTypeFilter === type ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
                    )}>
                    {type === "all" ? "All" : logTypes.find(t => t.value === type)?.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input type="date" value={logsDateFrom} onChange={e => setLogsDateFrom(e.target.value)} className="w-auto h-8 text-xs" />
                <span className="text-xs text-muted-foreground">to</span>
                <Input type="date" value={logsDateTo} onChange={e => setLogsDateTo(e.target.value)} className="w-auto h-8 text-xs" />
                {(logsDateFrom || logsDateTo) && (
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => { setLogsDateFrom(""); setLogsDateTo(""); }}>
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className={cn("grid gap-4", isHomeCook ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-4")}>
              <div className="stat-card">
                <div className="p-2 rounded-lg bg-success/10 w-fit"><CheckCircle2 className="w-5 h-5 text-success" /></div>
                <div><p className="stat-value">{passedCount}</p><p className="stat-label">Passed</p></div>
              </div>
              <div className="stat-card">
                <div className="p-2 rounded-lg bg-warning/10 w-fit"><AlertTriangle className="w-5 h-5 text-warning" /></div>
                <div><p className="stat-value">{warningCount}</p><p className="stat-label">Warnings</p></div>
              </div>
              <div className="stat-card">
                <div className="p-2 rounded-lg bg-primary/10 w-fit"><Thermometer className="w-5 h-5 text-primary" /></div>
                <div><p className="stat-value">{todayTempLogs.length}</p><p className="stat-label">Today Temps</p></div>
              </div>
              {!isHomeCook && (
                <div className="stat-card">
                  <div className="p-2 rounded-lg bg-primary/10 w-fit"><Package className="w-5 h-5 text-primary" /></div>
                  <div><p className="stat-value">{todayReceivingLogs.length}</p><p className="stat-label">Deliveries Today</p></div>
                </div>
              )}
            </div>

            {/* Logs List */}
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="card-elevated overflow-hidden">
                <div className="divide-y divide-border">
                  {filteredLogs.map((log) => {
                    const style = statusStyles[log.status || "pass"];
                    const StatusIcon = style.icon;
                    const typeInfo = logTypes.find(t => t.value === log.log_type);
                    const reading = log.readings as Record<string, any> | null;
                    
                    return (
                      <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                        <div className={cn("p-2.5 rounded-xl", style.bg)}>
                          <StatusIcon className={cn("w-5 h-5", style.text)} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground">{log.location}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">{typeInfo?.label}</p>
                            {reading?.value && (
                              <Badge variant="outline" className="text-xs">{reading.value}°{reading.unit || "C"}</Badge>
                            )}
                          </div>
                        </div>

                        {log.ai_verification_status && (
                          <span className={cn("px-2 py-0.5 rounded-full text-xs",
                            log.ai_verification_status === "approved" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                          )}>AI {log.ai_verification_status}</span>
                        )}

                        <div className="text-right flex-shrink-0">
                          <p className="text-sm text-foreground">{log.recorded_by_name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" />{log.time?.slice(0, 5)}
                          </p>
                        </div>

                        {hasEditPermission && (
                          <div className="flex gap-1">
                            <button onClick={() => {
                              setEditingLog(log);
                              setLogForm({ log_type: log.log_type, location: log.location || "", readings: log.readings as Record<string, string> || {},
                                status: log.status || "pass", notes: log.notes || "", corrective_action: log.corrective_action || "" });
                              setLogDialogOpen(true);
                            }} className="p-2 rounded-lg hover:bg-muted">
                              <Pencil className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button onClick={() => { setDeletingItem({ type: "log", item: log }); setDeleteDialogOpen(true); }}
                              className="p-2 rounded-lg hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {filteredLogs.length === 0 && <div className="p-8 text-center text-muted-foreground">No logs found</div>}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ===================== CLEANING TAB ===================== */}
          <TabsContent value="cleaning" className="space-y-4">
            <BCCCleaningLog />
          </TabsContent>

          {/* ===================== RECEIVING TAB ===================== */}
          <TabsContent value="receiving" className="space-y-4">
            <BCCReceivingLog />
          </TabsContent>

          {/* ===================== SUPPLIERS TAB ===================== */}
          <TabsContent value="suppliers" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder="Search suppliers..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              {hasEditPermission && <Button onClick={() => setSupplierDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Supplier</Button>}
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button key={cat} onClick={() => setSupplierCategory(cat)}
                  className={cn("px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    supplierCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-secondary"
                  )}>{cat}</button>
              ))}
            </div>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <div className="grid gap-3">
                {filteredSuppliers.map((supplier) => (
                  <div key={supplier.id} className="card-elevated p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{supplier.name}</h3>
                        {supplier.credit_status && (
                          <span className={cn("px-2 py-0.5 rounded-full text-xs capitalize", creditStyles[supplier.credit_status]?.bg, creditStyles[supplier.credit_status]?.text)}>
                            {supplier.credit_status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{supplier.products}</p>
                      {supplier.rep_name && <p className="text-xs text-muted-foreground">Rep: {supplier.rep_name}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {supplier.phone && <a href={`tel:${supplier.phone}`} className="p-2 rounded-lg hover:bg-muted"><Phone className="w-4 h-4 text-muted-foreground" /></a>}
                      {supplier.email && <a href={`mailto:${supplier.email}`} className="p-2 rounded-lg hover:bg-muted"><Mail className="w-4 h-4 text-muted-foreground" /></a>}
                      {supplier.website && <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-muted"><ExternalLink className="w-4 h-4 text-muted-foreground" /></a>}
                      {hasEditPermission && (
                        <>
                          <button onClick={() => {
                            setEditingSupplier(supplier);
                            setSupplierForm({ name: supplier.name, category: supplier.category, products: supplier.products || "", rep_name: supplier.rep_name || "",
                              phone: supplier.phone || "", email: supplier.email || "", website: supplier.website || "", credit_status: supplier.credit_status || "pending" });
                            setSupplierDialogOpen(true);
                          }} className="p-2 rounded-lg hover:bg-muted"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
                          <button onClick={() => { setDeletingItem({ type: "supplier", item: supplier }); setDeleteDialogOpen(true); }} className="p-2 rounded-lg hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {filteredSuppliers.length === 0 && (
                  <div className="card-elevated p-12 text-center">
                    <Truck className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No suppliers found</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Docket scanner moved to Kitchen > Ingredients for home cooks */}
        </Tabs>

        {/* ===================== SMART TEMP LOG DIALOG ===================== */}
        <Dialog open={logDialogOpen} onOpenChange={(open) => { if (!open) resetTempDialog(); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLog ? "Edit Log" : "Smart Temperature Log"}</DialogTitle>
              <DialogDescription>Log a temperature check manually, snap a photo, or batch entry.</DialogDescription>
            </DialogHeader>

            {/* If editing a legacy log, show the old form */}
            {editingLog ? (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Log Type</Label>
                  <Select value={logForm.log_type} onValueChange={(v: SafetyLog["log_type"]) => setLogForm({ ...logForm, log_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{logTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Location *</Label><Input value={logForm.location} onChange={(e) => setLogForm({ ...logForm, location: e.target.value })} /></div>
                {logForm.log_type === "temperature" && (
                  <div className="space-y-2"><Label>Temperature Reading</Label><Input value={logForm.readings.value as string || ""} onChange={(e) => setLogForm({ ...logForm, readings: { value: e.target.value } })} placeholder="e.g., 3°C" /></div>
                )}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={logForm.status} onValueChange={(v: "pass" | "warning" | "fail") => setLogForm({ ...logForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="pass">Pass</SelectItem><SelectItem value="warning">Warning</SelectItem><SelectItem value="fail">Fail</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} /></div>
                {logForm.status !== "pass" && (
                  <div className="space-y-2"><Label>Corrective Action</Label><Textarea value={logForm.corrective_action} onChange={(e) => setLogForm({ ...logForm, corrective_action: e.target.value })} /></div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={resetTempDialog}>Cancel</Button>
                  <Button onClick={handleSaveLog}>Save</Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                {/* Input Mode Selector */}
                <div className="flex gap-2">
                  {[
                    { key: "manual" as const, label: "Manual", icon: <Thermometer className="w-4 h-4" /> },
                    { key: "snap" as const, label: "Snap Temp", icon: <Camera className="w-4 h-4" /> },
                    { key: "batch" as const, label: "Batch", icon: <FileCheck className="w-4 h-4" /> },
                  ].map(m => (
                    <button key={m.key} onClick={() => setTempInputMode(m.key)}
                      className={cn("flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all border",
                        tempInputMode === m.key ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:bg-secondary"
                      )}>
                      {m.icon}{m.label}
                    </button>
                  ))}
                </div>

                {/* Location Selector (for manual and snap modes) */}
                {tempInputMode !== "batch" && (
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select value={tempLocation} onValueChange={(v) => setTempLocation(v as LocationType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TEMP_ZONES).map(([key, zone]) => (
                          <SelectItem key={key} value={key}>{zone.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* MANUAL MODE */}
                {tempInputMode === "manual" && (
                  <div className="space-y-4">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Temperature</Label>
                        <Input type="number" step="0.1" value={tempValue}
                          onChange={(e) => setTempValue(e.target.value)} placeholder="e.g., 3.5"
                          className="text-2xl font-bold h-14 text-center" />
                      </div>
                      <button onClick={() => setTempUnit(tempUnit === "C" ? "F" : "C")}
                        className="h-14 px-4 rounded-lg border bg-muted text-lg font-bold hover:bg-secondary transition-colors">
                        °{tempUnit}
                      </button>
                    </div>

                    {/* Auto-status indicator */}
                    {tempValue && currentTempStatus && (
                      <div className={cn("p-3 rounded-lg flex items-center gap-2",
                        currentTempStatus === "pass" ? "bg-success/10" : currentTempStatus === "warning" ? "bg-warning/10" : "bg-destructive/10"
                      )}>
                        {currentTempStatus === "pass" ? <CheckCircle2 className="w-5 h-5 text-success" /> :
                          <AlertTriangle className={cn("w-5 h-5", currentTempStatus === "warning" ? "text-warning" : "text-destructive")} />}
                        <span className="font-medium capitalize">{currentTempStatus}</span>
                        <span className="text-sm text-muted-foreground ml-auto">
                          Safe range: {TEMP_ZONES[tempLocation].pass[0]}–{TEMP_ZONES[tempLocation].pass[1]}°C
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* SNAP MODE */}
                {tempInputMode === "snap" && (
                  <div className="space-y-4">
                    <input type="file" accept="image/*" capture="environment" ref={tempPhotoRef} className="hidden"
                      onChange={handleTempPhotoCapture} />
                    
                    <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => tempPhotoRef.current?.click()}>
                      {isReadingTemp ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground">AI reading temperature...</p>
                        </div>
                      ) : tempPhotoUrl ? (
                        <div className="space-y-2">
                          <img src={tempPhotoUrl} alt="Temp display" className="max-h-40 mx-auto rounded-lg" />
                          <p className="text-xs text-muted-foreground">Tap to retake</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Camera className="w-10 h-10 text-muted-foreground" />
                          <p className="text-sm font-medium">Snap thermometer display</p>
                          <p className="text-xs text-muted-foreground">AI will read the temperature automatically</p>
                        </div>
                      )}
                    </div>

                    {tempValue && (
                      <div className="flex gap-2 items-end">
                        <div className="flex-1 space-y-2">
                          <Label>AI Reading (editable)</Label>
                          <Input type="number" step="0.1" value={tempValue} onChange={(e) => setTempValue(e.target.value)}
                            className="text-2xl font-bold h-14 text-center" />
                        </div>
                        <div className="text-center pb-2">
                          <span className="text-lg font-bold">°{tempUnit}</span>
                          {aiConfidence !== null && (
                            <p className="text-xs text-muted-foreground">{Math.round(aiConfidence * 100)}% confident</p>
                          )}
                        </div>
                      </div>
                    )}

                    {tempValue && currentTempStatus && (
                      <div className={cn("p-3 rounded-lg flex items-center gap-2",
                        currentTempStatus === "pass" ? "bg-success/10" : currentTempStatus === "warning" ? "bg-warning/10" : "bg-destructive/10"
                      )}>
                        {currentTempStatus === "pass" ? <CheckCircle2 className="w-5 h-5 text-success" /> :
                          <AlertTriangle className={cn("w-5 h-5", currentTempStatus === "warning" ? "text-warning" : "text-destructive")} />}
                        <span className="font-medium capitalize">{currentTempStatus}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* BATCH MODE */}
                {tempInputMode === "batch" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Batch Temperature Entry</Label>
                      <button onClick={() => setTempUnit(tempUnit === "C" ? "F" : "C")}
                        className="px-3 py-1 rounded-lg border bg-muted text-sm font-bold hover:bg-secondary">°{tempUnit}</button>
                    </div>
                    {batchEntries.map((entry, i) => {
                      const entryStatus = entry.temp ? autoDetectStatus(entry.temp, entry.location) : null;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            {TEMP_ZONES[entry.location].icon}
                            <span className="text-sm font-medium">{entry.label}</span>
                          </div>
                          <Input type="number" step="0.1" value={entry.temp} placeholder="--"
                            onChange={(e) => {
                              const updated = [...batchEntries];
                              updated[i] = { ...updated[i], temp: e.target.value };
                              setBatchEntries(updated);
                            }}
                            className="w-24 text-center font-bold" />
                          {entryStatus && (
                            <div className={cn("p-1 rounded",
                              entryStatus === "pass" ? "bg-success/10" : entryStatus === "warning" ? "bg-warning/10" : "bg-destructive/10"
                            )}>
                              {entryStatus === "pass" ? <CheckCircle2 className="w-4 h-4 text-success" /> :
                                <AlertTriangle className={cn("w-4 h-4", entryStatus === "warning" ? "text-warning" : "text-destructive")} />}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Notes & corrective action for all modes */}
                {tempInputMode !== "batch" && (
                  <>
                    <div className="space-y-2"><Label>Notes</Label><Textarea value={tempNotes} onChange={(e) => setTempNotes(e.target.value)} placeholder="Optional notes..." /></div>
                    {currentTempStatus && currentTempStatus !== "pass" && (
                      <div className="space-y-2"><Label className="text-destructive">Corrective Action Required</Label>
                        <Textarea value={tempCorrectiveAction} onChange={(e) => setTempCorrectiveAction(e.target.value)} placeholder="What action was taken?" />
                      </div>
                    )}
                  </>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={resetTempDialog}>Cancel</Button>
                  <Button onClick={handleSaveTempLog} disabled={isReadingTemp}>
                    <Save className="w-4 h-4 mr-2" />{tempInputMode === "batch" ? "Save All" : "Save Log"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ===================== RECEIVING DIALOG ===================== */}
        <Dialog open={receivingDialogOpen} onOpenChange={(open) => { if (!open) resetReceivingDialog(); }}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Log Delivery</DialogTitle>
              <DialogDescription>Record a delivery with AI-assisted invoice scanning or manual entry.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Input Mode */}
              <div className="flex gap-2">
                {[
                  { key: "manual" as const, label: "Manual", icon: <FileText className="w-4 h-4" /> },
                  { key: "snap_invoice" as const, label: "Snap Invoice", icon: <Camera className="w-4 h-4" /> },
                ].map(m => (
                  <button key={m.key} onClick={() => setReceivingMode(m.key)}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all border",
                      receivingMode === m.key ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:bg-secondary"
                    )}>
                    {m.icon}{m.label}
                  </button>
                ))}
              </div>

              {/* Snap Invoice */}
              {receivingMode === "snap_invoice" && (
                <>
                  <input type="file" accept="image/*" capture="environment" ref={invoicePhotoRef} className="hidden" onChange={handleInvoicePhotoCapture} />
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => invoicePhotoRef.current?.click()}>
                    {isExtractingInvoice ? (
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">AI extracting delivery note...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="w-10 h-10 text-muted-foreground" />
                        <p className="text-sm font-medium">Snap delivery note / invoice</p>
                        <p className="text-xs text-muted-foreground">AI will extract supplier & items</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Supplier */}
              <div className="space-y-2">
                <Label>Supplier *</Label>
                <Input value={receivingSupplier} onChange={(e) => setReceivingSupplier(e.target.value)} placeholder="Supplier name" />
              </div>

              {/* Items */}
              <div className="space-y-2">
                <Label>Items Received</Label>
                {receivingItems.map((item, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input value={item.name} onChange={(e) => {
                      const updated = [...receivingItems]; updated[i] = { ...updated[i], name: e.target.value }; setReceivingItems(updated);
                    }} placeholder="Item name" className="flex-1" />
                    <Input value={item.qty} onChange={(e) => {
                      const updated = [...receivingItems]; updated[i] = { ...updated[i], qty: e.target.value }; setReceivingItems(updated);
                    }} placeholder="Qty" className="w-16" />
                    <div className="flex items-center gap-1">
                      <Input value={item.temp} onChange={(e) => {
                        const updated = [...receivingItems]; updated[i] = { ...updated[i], temp: e.target.value }; setReceivingItems(updated);
                      }} placeholder="Temp" className="w-16" />
                      <input type="file" accept="image/*" capture="environment" ref={receivingTempPhotoRef} className="hidden"
                        onChange={(e) => handleReceivingTempPhoto(e, i)} />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => receivingTempPhotoRef.current?.click()}>
                        <Camera className="w-4 h-4" />
                      </Button>
                    </div>
                    <button onClick={() => {
                      const updated = [...receivingItems]; updated[i] = { ...updated[i], condition: updated[i].condition === "pass" ? "fail" : "pass" }; setReceivingItems(updated);
                    }} className={cn("p-1.5 rounded-lg", item.condition === "pass" ? "bg-success/10" : "bg-destructive/10")}>
                      {item.condition === "pass" ? <CheckCircle2 className="w-4 h-4 text-success" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
                    </button>
                    {receivingItems.length > 1 && (
                      <button onClick={() => setReceivingItems(receivingItems.filter((_, j) => j !== i))} className="p-1"><X className="w-4 h-4 text-muted-foreground" /></button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setReceivingItems([...receivingItems, { name: "", qty: "", temp: "", condition: "pass" }])}>
                  <Plus className="w-4 h-4 mr-1" />Add Item
                </Button>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                <Label>Receiving Checklist</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "packaging_ok" as const, label: "Packaging intact" },
                    { key: "temp_ok" as const, label: "Temperature OK" },
                    { key: "dates_ok" as const, label: "Best-before dates OK" },
                    { key: "vehicle_clean" as const, label: "Vehicle clean" },
                  ].map(check => (
                    <label key={check.key} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={receivingChecklist[check.key]}
                        onCheckedChange={(v) => setReceivingChecklist({ ...receivingChecklist, [check.key]: !!v })} />
                      <span className="text-sm">{check.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={receivingNotes} onChange={(e) => setReceivingNotes(e.target.value)} placeholder="Any issues or notes..." />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={resetReceivingDialog}>Cancel</Button>
                <Button onClick={handleSaveReceiving}><Save className="w-4 h-4 mr-2" />Save Delivery</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* ===================== LEGACY DIALOGS ===================== */}
        {/* Area Dialog */}
        <Dialog open={areaDialogOpen} onOpenChange={resetAreaForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingArea ? "Edit Cleaning Area" : "New Cleaning Area"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>Area Name *</Label><Input value={areaForm.name} onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })} placeholder="e.g., Prep Station 1" /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={areaForm.location} onChange={(e) => setAreaForm({ ...areaForm, location: e.target.value })} placeholder="e.g., Main Kitchen" /></div>
              <div className="space-y-2">
                <Label>Cleaning Frequency</Label>
                <Select value={areaForm.cleaning_frequency} onValueChange={(v) => setAreaForm({ ...areaForm, cleaning_frequency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="hourly">Hourly</SelectItem><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference Photo</Label>
                <div className="flex gap-2">
                  <input type="file" accept="image/*" ref={referenceFileRef} className="hidden" onChange={handleReferenceUpload} />
                  <Button type="button" variant="outline" onClick={() => referenceFileRef.current?.click()}><Camera className="w-4 h-4 mr-2" />Upload Reference</Button>
                  {areaForm.reference_image_url && <img src={areaForm.reference_image_url} alt="Reference" className="w-16 h-16 object-cover rounded" />}
                </div>
              </div>
              <div className="space-y-2"><Label>Instructions</Label><Textarea value={areaForm.instructions} onChange={(e) => setAreaForm({ ...areaForm, instructions: e.target.value })} placeholder="Cleaning instructions..." /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={resetAreaForm}>Cancel</Button><Button onClick={handleSaveArea}>{editingArea ? "Save" : "Create"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Supplier Dialog */}
        <Dialog open={supplierDialogOpen} onOpenChange={resetSupplierForm}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Name *</Label><Input value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={supplierForm.category} onValueChange={(v) => setSupplierForm({ ...supplierForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2"><Label>Products</Label><Input value={supplierForm.products} onChange={(e) => setSupplierForm({ ...supplierForm, products: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Rep Name</Label><Input value={supplierForm.rep_name} onChange={(e) => setSupplierForm({ ...supplierForm, rep_name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input value={supplierForm.email} onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })} /></div>
                <div className="space-y-2"><Label>Website</Label><Input value={supplierForm.website} onChange={(e) => setSupplierForm({ ...supplierForm, website: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Credit Status</Label>
                <Select value={supplierForm.credit_status} onValueChange={(v) => setSupplierForm({ ...supplierForm, credit_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="pending">Pending</SelectItem><SelectItem value="applied">Applied</SelectItem><SelectItem value="approved">Approved</SelectItem><SelectItem value="done">Done</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={resetSupplierForm}>Cancel</Button><Button onClick={handleSaveSupplier}>{editingSupplier ? "Save" : "Add"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Verification Dialog */}
        <Dialog open={verifyDialogOpen} onOpenChange={resetVerification}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Verify Cleaning: {verifyingArea?.name}</DialogTitle>
              <DialogDescription>Take a photo of the cleaned area. AI will compare it to the reference photo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Reference (Clean)</Label>
                  {verifyingArea?.reference_image_url && <img src={verifyingArea.reference_image_url} alt="Reference" className="w-full h-40 object-cover rounded-lg mt-1" />}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Your Photo</Label>
                  {verificationImage ? (
                    <img src={verificationImage} alt="Verification" className="w-full h-40 object-cover rounded-lg mt-1" />
                  ) : (
                    <div className="w-full h-40 bg-muted rounded-lg mt-1 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80"
                      onClick={() => fileInputRef.current?.click()}>
                      <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">Take Photo</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleVerificationPhotoCapture} />
                </div>
              </div>
              {verificationResult && (
                <div className={cn("p-4 rounded-lg", verificationResult.status === "approved" ? "bg-success/10" : "bg-destructive/10")}>
                  <div className="flex items-center gap-2 mb-2">
                    {verificationResult.status === "approved" ? <CheckCircle2 className="w-5 h-5 text-success" /> : <AlertTriangle className="w-5 h-5 text-destructive" />}
                    <span className="font-semibold capitalize">{verificationResult.status}</span>
                  </div>
                  <p className="text-sm">{verificationResult.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetVerification}>Cancel</Button>
              {!verificationResult && (
                <Button onClick={handleVerify} disabled={!verificationImage || isVerifying}>
                  {isVerifying ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Verify with AI</>}
                </Button>
              )}
              {verificationResult && <Button onClick={resetVerification}>Done</Button>}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={deleteDialogOpen} onOpenChange={() => setDeleteDialogOpen(false)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
            <p className="text-muted-foreground">Are you sure you want to delete this item? This action cannot be undone.</p>
            <DialogFooter><Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
          </DialogContent>
        </Dialog>
        </>
        )}
      </div>
    </AppLayout>
  );
};

export default FoodSafety;
