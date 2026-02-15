import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !roles.includes(requiredRole)) {
    // Redirect to appropriate dashboard based on role
    if (roles.includes("super_admin")) return <Navigate to="/admin" replace />;
    if (roles.includes("club_admin")) return <Navigate to="/club-admin" replace />;
    return <Navigate to="/member" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
