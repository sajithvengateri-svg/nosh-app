import LandingPageEditor from "../components/LandingPageEditor";
import { useVendorLandingSections } from "@/hooks/useVendorLandingSections";

const AdminVendorLanding = () => (
  <LandingPageEditor
    pageTitle="Vendor Landing Page"
    pageSubtitle="Edit each section of the Vendor marketplace landing page"
    previewUrl="/vendor-landing"
    tableName="vendor_landing_sections"
    useSectionsHook={useVendorLandingSections}
  />
);

export default AdminVendorLanding;
