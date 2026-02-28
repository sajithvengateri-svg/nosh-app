import { CalendarCheck } from "lucide-react";
import StubDashboard from "@/components/stubs/StubDashboard";

const ReservationDashboard = () => (
  <StubDashboard
    name="Res OS"
    subtitle="Bookings, table management, and guest flow"
    gradient="from-teal-500 to-cyan-500"
    icon={<CalendarCheck className="w-10 h-10 text-white" />}
  />
);

export default ReservationDashboard;
