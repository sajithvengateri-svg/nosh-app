import { Monitor } from "lucide-react";
import StubDashboard from "@/components/stubs/StubDashboard";

const POSOSDashboard = () => (
  <StubDashboard
    name="POS OS"
    subtitle="Point-of-sale and front-of-house service management"
    gradient="from-rose-500 to-pink-500"
    icon={<Monitor className="w-10 h-10 text-white" />}
  />
);

export default POSOSDashboard;
