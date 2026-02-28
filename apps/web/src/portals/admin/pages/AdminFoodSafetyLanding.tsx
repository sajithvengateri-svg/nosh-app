import LandingPageEditor from "../components/LandingPageEditor";
import { useFoodSafetyLandingSections } from "@/hooks/useFoodSafetyLandingSections";

const AdminFoodSafetyLanding = () => (
  <LandingPageEditor
    pageTitle="Food Safety Landing Page"
    pageSubtitle="Edit the Food Safety Brisbane / BCC Eat Safe landing page"
    previewUrl="/food-safety-landing"
    tableName="food_safety_landing_sections"
    useSectionsHook={useFoodSafetyLandingSections}
  />
);

export default AdminFoodSafetyLanding;
