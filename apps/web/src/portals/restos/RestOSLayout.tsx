import { Outlet } from "react-router-dom";
import RestOSSidebar from "./components/RestOSSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Monitor, Wifi, WifiOff } from "lucide-react";
import { usePOSStore } from "@/lib/shared/state/posStore";

export default function RestOSLayout() {
  const terminalStatus = usePOSStore((s) => s.terminalStatus);
  const activeStaff = usePOSStore((s) => s.activeStaff);

  const statusColor =
    terminalStatus === "connected"
      ? "text-emerald-400"
      : terminalStatus === "busy"
      ? "text-amber-400"
      : "text-red-400";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#0f1117] text-slate-100">
        <RestOSSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#0f1117]/80 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-slate-400 hover:text-white" />
              <Monitor className="h-5 w-5 text-rose-400" />
              <span className="font-semibold text-sm tracking-wide">RestOS</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              {activeStaff && (
                <span className="text-slate-400">
                  {activeStaff.display_name} · <span className="capitalize">{activeStaff.pos_role}</span>
                </span>
              )}
              <div className={`flex items-center gap-1.5 ${statusColor}`}>
                {terminalStatus === "disconnected" ? (
                  <WifiOff className="h-3.5 w-3.5" />
                ) : (
                  <Wifi className="h-3.5 w-3.5" />
                )}
                <span className="capitalize">{terminalStatus}</span>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
