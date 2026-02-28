import LandingPageEditor from "../components/LandingPageEditor";
import { useIndianChefOSLandingSections } from "@/hooks/useIndianChefOSLandingSections";

const AdminIndianChefOSLanding = () => (
  <LandingPageEditor
    pageTitle="India ChefOS Landing Page"
    pageSubtitle="Edit the Indian market ChefOS landing page"
    previewUrl="/chefos-india"
    tableName="indian_chefos_landing_sections"
    useSectionsHook={useIndianChefOSLandingSections}
  />
);

export default AdminIndianChefOSLanding;
