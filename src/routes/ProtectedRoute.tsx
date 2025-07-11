import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/context/auth"

interface ProtectedRouteProps {
  allowedRoles?: ("admin" | "buyer")[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth()

  if (loading) return <div className="text-center p-6">Loading...</div>

  // Belum login
  if (!user) return <Navigate to="/login" replace />

  // Role tidak sesuai
  if (allowedRoles && !allowedRoles.includes(user.role as any)) {
    return <Navigate to="/" replace />
  }

  // Lolos semua cek
  return <Outlet />
}
