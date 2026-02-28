import "@/i18n";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { VoiceCommandProvider } from "@/contexts/VoiceCommandContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ChefAIChat from "@/components/ai/ChefAIChat";
import ErrorBoundary from "@/components/ErrorBoundary";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import BetaBanner from "@/components/BetaBanner";
import TermsAcceptanceGate from "@/components/TermsAcceptanceModal";

 
 // Chef Portal Pages
import Dashboard from "./pages/Dashboard";
import Recipes from "./pages/Recipes";
import RecipeDetail from "./pages/RecipeDetail";
import RecipeEdit from "./pages/RecipeEdit";
import Ingredients from "./pages/Ingredients";
import MasterYield from "./pages/MasterYield";
import Costing from "./pages/Costing";
import Inventory from "./pages/Inventory";
import PrepLists from "./pages/PrepLists";
import Production from "./pages/Production";
import MenuEngineering from "./pages/MenuEngineering";
import Roster from "./pages/Roster";
import AllergenDashboard from "./pages/AllergenDashboard";
import FoodSafety from "./pages/FoodSafety";
import Training from "./pages/Training";
import TrainingPlayer from "./components/training/TrainingPlayer";
import Invoices from "./pages/Invoices";
import CookingCheatsheets from "./pages/CookingCheatsheets";
import OperationsCalendar from "./pages/OperationsCalendar";
import Equipment from "./pages/Equipment";
import More from "./pages/More";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import JoinTeam from "./pages/JoinTeam";
import PortalSelect from "./pages/PortalSelect";
import ResetPassword from "./pages/ResetPassword";
import Team from "./pages/Team";
import Marketplace from "./pages/Marketplace";
import KitchenSections from "./pages/KitchenSections";
import Settings from "./pages/Settings";
import WasteLog from "./pages/WasteLog";
import Kitchen from "./pages/Kitchen";
import TodoList from "./pages/TodoList";
import Logs from "./pages/Logs";
import Feedback from "./pages/Feedback";
import ChefOSLanding from "./pages/ChefOSLanding";
import HomeCookLanding from "./pages/HomeCookLanding";
import NoshConsumerLanding from "./pages/NoshConsumerLanding";
import NoshVendorLanding from "./pages/NoshVendorLanding";
import MoneyLiteDashboard from "./portals/money/components/MoneyLiteDashboard";
import ReferAndSave from "./pages/ReferAndSave";
import Download from "./pages/Download";
import ReferLanding from "./pages/ReferLanding";
import Housekeeping from "./pages/Housekeeping";
import AppLayout from "@/components/layout/AppLayout";
import SectionHub from "@/components/layout/SectionHub";

// BevOS Portal
import BevLayout from "./portals/bev/BevLayout";
import BevDashboard from "./portals/bev/pages/BevDashboard";
import Cellar from "./portals/bev/pages/Cellar";
import WineIntelligence from "./portals/bev/pages/WineIntelligence";
import DraughtManager from "./portals/bev/pages/DraughtManager";
import CocktailsPage from "./portals/bev/pages/Cocktails";
import CoffeeProgram from "./portals/bev/pages/CoffeeProgram";
import Pours from "./portals/bev/pages/Pours";
import BarPrep from "./portals/bev/pages/BarPrep";
import StocktakePage from "./portals/bev/pages/Stocktake";
import CoravinManager from "./portals/bev/pages/CoravinManager";
import FlashCards from "./portals/bev/pages/FlashCards";
import BevAI from "./portals/bev/pages/BevAI";
import BevCosting from "./portals/bev/pages/BevCosting";
import BevTeam from "./portals/bev/pages/BevTeam";
import BevInvoices from "./portals/bev/pages/BevInvoices";
import BevEquipment from "./portals/bev/pages/BevEquipment";
import BevProduction from "./portals/bev/pages/BevProduction";
import BevCalendar from "./portals/bev/pages/BevCalendar";
import BevTraining from "./portals/bev/pages/BevTraining";
import BevCompliance from "./portals/bev/pages/BevCompliance";
import BevMarketplace from "./portals/bev/pages/BevMarketplace";
import BevEngineering from "./portals/bev/pages/BevEngineering";
import BevStations from "./portals/bev/pages/BevStations";
import BevSettings from "./portals/bev/pages/BevSettings";
import BevWasteLog from "./portals/bev/pages/BevWasteLog";

// ClockOS Portal
import ClockLayout from "./portals/clock/ClockLayout";
import ClockScreen from "./portals/clock/pages/ClockScreen";
import ClockDashboard from "./portals/clock/pages/ClockDashboard";
import ClockTimesheets from "./portals/clock/pages/ClockTimesheets";
import ClockOverride from "./portals/clock/pages/ClockOverride";
import ClockInduction from "./portals/clock/pages/ClockInduction";
import ClockOnboarding from "./portals/clock/pages/ClockOnboarding";
import ClockEmployees from "./portals/clock/pages/ClockEmployees";
import ClockDevices from "./portals/clock/pages/ClockDevices";
import ClockPins from "./portals/clock/pages/ClockPins";
import ClockSettingsPage from "./portals/clock/pages/ClockSettings";

// RestOS Portal
import RestOSLayout from "./portals/restos/RestOSLayout";

import POSFunctions from "./portals/restos/pages/POSFunctions";
import POSDailyClose from "./portals/restos/pages/POSDailyClose";
import POSWasteLog from "./portals/restos/pages/POSWasteLog";
import POSAnalytics from "./portals/restos/pages/POSAnalytics";
import POSCompliance from "./portals/restos/pages/POSCompliance";
import POSAuditLog from "./portals/restos/pages/POSAuditLog";
import POSStaffAdmin from "./portals/restos/pages/POSStaffAdmin";
import POSStoreSettings from "./portals/restos/pages/POSStoreSettings";
import POSImport from "./portals/restos/pages/POSImport";
import TabsPage from "./portals/restos/pages/TabsPage";
import POSOrderScreen from "./portals/restos/pages/POSOrderScreen";
import KDSPage from "./portals/restos/pages/KDSPage";
import MenuAdminPage from "./portals/restos/pages/MenuAdminPage";
import LabourLayout from "./portals/labour/LabourLayout";
import LabourDashboard from "./portals/labour/pages/LabourDashboard";
import LabourRoster from "./portals/labour/pages/LabourRoster";
import LabourTimesheets from "./portals/labour/pages/LabourTimesheets";
import LabourLeave from "./portals/labour/pages/LabourLeave";
import LabourPayroll from "./portals/labour/pages/LabourPayroll";
import LabourPayRunNew from "./portals/labour/pages/LabourPayRunNew";
import LabourEmployees from "./portals/labour/pages/LabourEmployees";
import LabourEmployeeNew from "./portals/labour/pages/LabourEmployeeNew";
import LabourCompliance from "./portals/labour/pages/LabourCompliance";
import LabourSettings from "./portals/labour/pages/LabourSettings";

// People OS (inside LabourOS)
import PeopleDashboard from "./portals/labour/pages/PeopleDashboard";
import PeopleRecruitment from "./portals/labour/pages/PeopleRecruitment";
import PeoplePositionDetail from "./portals/labour/pages/PeoplePositionDetail";
import PeopleApplicantDetail from "./portals/labour/pages/PeopleApplicantDetail";
import PeopleDirectory from "./portals/labour/pages/PeopleDirectory";
import PeopleEmployeeProfile from "./portals/labour/pages/PeopleEmployeeProfile";
import PeopleOnboarding from "./portals/labour/pages/PeopleOnboarding";
import PeopleReviews from "./portals/labour/pages/PeopleReviews";
import PeopleWarnings from "./portals/labour/pages/PeopleWarnings";
import PeopleSettings from "./portals/labour/pages/PeopleSettings";
import SupplyLayout from "./portals/supply/SupplyLayout";
import SupplyDashboard from "./portals/supply/pages/SupplyDashboard";
import SupplyOrders from "./portals/supply/pages/SupplyOrders";
import SupplySuppliers from "./portals/supply/pages/SupplySuppliers";
import SupplyReceiving from "./portals/supply/pages/SupplyReceiving";
import SupplyPriceWatch from "./portals/supply/pages/SupplyPriceWatch";
import SupplySettings from "./portals/supply/pages/SupplySettings";
import GrowthLayout from "./portals/growth/GrowthLayout";
import GrowthDashboard from "./portals/growth/pages/GrowthDashboard";
import GrowthCampaigns from "./portals/growth/pages/GrowthCampaigns";
import GrowthCampaignDetail from "./portals/growth/pages/GrowthCampaignDetail";
import GrowthCalendar from "./portals/growth/pages/GrowthCalendar";
import GrowthSegments from "./portals/growth/pages/GrowthSegments";
import GrowthAnalytics from "./portals/growth/pages/GrowthAnalytics";
import GrowthSettings from "./portals/growth/pages/GrowthSettings";
import MoneyLayout from "./portals/money/MoneyLayout";
import MoneyDashboard from "./portals/money/pages/MoneyDashboard";
import ReactorDashboard from "./portals/money/pages/ReactorDashboard";
import MoneyPnL from "./portals/money/pages/MoneyPnL";
import MoneyTrends from "./portals/money/pages/MoneyTrends";
import MoneySimulator from "./portals/money/pages/MoneySimulator";
import MoneySolutions from "./portals/money/pages/MoneySolutions";
import MoneyAudit from "./portals/money/pages/MoneyAudit";
import MoneyForensic from "./portals/money/pages/MoneyForensic";
import MoneyPortfolio from "./portals/money/pages/MoneyPortfolio";
import MoneySettings from "./portals/money/pages/MoneySettings";
import MoneyBenchmarks from "./portals/money/pages/MoneyBenchmarks";
import QuietLayout from "./portals/quiet/QuietLayout";
import QuietDashboard from "./portals/quiet/pages/QuietDashboard";
import QuietModuleDetail from "./portals/quiet/pages/QuietModuleDetail";
import QuietRecommendations from "./portals/quiet/pages/QuietRecommendations";
import QuietHistory from "./portals/quiet/pages/QuietHistory";
import QuietScoreReport from "./portals/quiet/pages/QuietScoreReport";
import QuietIntakeForm from "./portals/quiet/pages/QuietIntakeForm";
import QuietDocumentUpload from "./portals/quiet/pages/QuietDocumentUpload";
import QuietSimulation from "./portals/quiet/pages/QuietSimulation";
import QuietFindings from "./portals/quiet/pages/QuietFindings";
import QuietSettings from "./portals/quiet/pages/QuietSettings";
import OverheadLayout from "./portals/overhead/OverheadLayout";
import OverheadDashboard from "./portals/overhead/pages/OverheadDashboard";
import OverheadCosts from "./portals/overhead/pages/OverheadCosts";
import OverheadNewCost from "./portals/overhead/pages/OverheadNewCost";
import OverheadRecurring from "./portals/overhead/pages/OverheadRecurring";
import OverheadAssets from "./portals/overhead/pages/OverheadAssets";
import OverheadAlerts from "./portals/overhead/pages/OverheadAlerts";
import OverheadBenchmarks from "./portals/overhead/pages/OverheadBenchmarks";
import OverheadBreakeven from "./portals/overhead/pages/OverheadBreakeven";
import OverheadSettings from "./portals/overhead/pages/OverheadSettings";

// Res OS Portal
import ResLayout from "./portals/reservation/ResLayout";
import ResDashboard from "./portals/reservation/pages/ResDashboard";
import ResDiary from "./portals/reservation/pages/ResDiary";
import ResFloor from "./portals/reservation/pages/ResFloor";
import ResReservations from "./portals/reservation/pages/ResReservations";
import ResNewReservation from "./portals/reservation/pages/ResNewReservation";
import ResReservationDetail from "./portals/reservation/pages/ResReservationDetail";
import ResWaitlist from "./portals/reservation/pages/ResWaitlist";
import ResGuests from "./portals/reservation/pages/ResGuests";
import ResGuestDetail from "./portals/reservation/pages/ResGuestDetail";
import ResFunctions from "./portals/reservation/pages/ResFunctions";
import ResNewFunction from "./portals/reservation/pages/ResNewFunction";
import ResFunctionDetail from "./portals/reservation/pages/ResFunctionDetail";
import FunctionsCRM from "./portals/reservation/pages/FunctionsCRM";
import FunctionClientDetail from "./portals/reservation/pages/FunctionClientDetail";
import FunctionProposalBuilder from "./portals/reservation/pages/FunctionProposalBuilder";
import FunctionVenueSpaces from "./portals/reservation/pages/FunctionVenueSpaces";
import ResForecast from "./portals/reservation/pages/ResForecast";
import ResFloorSettings from "./portals/reservation/pages/ResFloorSettings";
import ResSettings from "./portals/reservation/pages/ResSettings";
import ResWidgetConfig from "./portals/reservation/pages/ResWidgetConfig";
import ResFunctionWidgetConfig from "./portals/reservation/pages/ResFunctionWidgetConfig";
import ResReportGenerator from "./portals/reservation/pages/ResReportGenerator";
import ResEfficiencyAudit from "./portals/reservation/pages/ResEfficiencyAudit";
import ResTestPlan from "./portals/reservation/pages/ResTestPlan";
import ResTraining from "./portals/reservation/pages/ResTraining";
import ResHelpCenter from "./portals/reservation/pages/ResHelpCenter";
import ResVoiceAgent from "./portals/reservation/pages/ResVoiceAgent";
import ResShows from "./portals/reservation/pages/ResShows";
import JoinShift from "./pages/JoinShift";
import PublicBookingWidget from "./pages/PublicBookingWidget";
import PublicFunctionWidget from "./pages/PublicFunctionWidget";

// Games / Mastery Suite
import GamesLayout from "./portals/games/GamesLayout";
import GameHub from "./portals/games/pages/GameHub";
import OnionBlitzGame from "./portals/games/pages/OnionBlitzGame";
import AlleyCatGame from "./portals/games/pages/AlleyCatGame";
import GameLeaderboard from "./portals/games/pages/Leaderboard";
import GameProfilePage from "./portals/games/pages/Profile";

// VenueFlow Pages
import VFDashboard from "./portals/reservation/pages/VFDashboard";
import VFPipeline from "./portals/reservation/pages/VFPipeline";
import VFMenuTemplates from "./portals/reservation/pages/VFMenuTemplates";
import VFBeveragePackages from "./portals/reservation/pages/VFBeveragePackages";
import VFCSVImport from "./portals/reservation/pages/VFCSVImport";
import VFCalendar from "./portals/reservation/pages/VFCalendar";
import VFAnalytics from "./portals/reservation/pages/VFAnalytics";
import VFLeads from "./portals/reservation/pages/VFLeads";
import VFReferrals from "./portals/reservation/pages/VFReferrals";
import VFReactivation from "./portals/reservation/pages/VFReactivation";
import VFAutomations from "./portals/reservation/pages/VFAutomations";
import VFIntegrations from "./portals/reservation/pages/VFIntegrations";
import VFReports from "./portals/reservation/pages/VFReports";
import VFProposals from "./portals/reservation/pages/VFProposals";
import ProposalClientView from "./portals/reservation/pages/ProposalClientView";

// Vendor Portal
 import VendorLayout from "./portals/vendor/VendorLayout";
 import VendorAuth from "./portals/vendor/pages/VendorAuth";
 import VendorDashboard from "./portals/vendor/pages/VendorDashboard";
 import VendorInsights from "./portals/vendor/pages/VendorInsights";
 import VendorPricing from "./portals/vendor/pages/VendorPricing";
 import VendorOrders from "./portals/vendor/pages/VendorOrders";
 import VendorDeals from "./portals/vendor/pages/VendorDeals";
 import VendorMessages from "./portals/vendor/pages/VendorMessages";
 import VendorSettings from "./portals/vendor/pages/VendorSettings";
import VendorDemandHeatmap from "./portals/vendor/pages/VendorDemandHeatmap";
import VendorDealsPanel from "./portals/vendor/pages/VendorDealsPanel";
import VendorCatalogue from "./portals/vendor/pages/VendorCatalogue";
import VendorBetaAnalytics from "./portals/vendor/pages/VendorBetaAnalytics";
 
// Admin Portal
import AdminLayout from "./portals/admin/AdminLayout";
import AdminAuth from "./portals/admin/pages/AdminAuth";
import AdminDashboard from "./portals/admin/pages/AdminDashboard";
import AdminCRM from "./portals/admin/pages/AdminCRM";
import AdminAnalytics from "./portals/admin/pages/AdminAnalytics";
import AdminMarketing from "./portals/admin/pages/AdminMarketing";
import AdminSettings from "./portals/admin/pages/AdminSettings";
import AdminVendorDeals from "./portals/admin/pages/AdminVendorDeals";
import AdminTesting from "./portals/admin/pages/AdminTesting";
import AdminQAMobile from "./portals/admin/pages/AdminQAMobile";
import AdminQAWeb from "./portals/admin/pages/AdminQAWeb";
import AdminQACrossCutting from "./portals/admin/pages/AdminQACrossCutting";
import AdminSeedData from "./portals/admin/pages/AdminSeedData";
import AdminLauncher from "./portals/admin/pages/AdminLauncher";
import AdminOrganizations from "./portals/admin/pages/AdminOrganizations";
import AdminEmailTemplates from "./portals/admin/pages/AdminEmailTemplates";
import AdminUpdates from "./portals/admin/pages/AdminUpdates";
import AdminReleaseManager from "./portals/admin/pages/AdminReleaseManager";
import AdminBetaTracker from "./portals/admin/pages/AdminBetaTracker";
import AdminHelpCenter from "./portals/admin/pages/AdminHelpCenter";
import AdminHelpLinks from "./portals/admin/pages/AdminHelpLinks";
import AdminDomainLinks from "./portals/admin/pages/AdminDomainLinks";
import AdminAppLaunch from "./portals/admin/pages/AdminAppLaunch";
import AdminLandingPage from "./portals/admin/pages/AdminLandingPage";
import AdminHomeChefLanding from "./portals/admin/pages/AdminHomeChefLanding";
import AdminIdeas from "./portals/admin/pages/AdminIdeas";
import AdminSystem from "./portals/admin/pages/AdminSystem";
import AdminSalesDashboard from "./portals/admin/pages/AdminSalesDashboard";
import AdminReferralSettings from "./portals/admin/pages/AdminReferralSettings";
import AdminReferralAnalytics from "./portals/admin/pages/AdminReferralAnalytics";
import AdminReferralManagement from "./portals/admin/pages/AdminReferralManagement";
import AdminLeadPipeline from "./portals/admin/pages/AdminLeadPipeline";
import AdminPlans from "./portals/admin/pages/AdminPlans";
import VendorLanding from "./pages/VendorLanding";
import FoodSafetyLanding from "./pages/FoodSafetyLanding";
import IndianChefOSLanding from "./pages/IndianChefOSLanding";
import AdminVendorLanding from "./portals/admin/pages/AdminVendorLanding";
import AdminFoodSafetyLanding from "./portals/admin/pages/AdminFoodSafetyLanding";
import AdminIndianChefOSLanding from "./portals/admin/pages/AdminIndianChefOSLanding";
import GCCChefOSLanding from "./pages/GCCChefOSLanding";
import AdminGCCChefOSLanding from "./portals/admin/pages/AdminGCCChefOSLanding";
import IndiaHomeCookLanding from "./pages/IndiaHomeCookLanding";
import IndiaFoodSafetyLanding from "./pages/IndiaFoodSafetyLanding";
import GCCHomeCookLanding from "./pages/GCCHomeCookLanding";
import GCCFoodSafetyLanding from "./pages/GCCFoodSafetyLanding";
import MoneyOSLanding from "./pages/MoneyOSLanding";
import AdminIndiaHomeCookLanding from "./portals/admin/pages/AdminIndiaHomeCookLanding";
import AdminIndiaFoodSafetyLanding from "./portals/admin/pages/AdminIndiaFoodSafetyLanding";
import AdminGCCHomeCookLanding from "./portals/admin/pages/AdminGCCHomeCookLanding";
import AdminGCCFoodSafetyLanding from "./portals/admin/pages/AdminGCCFoodSafetyLanding";
import AdminMoneyLanding from "./portals/admin/pages/AdminMoneyLanding";
import SitePage from "./pages/SitePage";
import FAQPage from "./pages/FAQPage";
import AdminSitePages from "./portals/admin/pages/AdminSitePages";
import AdminAccounting from "./portals/admin/pages/AdminAccounting";
import AdminAiUsage from "./portals/admin/pages/AdminAiUsage";
import AdminQuotas from "./portals/admin/pages/AdminQuotas";
import AdminFixedCosts from "./portals/admin/pages/AdminFixedCosts";
import AdminRates from "./portals/admin/pages/AdminRates";
import AdminChefOSBrain from "./portals/admin/pages/AdminChefOSBrain";
import AdminNosh from "./portals/admin/pages/AdminNosh";
import TasteOfIT from "./pages/TasteOfIT";
import HelpGuide from "./pages/HelpGuide";
import LabourCertifications from "./portals/labour/pages/LabourCertifications";
import PublicTrainingWidget from "./pages/PublicTrainingWidget";

// The Private Wing (Wine Prototype)
import WingLayout from "./portals/wing/WingLayout";
import WineGate from "./portals/wing/pages/WineGate";
import WinePalate from "./portals/wing/pages/WinePalate";
import WineLobby from "./portals/wing/pages/WineLobby";
import WineProduct from "./portals/wing/pages/WineProduct";
import WineCellar from "./portals/wing/pages/WineCellar";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      // Prevent uncaught query errors from crashing the app
      throwOnError: false,
    },
    mutations: {
      retry: 0,
      throwOnError: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BetaBanner />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary fallbackMessage="Something went wrong. Please refresh the page.">
        <AuthProvider>
          <TermsAcceptanceGate>
          <OrgProvider>
          <VoiceCommandProvider>
            <Routes>
              {/* ========== PUBLIC PAGES ========== */}
              <Route path="/" element={<ChefOSLanding />} />
              <Route path="/home-cook" element={<HomeCookLanding />} />
              <Route path="/launch" element={<PortalSelect />} />
              <Route path="/taste" element={<TasteOfIT />} />
              <Route path="/book/:orgSlug" element={<PublicBookingWidget />} />
              <Route path="/functions/:orgSlug" element={<PublicFunctionWidget />} />
              <Route path="/proposal/:shareToken" element={<ProposalClientView />} />
              <Route path="/help/:module" element={<HelpGuide />} />
              <Route path="/help" element={<HelpGuide />} />
              <Route path="/train/:type/:orgSlug" element={<PublicTrainingWidget />} />
              <Route path="/join/:token" element={<JoinTeam />} />
              <Route path="/join-shift/:token" element={<JoinShift />} />
              <Route path="/vendor-landing" element={<VendorLanding />} />
              <Route path="/nosh" element={<NoshConsumerLanding />} />
              <Route path="/nosh/vendors" element={<NoshVendorLanding />} />
              <Route path="/food-safety" element={<FoodSafetyLanding />} />
              <Route path="/chefos-india" element={<IndianChefOSLanding />} />
              <Route path="/chefos-gcc" element={<GCCChefOSLanding />} />
              <Route path="/home-cook-india" element={<IndiaHomeCookLanding />} />
              <Route path="/food-safety-india" element={<IndiaFoodSafetyLanding />} />
              <Route path="/home-cook-gcc" element={<GCCHomeCookLanding />} />
              <Route path="/food-safety-gcc" element={<GCCFoodSafetyLanding />} />
              <Route path="/money-landing" element={<MoneyOSLanding />} />
              <Route path="/terms" element={<SitePage slug="terms" />} />
              <Route path="/privacy" element={<SitePage slug="privacy" />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/page/:slug" element={<SitePage />} />
              <Route path="/download" element={<Download />} />
              <Route path="/refer/:code" element={<ReferLanding />} />

              {/* ========== CHEF PORTAL ========== */}
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/dashboard" element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
              <Route path="/recipes" element={<ProtectedRoute module="recipes"><Recipes /></ProtectedRoute>} />
              <Route path="/recipes/new" element={<ProtectedRoute module="recipes"><RecipeEdit /></ProtectedRoute>} />
              <Route path="/recipes/:id" element={<ProtectedRoute module="recipes"><RecipeDetail /></ProtectedRoute>} />
              <Route path="/recipes/:id/edit" element={<ProtectedRoute module="recipes"><RecipeEdit /></ProtectedRoute>} />
              <Route path="/ingredients" element={<ProtectedRoute module="ingredients"><Ingredients /></ProtectedRoute>} />
              <Route path="/master-yield" element={<ProtectedRoute module="ingredients"><MasterYield /></ProtectedRoute>} />
              <Route path="/costing" element={<ProtectedRoute><Costing /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute module="inventory"><Inventory /></ProtectedRoute>} />
              <Route path="/inventory/*" element={<ProtectedRoute module="inventory"><Inventory /></ProtectedRoute>} />
              <Route path="/prep" element={<ProtectedRoute module="prep"><PrepLists /></ProtectedRoute>} />
              <Route path="/prep/*" element={<ProtectedRoute module="prep"><PrepLists /></ProtectedRoute>} />
              <Route path="/kitchen" element={<ProtectedRoute module="kitchen"><Kitchen /></ProtectedRoute>} />
              <Route path="/todo" element={<ProtectedRoute module="todo"><TodoList /></ProtectedRoute>} />
              <Route path="/production" element={<ProtectedRoute module="production"><Production /></ProtectedRoute>} />
              <Route path="/marketplace" element={<ProtectedRoute module="marketplace"><Marketplace /></ProtectedRoute>} />
              <Route path="/menu-engineering" element={<ProtectedRoute module="menu-engineering"><MenuEngineering /></ProtectedRoute>} />
              <Route path="/roster" element={<ProtectedRoute module="roster"><Roster /></ProtectedRoute>} />
              <Route path="/allergens" element={<ProtectedRoute module="allergens"><AllergenDashboard /></ProtectedRoute>} />
              <Route path="/food-safety" element={<ProtectedRoute module="food-safety"><FoodSafety /></ProtectedRoute>} />
              <Route path="/training" element={<ProtectedRoute module="training"><Training /></ProtectedRoute>} />
              <Route path="/training/:moduleId" element={<ProtectedRoute module="training"><TrainingPlayer /></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute module="invoices"><Invoices /></ProtectedRoute>} />
              <Route path="/invoices/*" element={<ProtectedRoute module="invoices"><Invoices /></ProtectedRoute>} />
              <Route path="/cheatsheets" element={<ProtectedRoute module="cheatsheets"><CookingCheatsheets /></ProtectedRoute>} />
              <Route path="/calendar" element={<ProtectedRoute module="calendar"><OperationsCalendar /></ProtectedRoute>} />
              <Route path="/kitchen-sections" element={<ProtectedRoute module="calendar"><KitchenSections /></ProtectedRoute>} />
              <Route path="/equipment" element={<ProtectedRoute module="equipment"><Equipment /></ProtectedRoute>} />
              <Route path="/team" element={<ProtectedRoute module="team"><Team /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/waste-log" element={<ProtectedRoute module="waste-log"><WasteLog /></ProtectedRoute>} />
              <Route path="/logs" element={<ProtectedRoute><Logs /></ProtectedRoute>} />
              <Route path="/feedback" element={<ProtectedRoute><AppLayout><Feedback /></AppLayout></ProtectedRoute>} />
              <Route path="/money-lite" element={<ProtectedRoute><AppLayout><MoneyLiteDashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/referral" element={<ProtectedRoute><ReferAndSave /></ProtectedRoute>} />
              <Route path="/housekeeping" element={<ProtectedRoute module="housekeeping"><Housekeeping /></ProtectedRoute>} />

               <Route path="/section/:sectionKey" element={<ProtectedRoute><SectionHub /></ProtectedRoute>} />
               <Route path="/more" element={<ProtectedRoute><More /></ProtectedRoute>} />

              {/* ========== MASTERY SUITE (GAMES) ========== */}
              <Route path="/games" element={<ProtectedRoute><GamesLayout /></ProtectedRoute>}>
                <Route index element={<GameHub />} />
                <Route path="onion-blitz" element={<OnionBlitzGame />} />
                <Route path="alley-cat" element={<AlleyCatGame />} />
                <Route path="leaderboard" element={<GameLeaderboard />} />
                <Route path="profile" element={<GameProfilePage />} />
              </Route>

              {/* ========== BEV OS ========== */}
              <Route path="/bev" element={<BevLayout />}>
                <Route path="dashboard" element={<BevDashboard />} />
                <Route path="cellar" element={<Cellar />} />
                <Route path="wine" element={<WineIntelligence />} />
                <Route path="draught" element={<DraughtManager />} />
                <Route path="cocktails" element={<CocktailsPage />} />
                <Route path="coffee" element={<CoffeeProgram />} />
                <Route path="pours" element={<Pours />} />
                <Route path="bar-prep" element={<BarPrep />} />
                <Route path="stocktake" element={<StocktakePage />} />
                <Route path="coravin" element={<CoravinManager />} />
                <Route path="flash-cards" element={<FlashCards />} />
                <Route path="ai" element={<BevAI />} />
                <Route path="costing" element={<BevCosting />} />
                <Route path="team" element={<BevTeam />} />
                <Route path="invoices" element={<BevInvoices />} />
                <Route path="equipment" element={<BevEquipment />} />
                <Route path="production" element={<BevProduction />} />
                <Route path="calendar" element={<BevCalendar />} />
                <Route path="training" element={<BevTraining />} />
                <Route path="compliance" element={<BevCompliance />} />
                <Route path="marketplace" element={<BevMarketplace />} />
                <Route path="engineering" element={<BevEngineering />} />
                <Route path="stations" element={<BevStations />} />
                <Route path="waste-log" element={<BevWasteLog />} />
                <Route path="settings" element={<BevSettings />} />
              </Route>

              {/* ========== RESTOS ========== */}
              <Route path="/pos" element={<ProtectedRoute><RestOSLayout /></ProtectedRoute>}>
                <Route index element={<POSOrderScreen />} />
                <Route path="kds" element={<KDSPage />} />
                <Route path="tabs" element={<TabsPage />} />
                <Route path="functions" element={<POSFunctions />} />
                <Route path="daily-close" element={<POSDailyClose />} />
                <Route path="waste" element={<POSWasteLog />} />
                <Route path="compliance" element={<POSCompliance />} />
                <Route path="audit" element={<POSAuditLog />} />
                <Route path="analytics" element={<POSAnalytics />} />
                <Route path="admin/menu" element={<MenuAdminPage />} />
                <Route path="admin/staff" element={<POSStaffAdmin />} />
                <Route path="admin/store" element={<POSStoreSettings />} />
                <Route path="admin/import" element={<POSImport />} />
              </Route>

              {/* ========== MODULE STUBS ========== */}
              <Route path="/labour" element={<LabourLayout />}>
                <Route path="dashboard" element={<LabourDashboard />} />
                <Route path="roster" element={<LabourRoster />} />
                <Route path="timesheets" element={<LabourTimesheets />} />
                <Route path="leave" element={<LabourLeave />} />
                <Route path="payroll" element={<LabourPayroll />} />
                <Route path="payroll/new" element={<LabourPayRunNew />} />
                <Route path="employees" element={<LabourEmployees />} />
                <Route path="employees/new" element={<LabourEmployeeNew />} />
                <Route path="compliance" element={<LabourCompliance />} />
                <Route path="compliance/certs" element={<LabourCertifications />} />
                <Route path="settings" element={<LabourSettings />} />
                {/* People OS */}
                <Route path="people" element={<PeopleDashboard />} />
                <Route path="people/recruitment" element={<PeopleRecruitment />} />
                <Route path="people/recruitment/:id" element={<PeoplePositionDetail />} />
                <Route path="people/applicants/:id" element={<PeopleApplicantDetail />} />
                <Route path="people/directory" element={<PeopleDirectory />} />
                <Route path="people/directory/:id" element={<PeopleEmployeeProfile />} />
                <Route path="people/onboarding" element={<PeopleOnboarding />} />
                <Route path="people/reviews" element={<PeopleReviews />} />
                <Route path="people/warnings" element={<PeopleWarnings />} />
                <Route path="people/settings" element={<PeopleSettings />} />
              </Route>
              {/* ========== CLOCK OS ========== */}
              <Route path="/clock" element={<ClockLayout />}>
                <Route index element={<ClockScreen />} />
                <Route path="dashboard" element={<ClockDashboard />} />
                <Route path="timesheets" element={<ClockTimesheets />} />
                <Route path="override" element={<ClockOverride />} />
                <Route path="induction" element={<ClockInduction />} />
                <Route path="onboarding" element={<ClockOnboarding />} />
                <Route path="employees" element={<ClockEmployees />} />
                <Route path="devices" element={<ClockDevices />} />
                <Route path="pins" element={<ClockPins />} />
                <Route path="settings" element={<ClockSettingsPage />} />
              </Route>
              {/* ========== SUPPLY OS ========== */}
              <Route path="/supply" element={<SupplyLayout />}>
                <Route path="dashboard" element={<SupplyDashboard />} />
                <Route path="orders" element={<SupplyOrders />} />
                <Route path="suppliers" element={<SupplySuppliers />} />
                <Route path="receiving" element={<SupplyReceiving />} />
                <Route path="price-watch" element={<SupplyPriceWatch />} />
                <Route path="settings" element={<SupplySettings />} />
              </Route>
              <Route path="/growth" element={<GrowthLayout />}>
                <Route path="dashboard" element={<GrowthDashboard />} />
                <Route path="campaigns" element={<GrowthCampaigns />} />
                <Route path="campaigns/:id" element={<GrowthCampaignDetail />} />
                <Route path="calendar" element={<GrowthCalendar />} />
                <Route path="segments" element={<GrowthSegments />} />
                <Route path="analytics" element={<GrowthAnalytics />} />
                <Route path="settings" element={<GrowthSettings />} />
              </Route>
              <Route path="/money" element={<MoneyLayout />}>
                <Route path="dashboard" element={<MoneyDashboard />} />
                <Route path="reactor" element={<ReactorDashboard />} />
                <Route path="pnl" element={<MoneyPnL />} />
                <Route path="trends" element={<MoneyTrends />} />
                <Route path="benchmarks" element={<MoneyBenchmarks />} />
                <Route path="simulator" element={<MoneySimulator />} />
                <Route path="solutions" element={<MoneySolutions />} />
                <Route path="audit" element={<MoneyAudit />} />
                <Route path="forensic" element={<MoneyForensic />} />
                <Route path="portfolio" element={<MoneyPortfolio />} />
                <Route path="settings" element={<MoneySettings />} />
              </Route>
              {/* ========== QUIET AUDIT ========== */}
              <Route path="/quiet" element={<QuietLayout />}>
                <Route path="dashboard" element={<QuietDashboard />} />
                <Route path="modules/:moduleId" element={<QuietModuleDetail />} />
                <Route path="recommendations" element={<QuietRecommendations />} />
                <Route path="history" element={<QuietHistory />} />
                <Route path="report" element={<QuietScoreReport />} />
                <Route path="external/new" element={<QuietIntakeForm />} />
                <Route path="external/upload" element={<QuietDocumentUpload />} />
                <Route path="simulation" element={<QuietSimulation />} />
                <Route path="findings" element={<QuietFindings />} />
                <Route path="settings" element={<QuietSettings />} />
              </Route>
              {/* ========== RES OS ========== */}
              <Route path="/reservation" element={<ResLayout />}>
                <Route path="dashboard" element={<ResDashboard />} />
                <Route path="diary" element={<ResDiary />} />
                <Route path="floor" element={<ResFloor />} />
                <Route path="reservations" element={<ResReservations />} />
                <Route path="reservations/new" element={<ResNewReservation />} />
                <Route path="reservations/:id" element={<ResReservationDetail />} />
                <Route path="waitlist" element={<ResWaitlist />} />
                <Route path="shows" element={<ResShows />} />
                <Route path="guests" element={<ResGuests />} />
                <Route path="guests/:id" element={<ResGuestDetail />} />
                <Route path="functions" element={<ResFunctions />} />
                <Route path="functions/new" element={<ResNewFunction />} />
                <Route path="functions/crm" element={<FunctionsCRM />} />
                <Route path="functions/crm/:id" element={<FunctionClientDetail />} />
                <Route path="functions/proposals/new" element={<FunctionProposalBuilder />} />
                <Route path="functions/proposals/:id" element={<FunctionProposalBuilder />} />
                <Route path="functions/spaces" element={<FunctionVenueSpaces />} />
                <Route path="functions/:id" element={<ResFunctionDetail />} />
                <Route path="forecast" element={<ResForecast />} />
                <Route path="settings" element={<ResSettings />} />
                <Route path="settings/floor" element={<ResFloorSettings />} />
                <Route path="widget" element={<ResWidgetConfig />} />
                <Route path="function-widget" element={<ResFunctionWidgetConfig />} />
                {/* ========== VENUEFLOW ========== */}
                <Route path="venueflow/dashboard" element={<VFDashboard />} />
                <Route path="venueflow/pipeline" element={<VFPipeline />} />
                <Route path="venueflow/calendar" element={<VFCalendar />} />
                <Route path="venueflow/menus" element={<VFMenuTemplates />} />
                <Route path="venueflow/beverages" element={<VFBeveragePackages />} />
                <Route path="venueflow/proposals" element={<VFProposals />} />
                <Route path="venueflow/leads" element={<VFLeads />} />
                <Route path="venueflow/referrals" element={<VFReferrals />} />
                <Route path="venueflow/reactivation" element={<VFReactivation />} />
                <Route path="venueflow/analytics" element={<VFAnalytics />} />
                <Route path="venueflow/csv-import" element={<VFCSVImport />} />
                <Route path="venueflow/automations" element={<VFAutomations />} />
                <Route path="venueflow/integrations" element={<VFIntegrations />} />
                <Route path="venueflow/reports" element={<VFReports />} />
                {/* ========== REPORTS & EFFICIENCY ========== */}
                <Route path="reports/generate" element={<ResReportGenerator />} />
                <Route path="reports/efficiency" element={<ResEfficiencyAudit />} />
                {/* ========== HELP, TRAINING & TEST PLAN ========== */}
                <Route path="help" element={<ResHelpCenter />} />
                <Route path="training" element={<ResTraining />} />
                <Route path="test-plan" element={<ResTestPlan />} />
                <Route path="voice-agent" element={<ResVoiceAgent />} />
              </Route>
              <Route path="/overhead" element={<OverheadLayout />}>
                <Route path="dashboard" element={<OverheadDashboard />} />
                <Route path="costs" element={<OverheadCosts />} />
                <Route path="costs/new" element={<OverheadNewCost />} />
                <Route path="recurring" element={<OverheadRecurring />} />
                <Route path="assets" element={<OverheadAssets />} />
                <Route path="alerts" element={<OverheadAlerts />} />
                <Route path="benchmarks" element={<OverheadBenchmarks />} />
                <Route path="breakeven" element={<OverheadBreakeven />} />
                <Route path="settings" element={<OverheadSettings />} />
              </Route>
              {/* ========== VENDOR PORTAL ========== */}
              <Route path="/vendor/auth" element={<VendorAuth />} />
              <Route path="/vendor" element={<VendorLayout />}>
                <Route path="dashboard" element={<VendorDashboard />} />
                <Route path="insights" element={<VendorInsights />} />
                <Route path="pricing" element={<VendorPricing />} />
                <Route path="orders" element={<VendorOrders />} />
                <Route path="deals" element={<VendorDeals />} />
                <Route path="messages" element={<VendorMessages />} />
                <Route path="settings" element={<VendorSettings />} />
                <Route path="demand" element={<VendorDemandHeatmap />} />
                <Route path="beta-deals" element={<VendorDealsPanel />} />
                <Route path="catalogue" element={<VendorCatalogue />} />
                <Route path="beta-analytics" element={<VendorBetaAnalytics />} />
              </Route>

              {/* ========== ADMIN PORTAL ========== */}
              <Route path="/admin/auth" element={<AdminAuth />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="vendor-deals" element={<AdminVendorDeals />} />
                <Route path="crm" element={<AdminCRM />} />
                <Route path="ideas" element={<AdminIdeas />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="marketing" element={<AdminMarketing />} />
                <Route path="testing" element={<AdminTesting />} />
                <Route path="qa/mobile" element={<AdminQAMobile />} />
                <Route path="qa/web" element={<AdminQAWeb />} />
                <Route path="qa/cross-cutting" element={<AdminQACrossCutting />} />
                <Route path="seed" element={<AdminSeedData />} />
                <Route path="releases" element={<AdminReleaseManager />} />
                <Route path="launcher" element={<AdminReleaseManager />} />
                <Route path="organizations" element={<AdminOrganizations />} />
                <Route path="email-templates" element={<AdminEmailTemplates />} />
                <Route path="updates" element={<AdminReleaseManager />} />
                <Route path="beta" element={<AdminBetaTracker />} />
                <Route path="brain" element={<AdminChefOSBrain />} />
                <Route path="nosh" element={<AdminNosh />} />
                <Route path="help" element={<AdminHelpCenter />} />
                <Route path="help-links" element={<AdminHelpLinks />} />
                <Route path="domain-links" element={<AdminDomainLinks />} />
                <Route path="app-launch" element={<AdminAppLaunch />} />
                <Route path="landing-page" element={<AdminLandingPage />} />
                <Route path="home-chef-landing" element={<AdminHomeChefLanding />} />
                <Route path="vendor-landing" element={<AdminVendorLanding />} />
                <Route path="food-safety-landing" element={<AdminFoodSafetyLanding />} />
                <Route path="india-chefos-landing" element={<AdminIndianChefOSLanding />} />
                <Route path="gcc-chefos-landing" element={<AdminGCCChefOSLanding />} />
                <Route path="india-home-cook-landing" element={<AdminIndiaHomeCookLanding />} />
                <Route path="india-food-safety-landing" element={<AdminIndiaFoodSafetyLanding />} />
                <Route path="gcc-home-cook-landing" element={<AdminGCCHomeCookLanding />} />
                <Route path="gcc-food-safety-landing" element={<AdminGCCFoodSafetyLanding />} />
                <Route path="money-landing" element={<AdminMoneyLanding />} />
                <Route path="site-pages" element={<AdminSitePages />} />
                <Route path="system" element={<AdminSystem />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="accounting" element={<AdminAccounting />} />
                <Route path="ai-usage" element={<AdminAiUsage />} />
                <Route path="quotas" element={<AdminQuotas />} />
                <Route path="fixed-costs" element={<AdminFixedCosts />} />
                <Route path="rates" element={<AdminRates />} />
                <Route path="sales" element={<AdminSalesDashboard />} />
                <Route path="sales/crm" element={<AdminCRM />} />
                <Route path="sales/plans" element={<AdminPlans />} />
                <Route path="sales/settings" element={<AdminReferralSettings />} />
                <Route path="sales/analytics" element={<AdminReferralAnalytics />} />
                <Route path="sales/referrals" element={<AdminReferralManagement />} />
                <Route path="sales/leads" element={<AdminLeadPipeline />} />
              </Route>

              {/* ========== THE PRIVATE WING ========== */}
              <Route path="/wing" element={<WineGate />} />
              <Route path="/wing" element={<WingLayout />}>
                <Route path="palate" element={<WinePalate />} />
                <Route path="lobby" element={<WineLobby />} />
                <Route path="product/:id" element={<WineProduct />} />
                <Route path="cellar" element={<WineCellar />} />
              </Route>

              {/* CATCH-ALL 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <ChefAIChat />
            <PWAInstallPrompt />
            
          </VoiceCommandProvider>
          </OrgProvider>
          </TermsAcceptanceGate>
        </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
