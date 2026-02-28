import LandingPageEditor from "../components/LandingPageEditor";
import { useGCCHomeCookLandingSections } from "@/hooks/useGCCHomeCookLandingSections";

const AdminGCCHomeCookLanding = () => (
  <LandingPageEditor
    pageTitle="GCC Home Cook Landing Page"
    pageSubtitle="Edit each section of the GCC Home Cook landing page"
    previewUrl="/home-cook-gcc"
    tableName="gcc_home_cook_landing_sections"
    useSectionsHook={useGCCHomeCookLandingSections}
  />
);

export default AdminGCCHomeCookLanding;
