import LandingPageEditor from "../components/LandingPageEditor";
import { useIndiaHomeCookLandingSections } from "@/hooks/useIndiaHomeCookLandingSections";

const AdminIndiaHomeCookLanding = () => (
  <LandingPageEditor
    pageTitle="India Home Cook Landing Page"
    pageSubtitle="Edit each section of the India Home Cook landing page"
    previewUrl="/home-cook-india"
    tableName="india_home_cook_landing_sections"
    useSectionsHook={useIndiaHomeCookLandingSections}
  />
);

export default AdminIndiaHomeCookLanding;
