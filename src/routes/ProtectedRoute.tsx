import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/auth";

interface ProtectedRouteProps {
  allowedRoles?: ("admin" | "buyer")[];
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center p-6">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    const redirectPath = user.role === "admin" ? "/admin" : "/";
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
}
