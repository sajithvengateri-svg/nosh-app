import LandingPageEditor from "../components/LandingPageEditor";
import { useMoneyLandingSections } from "@/hooks/useMoneyLandingSections";

const AdminMoneyLanding = () => (
  <LandingPageEditor
    pageTitle="MoneyOS Landing Page"
    pageSubtitle="Edit each section of the MoneyOS landing page"
    previewUrl="/money-landing"
    tableName="money_landing_sections"
    useSectionsHook={useMoneyLandingSections}
  />
);

export default AdminMoneyLanding;
