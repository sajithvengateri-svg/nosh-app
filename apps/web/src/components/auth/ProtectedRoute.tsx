import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { DEV_MODE } from "@/lib/devMode";

interface ProtectedRouteProps {
  children: ReactNode;
  module?: string;
  requireEdit?: boolean;
}

const ProtectedRoute = ({ children, module, requireEdit = false }: ProtectedRouteProps) => {
  const { user, isLoading, canView, canEdit } = useAuth();
  const location = useLocation();

  // Bypass auth in dev mode
  if (DEV_MODE) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate auth based on the current path
    const isVendorRoute = location.pathname.startsWith("/vendor");
    const isAdminRoute = location.pathname.startsWith("/admin");
    const authPath = isVendorRoute ? "/vendor/auth" : isAdminRoute ? "/admin/auth" : "/auth";
    return <Navigate to={authPath} state={{ from: location }} replace />;
  }

  // Check module permissions if specified
  if (module) {
    if (requireEdit && !canEdit(module)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have edit access to this module.</p>
          </div>
        </div>
      );
    }
    if (!canView(module)) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">You don't have access to this module.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
