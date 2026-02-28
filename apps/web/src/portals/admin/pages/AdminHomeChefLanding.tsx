import LandingPageEditor from "../components/LandingPageEditor";
import { useHomeCookLandingSections } from "@/hooks/useHomeCookLandingSections";

const AdminHomeChefLanding = () => (
  <LandingPageEditor
    pageTitle="Home Chef Landing Page"
    pageSubtitle="Edit each section of the Home Cook landing page"
    previewUrl="/home-cook"
    tableName="home_cook_landing_sections"
    useSectionsHook={useHomeCookLandingSections}
  />
);

export default AdminHomeChefLanding;
