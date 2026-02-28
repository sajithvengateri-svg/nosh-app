import type { ComplianceFramework, UAEEmirate } from "../types/store.types.ts";

// ── UAE Postcode → Emirate Mapping ──────────────────────────────────
//
// UAE postcodes are 5-digit or area-name based. The Makani system uses
// 10-digit geo-codes, but for venue registration we use the standard
// postal/area code prefixes assigned by Emirates Post Group.
//
// Dubai:      Postcodes in ranges like 00000–xxxxx; common area codes
//             include those in the 100000-599999 Makani range.
//             Standard postal: Dubai uses area codes starting with
//             specific prefixes.
// Abu Dhabi:  Different prefix ranges.
// Sharjah:    Different prefix ranges.
//
// Since UAE doesn't have a universal postcode system like AU/UK, we use
// a lookup of known area/district codes mapped to emirates. Venues enter
// their area/district code or full address, and we match to emirate.

/** Known Dubai area/postal code prefixes */
const DUBAI_POSTCODES = [
  // Standard Dubai PO Box ranges and area identifiers
  "00000", // General Dubai
  // Makani-style: Dubai zones start with certain prefixes
  // Common Dubai district postal identifiers:
  "dubai",
  "dxb",
];

/** Known Abu Dhabi area/postal code prefixes */
const ABU_DHABI_POSTCODES = [
  "abu_dhabi",
  "abudhabi",
  "auh",
];

/** Known Sharjah area/postal code prefixes */
const SHARJAH_POSTCODES = [
  "sharjah",
  "shj",
];

/**
 * Dubai district/area names for fuzzy matching.
 * When a postcode/address contains one of these, it's Dubai.
 */
const DUBAI_DISTRICTS = [
  "deira", "bur dubai", "jumeirah", "marina", "downtown",
  "business bay", "al barsha", "al quoz", "jebel ali", "jlt",
  "difc", "karama", "satwa", "oud metha", "al nahda",
  "international city", "silicon oasis", "dubailand", "palm",
  "motor city", "sports city", "production city", "tecom",
  "media city", "internet city", "knowledge village", "healthcare city",
  "al rigga", "al garhoud", "festival city", "creek harbour",
  "dubai hills", "arabian ranches", "al rashidiya", "mirdif",
  "discovery gardens", "al sufouh", "umm suqeim", "al mankhool",
  "hor al anz", "al twar", "al warqa", "muhaisnah", "al khawaneej",
];

/**
 * Abu Dhabi district/area names.
 */
const ABU_DHABI_DISTRICTS = [
  "khalifa city", "al reem island", "al maryah", "saadiyat",
  "yas island", "al raha", "musaffah", "mussafah", "khalidiyah",
  "corniche", "al wahda", "al bateen", "tourist club",
  "hamdan street", "electra", "al ain", "al dhafra", "madinat zayed",
  "al shamkha", "mohammed bin zayed", "mbz", "al reef",
  "masdar city", "al ghadeer", "al wathba",
];

/**
 * Sharjah district/area names.
 */
const SHARJAH_DISTRICTS = [
  "al majaz", "al nahda sharjah", "al khan", "al qasimia",
  "al taawun", "muwaileh", "muwailih", "university city",
  "sharjah industrial", "al zahia", "al mamzar sharjah",
  "al bu daniq", "al ghuwair", "al yarmook", "al nasseriya",
  "al ramla", "al qadisiya", "al falaj", "al jazzat",
  "al azra", "wasit", "halwan",
];

/**
 * Detect which UAE emirate a venue belongs to based on its postcode
 * or address string. Returns null if no match (fallback to Dubai).
 */
export function detectEmirate(postcodeOrAddress: string): UAEEmirate {
  if (!postcodeOrAddress) return "dubai"; // Default to Dubai

  const input = postcodeOrAddress.toLowerCase().trim();

  // Direct emirate name match
  if (input.includes("abu dhabi") || input.includes("abudhabi") || input.includes("abu_dhabi")) {
    return "abu_dhabi";
  }
  if (input.includes("sharjah") || input.includes("al shariqah")) {
    return "sharjah";
  }
  if (input.includes("dubai")) {
    return "dubai";
  }

  // District matching
  for (const d of ABU_DHABI_DISTRICTS) {
    if (input.includes(d)) return "abu_dhabi";
  }
  for (const d of SHARJAH_DISTRICTS) {
    if (input.includes(d)) return "sharjah";
  }
  for (const d of DUBAI_DISTRICTS) {
    if (input.includes(d)) return "dubai";
  }

  // Postcode prefix matching
  for (const p of ABU_DHABI_POSTCODES) {
    if (input.startsWith(p)) return "abu_dhabi";
  }
  for (const p of SHARJAH_POSTCODES) {
    if (input.startsWith(p)) return "sharjah";
  }
  for (const p of DUBAI_POSTCODES) {
    if (input.startsWith(p)) return "dubai";
  }

  // Default to Dubai if no match
  return "dubai";
}

// ── Emirate → Compliance Framework ──────────────────────────────────

/** Maps an emirate to its regulatory body's compliance framework */
export function getEmirateCompliance(emirate: UAEEmirate): ComplianceFramework {
  switch (emirate) {
    case "dubai": return "dm";           // Dubai Municipality
    case "abu_dhabi": return "adafsa";   // Abu Dhabi Food Safety Authority
    case "sharjah": return "sm_sharjah"; // Sharjah Municipality
  }
}

// ── Emirate Metadata ────────────────────────────────────────────────

export interface EmirateConfig {
  emirate: UAEEmirate;
  name: string;
  nameAr: string;
  regulatoryBody: string;
  regulatoryBodyAr: string;
  complianceFramework: ComplianceFramework;
  gradingSystem: "letter" | "star" | "none";
  gradingScale: string;
  currency: "AED";
  vatRate: number; // UAE VAT is 5%
  timezone: string;
}

export const EMIRATE_CONFIGS: Record<UAEEmirate, EmirateConfig> = {
  dubai: {
    emirate: "dubai",
    name: "Dubai",
    nameAr: "دبي",
    regulatoryBody: "Dubai Municipality — Food Safety Department",
    regulatoryBodyAr: "بلدية دبي — إدارة سلامة الغذاء",
    complianceFramework: "dm",
    gradingSystem: "letter",
    gradingScale: "A (85-100%), B (70-84%), C (55-69%), D (<55%)",
    currency: "AED",
    vatRate: 5,
    timezone: "Asia/Dubai",
  },
  abu_dhabi: {
    emirate: "abu_dhabi",
    name: "Abu Dhabi",
    nameAr: "أبوظبي",
    regulatoryBody: "Abu Dhabi Agriculture and Food Safety Authority (ADAFSA)",
    regulatoryBodyAr: "هيئة أبوظبي للزراعة وسلامة الغذاء",
    complianceFramework: "adafsa",
    gradingSystem: "star",
    gradingScale: "1-5 Stars",
    currency: "AED",
    vatRate: 5,
    timezone: "Asia/Dubai",
  },
  sharjah: {
    emirate: "sharjah",
    name: "Sharjah",
    nameAr: "الشارقة",
    regulatoryBody: "Sharjah Municipality — Public Health Department",
    regulatoryBodyAr: "بلدية الشارقة — إدارة الصحة العامة",
    complianceFramework: "sm_sharjah",
    gradingSystem: "none",
    gradingScale: "Pass/Fail inspection",
    currency: "AED",
    vatRate: 5,
    timezone: "Asia/Dubai",
  },
};

// ── GCC-Specific Temperature Thresholds ─────────────────────────────

export interface TempThreshold {
  logType: string;
  label: string;
  labelAr: string;
  passMin?: number;  // Minimum temp to pass (inclusive)
  passMax?: number;  // Maximum temp to pass (inclusive)
  warningMin?: number;
  warningMax?: number;
  unit: "°C";
}

/**
 * Temperature thresholds for UAE food safety compliance.
 * These are consistent across Dubai, Abu Dhabi, and Sharjah
 * (aligned with GSO standards and Codex Alimentarius).
 */
export const UAE_TEMP_THRESHOLDS: TempThreshold[] = [
  {
    logType: "fridge_temp",
    label: "Fridge Temperature",
    labelAr: "درجة حرارة الثلاجة",
    passMax: 5,
    warningMax: 8,
    unit: "°C",
  },
  {
    logType: "freezer_temp",
    label: "Freezer Temperature",
    labelAr: "درجة حرارة الفريزر",
    passMax: -18,
    warningMax: -15,
    unit: "°C",
  },
  {
    logType: "hot_holding",
    label: "Hot Holding",
    labelAr: "الحفظ الساخن",
    passMin: 60,
    warningMin: 57,
    unit: "°C",
  },
  {
    logType: "cooking_poultry",
    label: "Cooking — Poultry/Mince",
    labelAr: "الطهي — الدواجن/اللحم المفروم",
    passMin: 74,
    warningMin: 70,
    unit: "°C",
  },
  {
    logType: "cooking_whole",
    label: "Cooking — Whole Cuts",
    labelAr: "الطهي — قطع كاملة",
    passMin: 63,
    warningMin: 60,
    unit: "°C",
  },
  {
    logType: "reheating",
    label: "Reheating",
    labelAr: "إعادة التسخين",
    passMin: 74,
    warningMin: 70,
    unit: "°C",
  },
  {
    logType: "receiving_chilled",
    label: "Receiving — Chilled Goods",
    labelAr: "الاستلام — بضائع مبردة",
    passMax: 5,
    warningMax: 8,
    unit: "°C",
  },
  {
    logType: "receiving_frozen",
    label: "Receiving — Frozen Goods",
    labelAr: "الاستلام — بضائع مجمدة",
    passMax: -18,
    warningMax: -15,
    unit: "°C",
  },
  {
    logType: "display_hot",
    label: "Display — Hot Food",
    labelAr: "العرض — طعام ساخن",
    passMin: 60,
    warningMin: 57,
    unit: "°C",
  },
  {
    logType: "display_cold",
    label: "Display — Cold Food",
    labelAr: "العرض — طعام بارد",
    passMax: 5,
    warningMax: 8,
    unit: "°C",
  },
  {
    logType: "transport_chilled",
    label: "Transport — Chilled",
    labelAr: "النقل — مبرد",
    passMax: 5,
    warningMax: 8,
    unit: "°C",
  },
  {
    logType: "transport_frozen",
    label: "Transport — Frozen",
    labelAr: "النقل — مجمد",
    passMax: -18,
    warningMax: -15,
    unit: "°C",
  },
  {
    logType: "oil_temp",
    label: "Oil Temperature (Frying)",
    labelAr: "درجة حرارة الزيت (القلي)",
    passMax: 180,
    warningMax: 185,
    unit: "°C",
  },
];

/**
 * Auto-detect pass/warning/fail for a UAE temperature reading.
 */
export function uaeTempStatus(
  logType: string,
  temp: number
): "pass" | "warning" | "fail" {
  const threshold = UAE_TEMP_THRESHOLDS.find((t) => t.logType === logType);
  if (!threshold) return "pass";

  // For cold items (passMax defined): lower is better
  if (threshold.passMax !== undefined) {
    if (temp <= threshold.passMax) return "pass";
    if (threshold.warningMax !== undefined && temp <= threshold.warningMax) return "warning";
    return "fail";
  }

  // For hot items (passMin defined): higher is better
  if (threshold.passMin !== undefined) {
    if (temp >= threshold.passMin) return "pass";
    if (threshold.warningMin !== undefined && temp >= threshold.warningMin) return "warning";
    return "fail";
  }

  return "pass";
}

// ── GCC Daily Compliance Check Categories ───────────────────────────

export interface ComplianceCheckCategory {
  key: string;
  label: string;
  labelAr: string;
  icon: string; // lucide icon name
  checks: ComplianceCheck[];
}

export interface ComplianceCheck {
  key: string;
  label: string;
  labelAr: string;
  logType: string;
  requiresTemp?: boolean;
  tempLabel?: string;
  isHalal?: boolean; // Halal-specific check
  isRamadan?: boolean; // Only active during Ramadan
}

export const UAE_COMPLIANCE_CATEGORIES: ComplianceCheckCategory[] = [
  {
    key: "temperature",
    label: "Temperature Monitoring",
    labelAr: "مراقبة درجة الحرارة",
    icon: "Thermometer",
    checks: [
      { key: "fridge", label: "Fridge Temps", labelAr: "حرارة الثلاجة", logType: "fridge_temp", requiresTemp: true, tempLabel: "°C (0–5 pass)" },
      { key: "freezer", label: "Freezer Temps", labelAr: "حرارة الفريزر", logType: "freezer_temp", requiresTemp: true, tempLabel: "°C (≤ -18 pass)" },
      { key: "hot_holding", label: "Hot Holding", labelAr: "الحفظ الساخن", logType: "hot_holding", requiresTemp: true, tempLabel: "°C (≥ 60 pass)" },
      { key: "cooking", label: "Cooking Temps", labelAr: "حرارة الطهي", logType: "cooking_poultry", requiresTemp: true, tempLabel: "°C (≥ 74 pass)" },
    ],
  },
  {
    key: "food_safety",
    label: "Food Safety",
    labelAr: "سلامة الغذاء",
    icon: "Shield",
    checks: [
      { key: "expiry_check", label: "Expiry Date Check", labelAr: "فحص تاريخ الصلاحية", logType: "expiry_check" },
      { key: "cross_contam", label: "Cross-Contamination Check", labelAr: "فحص التلوث المتبادل", logType: "cross_contamination" },
      { key: "halal_cert", label: "Halal Certificate Verification", labelAr: "التحقق من شهادة الحلال", logType: "halal_verification", isHalal: true },
      { key: "food_labelling", label: "Food Labelling & Date Marking", labelAr: "ملصقات الغذاء والتاريخ", logType: "food_labelling" },
    ],
  },
  {
    key: "hygiene",
    label: "Personal Hygiene",
    labelAr: "النظافة الشخصية",
    icon: "HeartPulse",
    checks: [
      { key: "staff_health", label: "Staff Health Declaration", labelAr: "إقرار صحة الموظف", logType: "staff_health" },
      { key: "handwash", label: "Handwash Stations", labelAr: "محطات غسل اليدين", logType: "handwash_check" },
      { key: "uniform", label: "Uniform & Appearance", labelAr: "الزي والمظهر", logType: "uniform_check" },
      { key: "health_cert", label: "Health Certificate Valid", labelAr: "صلاحية الشهادة الصحية", logType: "health_cert_check" },
    ],
  },
  {
    key: "cleaning",
    label: "Cleaning & Sanitization",
    labelAr: "التنظيف والتعقيم",
    icon: "SprayCan",
    checks: [
      { key: "sanitiser", label: "Sanitiser Check", labelAr: "فحص المعقم", logType: "sanitiser_check" },
      { key: "kitchen_clean", label: "Kitchen Cleanliness", labelAr: "نظافة المطبخ", logType: "kitchen_clean" },
      { key: "equipment_clean", label: "Equipment Clean", labelAr: "تنظيف المعدات", logType: "equipment_clean" },
      { key: "waste_disposal", label: "Waste Disposal", labelAr: "التخلص من النفايات", logType: "waste_disposal" },
    ],
  },
  {
    key: "pest_control",
    label: "Pest Control",
    labelAr: "مكافحة الآفات",
    icon: "Bug",
    checks: [
      { key: "pest_visual", label: "Visual Pest Check", labelAr: "فحص بصري للآفات", logType: "pest_check" },
      { key: "pest_devices", label: "Pest Control Devices", labelAr: "أجهزة مكافحة الآفات", logType: "pest_device_check" },
    ],
  },
];

// ── GCC-Specific Fine Schedules ─────────────────────────────────────

export interface FineSchedule {
  violationType: string;
  label: string;
  labelAr: string;
  severity: "critical" | "major" | "minor";
  minFineAED: number;
  maxFineAED: number;
  canCauseClosure: boolean;
}

export const DUBAI_FINE_SCHEDULE: FineSchedule[] = [
  { violationType: "temp_danger_zone", label: "Food in Danger Zone (5-60°C) > 2hrs", labelAr: "طعام في المنطقة الخطرة", severity: "critical", minFineAED: 5000, maxFineAED: 100000, canCauseClosure: true },
  { violationType: "pest_infestation", label: "Pest Infestation", labelAr: "إصابة بالآفات", severity: "critical", minFineAED: 10000, maxFineAED: 50000, canCauseClosure: true },
  { violationType: "no_handwash", label: "No Handwashing Facilities", labelAr: "لا توجد مرافق غسل اليدين", severity: "critical", minFineAED: 5000, maxFineAED: 20000, canCauseClosure: false },
  { violationType: "cross_contamination", label: "Cross-Contamination", labelAr: "تلوث متبادل", severity: "critical", minFineAED: 5000, maxFineAED: 50000, canCauseClosure: true },
  { violationType: "expired_food", label: "Expired Food on Premises", labelAr: "طعام منتهي الصلاحية", severity: "critical", minFineAED: 10000, maxFineAED: 50000, canCauseClosure: true },
  { violationType: "no_halal_cert", label: "No Valid Halal Certificate", labelAr: "لا توجد شهادة حلال سارية", severity: "critical", minFineAED: 10000, maxFineAED: 50000, canCauseClosure: true },
  { violationType: "no_health_cert", label: "Staff Without Health Certificate", labelAr: "موظف بدون شهادة صحية", severity: "major", minFineAED: 5000, maxFineAED: 20000, canCauseClosure: false },
  { violationType: "incomplete_logs", label: "Incomplete Temperature Logs", labelAr: "سجلات حرارة غير مكتملة", severity: "major", minFineAED: 5000, maxFineAED: 10000, canCauseClosure: false },
  { violationType: "no_grade_display", label: "Food Safety Grade Not Displayed", labelAr: "عدم عرض تصنيف سلامة الغذاء", severity: "minor", minFineAED: 5000, maxFineAED: 5000, canCauseClosure: false },
];

// ── Dubai Municipality Grading ──────────────────────────────────────

export interface DMGrade {
  grade: string;
  label: string;
  labelAr: string;
  minScore: number;
  maxScore: number;
  color: string;
}

export const DM_GRADES: DMGrade[] = [
  { grade: "A", label: "Excellent", labelAr: "ممتاز", minScore: 85, maxScore: 100, color: "#22c55e" },
  { grade: "B", label: "Good", labelAr: "جيد", minScore: 70, maxScore: 84, color: "#3b82f6" },
  { grade: "C", label: "Acceptable", labelAr: "مقبول", minScore: 55, maxScore: 69, color: "#f59e0b" },
  { grade: "D", label: "Poor", labelAr: "ضعيف", minScore: 0, maxScore: 54, color: "#ef4444" },
];

export function getDMGrade(score: number): DMGrade {
  return DM_GRADES.find((g) => score >= g.minScore && score <= g.maxScore) ?? DM_GRADES[3];
}

// ── ADAFSA Star Rating ──────────────────────────────────────────────

export interface ADFSAStar {
  stars: number;
  label: string;
  labelAr: string;
  minScore: number;
  color: string;
}

export const ADAFSA_STARS: ADFSAStar[] = [
  { stars: 5, label: "Outstanding", labelAr: "متميز", minScore: 90, color: "#f59e0b" },
  { stars: 4, label: "Very Good", labelAr: "جيد جداً", minScore: 75, color: "#22c55e" },
  { stars: 3, label: "Good", labelAr: "جيد", minScore: 60, color: "#3b82f6" },
  { stars: 2, label: "Acceptable", labelAr: "مقبول", minScore: 45, color: "#f97316" },
  { stars: 1, label: "Needs Improvement", labelAr: "يحتاج تحسين", minScore: 0, color: "#ef4444" },
];

export function getADFSAStars(score: number): ADFSAStar {
  return ADAFSA_STARS.find((s) => score >= s.minScore) ?? ADAFSA_STARS[4];
}

// ── Currency Formatting ─────────────────────────────────────────────

/** Format an amount in AED */
export function formatAED(amount: number): string {
  return `AED ${amount.toLocaleString("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Format an amount in AED with Arabic numeral option */
export function formatAEDAr(amount: number): string {
  return `${amount.toLocaleString("ar-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.إ`;
}
