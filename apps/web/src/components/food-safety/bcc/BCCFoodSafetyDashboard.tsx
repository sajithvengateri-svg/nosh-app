import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, GraduationCap, LayoutGrid, FileCheck, Clock, AlertTriangle, Wrench, Bug, Truck, ClipboardCheck, Star, Package, Sparkles } from "lucide-react";
import { useBCCCompliance } from "@/hooks/useBCCCompliance";
import ComplianceProfileCard from "./ComplianceProfileCard";
import FSSExpiryBanner from "./FSSExpiryBanner";
import TrainingRegister from "./TrainingRegister";
import SectionToggles from "./SectionToggles";
import ComplianceSetupWizard from "./ComplianceSetupWizard";
import BCCStarRating from "./BCCStarRating";
import DailyComplianceBurst from "./DailyComplianceBurst";
import CorrectiveActionRegister from "./CorrectiveActionRegister";
import SelfAssessmentChecklist from "./SelfAssessmentChecklist";
import EquipmentCalibrationLog from "./EquipmentCalibrationLog";
import PestControlLog from "./PestControlLog";
import BCCSupplierRegister from "./BCCSupplierRegister";
import PreInspectionReadiness from "./PreInspectionReadiness";
import BCCReceivingLog from "./BCCReceivingLog";
import BCCCleaningLog from "./BCCCleaningLog";
import ReportActions from "@/components/shared/ReportActions";
import { useOrgId } from "@/hooks/useOrgId";

interface Props {
  isHomeCook?: boolean;
}

export default function BCCFoodSafetyDashboard({ isHomeCook }: Props) {
  const {
    profile, supervisors, training, sectionToggles, loading,
    upsertProfile, upsertSupervisor,
    addTraining, deleteTraining,
    updateSectionToggle, bulkSetSectionToggles, fetchAll,
  } = useBCCCompliance();

  const [showWizard, setShowWizard] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const orgId = useOrgId();
  const [activeTab, setActiveTab] = useState("burst");
  const needsSetup = !loading && !profile;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#000080]" />
      </div>
    );
  }

  if (needsSetup || showWizard) {
    return (
      <ComplianceSetupWizard
        onComplete={() => { setShowWizard(false); fetchAll(); }}
        upsertProfile={upsertProfile}
        upsertSupervisor={upsertSupervisor}
        bulkSetSectionToggles={bulkSetSectionToggles}
        isHomeCook={isHomeCook}
      />
    );
  }

  const primaryFSS = supervisors.find((s) => s.is_primary) || supervisors[0];

  // Determine which tabs to show based on section toggles
  const showEquipment = sectionToggles["equipment_calibration"] !== false;
  const showPest = sectionToggles["pest_check"] !== false;
  const showSupplier = sectionToggles["supplier_register"] !== false;
  const showSelfAssessment = sectionToggles["self_assessment"] !== false;

  return (
    <div className="space-y-6">
      {primaryFSS && <FSSExpiryBanner expiryDate={primaryFSS.certificate_expiry} />}

      {/* BCC Badge Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#000080] text-white">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#000080]">BCC Eat Safe Certified</h2>
            <p className="text-sm text-muted-foreground">
              {profile?.business_category === "category_1" ? "Category 1 — Full Evidence Tool" : "Category 2 — FSS + Training"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ReportActions
            title={`BCC ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`}
            contentRef={contentRef}
            reportType={`bcc-${activeTab}`}
            orgId={orgId}
          />
          {profile?.last_star_rating != null && (
            <BCCStarRating rating={profile.last_star_rating} size="md" />
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="burst" className="gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Burst</span>
          </TabsTrigger>
          {!isHomeCook && (
            <TabsTrigger value="receiving" className="gap-1.5 text-xs">
              <Package className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Receiving</span>
            </TabsTrigger>
          )}
          {!isHomeCook && (
            <TabsTrigger value="cleaning" className="gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cleaning</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <FileCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="gap-1.5 text-xs">
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Training</span>
          </TabsTrigger>
          <TabsTrigger value="corrective" className="gap-1.5 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Actions</span>
          </TabsTrigger>
          {showSelfAssessment && (
            <TabsTrigger value="assessment" className="gap-1.5 text-xs">
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">A1–A40</span>
            </TabsTrigger>
          )}
          {showEquipment && (
            <TabsTrigger value="equipment" className="gap-1.5 text-xs">
              <Wrench className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Equipment</span>
            </TabsTrigger>
          )}
          {showPest && (
            <TabsTrigger value="pest" className="gap-1.5 text-xs">
              <Bug className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pest</span>
            </TabsTrigger>
          )}
          {showSupplier && (
            <TabsTrigger value="supplier" className="gap-1.5 text-xs">
              <Truck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Suppliers</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="readiness" className="gap-1.5 text-xs">
            <Star className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Readiness</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-1.5 text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-1.5 text-xs">
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sections</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="burst">
          <div ref={activeTab === "burst" ? contentRef : undefined}>
            <DailyComplianceBurst sectionToggles={sectionToggles} onNavigate={setActiveTab} />
          </div>
        </TabsContent>

        {!isHomeCook && (
          <TabsContent value="receiving">
            <div ref={activeTab === "receiving" ? contentRef : undefined}>
              <BCCReceivingLog />
            </div>
          </TabsContent>
        )}

        {!isHomeCook && (
          <TabsContent value="cleaning">
            <div ref={activeTab === "cleaning" ? contentRef : undefined}>
              <BCCCleaningLog />
            </div>
          </TabsContent>
        )}

        <TabsContent value="overview">
          <div ref={activeTab === "overview" ? contentRef : undefined}>
            <ComplianceProfileCard profile={profile} supervisors={supervisors} />
          </div>
        </TabsContent>

        <TabsContent value="training">
          <div ref={activeTab === "training" ? contentRef : undefined}>
            <TrainingRegister training={training} onAdd={addTraining} onDelete={deleteTraining} />
          </div>
        </TabsContent>

        <TabsContent value="corrective">
          <div ref={activeTab === "corrective" ? contentRef : undefined}>
            <CorrectiveActionRegister />
          </div>
        </TabsContent>

        {showSelfAssessment && (
          <TabsContent value="assessment">
            <div ref={activeTab === "assessment" ? contentRef : undefined}>
              <SelfAssessmentChecklist />
            </div>
          </TabsContent>
        )}

        {showEquipment && (
          <TabsContent value="equipment">
            <div ref={activeTab === "equipment" ? contentRef : undefined}>
              <EquipmentCalibrationLog />
            </div>
          </TabsContent>
        )}

        {showPest && (
          <TabsContent value="pest">
            <div ref={activeTab === "pest" ? contentRef : undefined}>
              <PestControlLog />
            </div>
          </TabsContent>
        )}

        {showSupplier && (
          <TabsContent value="supplier">
            <div ref={activeTab === "supplier" ? contentRef : undefined}>
              <BCCSupplierRegister />
            </div>
          </TabsContent>
        )}

        <TabsContent value="readiness">
          <div ref={activeTab === "readiness" ? contentRef : undefined}>
            <PreInspectionReadiness />
          </div>
        </TabsContent>

        <TabsContent value="profile">
          <ComplianceProfileCard profile={profile} supervisors={supervisors} />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setShowWizard(true)}
              className="text-sm text-[#000080] hover:underline"
            >
              Re-run Setup Wizard →
            </button>
          </div>
        </TabsContent>

        <TabsContent value="sections">
          <SectionToggles toggles={sectionToggles} onChange={updateSectionToggle} />
        </TabsContent>
      </Tabs>
    </div>
  );
}