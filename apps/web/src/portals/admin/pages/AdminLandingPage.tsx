import LandingPageEditor from "../components/LandingPageEditor";
import { useLandingSections } from "@/hooks/useLandingSections";

const AdminLandingPage = () => (
  <LandingPageEditor
    pageTitle="ChefOS Landing Page"
    pageSubtitle="Edit each section of the main ChefOS landing page"
    previewUrl="/"
    tableName="landing_sections"
    useSectionsHook={useLandingSections}
  />
);

export default AdminLandingPage;
