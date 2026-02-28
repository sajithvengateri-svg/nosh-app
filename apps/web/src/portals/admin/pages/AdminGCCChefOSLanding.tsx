import LandingPageEditor from "../components/LandingPageEditor";
import { useGCCChefOSLandingSections } from "@/hooks/useGCCChefOSLandingSections";

const AdminGCCChefOSLanding = () => (
  <LandingPageEditor
    pageTitle="GCC ChefOS Landing Page"
    pageSubtitle="Edit the GCC/Middle East ChefOS landing page"
    previewUrl="/chefos-gcc"
    tableName="gcc_chefos_landing_sections"
    useSectionsHook={useGCCChefOSLandingSections}
  />
);

export default AdminGCCChefOSLanding;
