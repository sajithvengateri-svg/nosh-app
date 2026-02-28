import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield, Star, AlertTriangle, Calendar, Users, FileCheck,
  ThermometerSun, Package, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/useOrgId";
import { useEmirateDetection } from "@/hooks/useEmirateDetection";
import {
  getDMGrade, getADFSAStars, formatAED,
  DUBAI_FINE_SCHEDULE,
} from "@/lib/shared/gccConfig";
import GCCDailyComplianceBurst from "./GCCDailyComplianceBurst";
import GCCHalalTracker from "./GCCHalalTracker";
import GCCStaffMedicalTracker from "./GCCStaffMedicalTracker";
import GCCInspectionGrades from "./GCCInspectionGrades";
import BCCReceivingLog from "../bcc/BCCReceivingLog";
import BCCCleaningLog from "../bcc/BCCCleaningLog";

export default function GCCFoodSafetyDashboard() {
  const orgId = useOrgId();
  const { emirate, config } = useEmirateDetection();
  const [activeTab, setActiveTab] = useState("burst");

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            Food Safety — {config.name}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {config.regulatoryBody}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground uppercase">Currency</div>
          <div className="text-lg font-bold text-emerald-600">AED</div>
        </div>
      </div>

      {/* Emirate compliance badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className="border-emerald-600 text-emerald-700 dark:text-emerald-400">
          {config.complianceFramework === "dm" ? "Dubai Municipality" :
           config.complianceFramework === "adafsa" ? "ADAFSA" :
           "Sharjah Municipality"}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {config.gradingSystem === "letter" ? "A-D Grade System" :
           config.gradingSystem === "star" ? "1-5 Star Rating" :
           "Pass/Fail Inspection"}
        </Badge>
        <Badge variant="outline" className="text-xs">
          VAT {config.vatRate}%
        </Badge>
        <Badge variant="outline" className="text-xs" dir="rtl">
          {config.nameAr}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="burst" className="text-xs">
            <ThermometerSun className="w-3.5 h-3.5 mr-1" />
            Daily
          </TabsTrigger>
          <TabsTrigger value="receiving" className="text-xs">
            <Package className="w-3.5 h-3.5 mr-1" />
            Receiving
          </TabsTrigger>
          <TabsTrigger value="cleaning" className="text-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Cleaning
          </TabsTrigger>
          <TabsTrigger value="halal" className="text-xs">
            <FileCheck className="w-3.5 h-3.5 mr-1" />
            Halal
          </TabsTrigger>
          <TabsTrigger value="staff" className="text-xs">
            <Users className="w-3.5 h-3.5 mr-1" />
            Staff
          </TabsTrigger>
          <TabsTrigger value="grades" className="text-xs">
            <Star className="w-3.5 h-3.5 mr-1" />
            Grades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="burst">
          <GCCDailyComplianceBurst onNavigate={setActiveTab} />
        </TabsContent>

        <TabsContent value="receiving">
          <BCCReceivingLog />
        </TabsContent>

        <TabsContent value="cleaning">
          <BCCCleaningLog />
        </TabsContent>

        <TabsContent value="halal">
          <GCCHalalTracker />
        </TabsContent>

        <TabsContent value="staff">
          <GCCStaffMedicalTracker />
        </TabsContent>

        <TabsContent value="grades">
          <GCCInspectionGrades />
        </TabsContent>
      </Tabs>

      {/* Fine Risk Summary */}
      <Card className="border-red-200 dark:border-red-800/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            Critical Violation Fines — {config.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {DUBAI_FINE_SCHEDULE.filter(f => f.severity === "critical").slice(0, 4).map((fine) => (
              <div key={fine.violationType} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{fine.label}</span>
                <span className="font-mono text-red-600">
                  {formatAED(fine.minFineAED)} – {formatAED(fine.maxFineAED)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
