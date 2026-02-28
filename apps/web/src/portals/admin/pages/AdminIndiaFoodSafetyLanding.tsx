import LandingPageEditor from "../components/LandingPageEditor";
import { useIndiaFoodSafetyLandingSections } from "@/hooks/useIndiaFoodSafetyLandingSections";

const AdminIndiaFoodSafetyLanding = () => (
  <LandingPageEditor
    pageTitle="India Food Safety Landing Page"
    pageSubtitle="Edit the India Food Safety / FSSAI compliance landing page"
    previewUrl="/food-safety-india"
    tableName="india_food_safety_landing_sections"
    useSectionsHook={useIndiaFoodSafetyLandingSections}
  />
);

export default AdminIndiaFoodSafetyLanding;
