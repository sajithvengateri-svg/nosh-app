import LandingPageEditor from "../components/LandingPageEditor";
import { useGCCFoodSafetyLandingSections } from "@/hooks/useGCCFoodSafetyLandingSections";

const AdminGCCFoodSafetyLanding = () => (
  <LandingPageEditor
    pageTitle="GCC Food Safety Landing Page"
    pageSubtitle="Edit the GCC Food Safety / Dubai Municipality compliance landing page"
    previewUrl="/food-safety-gcc"
    tableName="gcc_food_safety_landing_sections"
    useSectionsHook={useGCCFoodSafetyLandingSections}
  />
);

export default AdminGCCFoodSafetyLanding;
