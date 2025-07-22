import { useAuth } from "@/context/auth";
import { Navigate, Outlet } from "react-router-dom";

/**
 * Komponen ini melindungi rute yang hanya boleh diakses oleh pengguna yang BELUM login.
 * Jika pengguna sudah login, mereka akan diarahkan ke halaman utama.
 * Contoh: Halaman /login, /register.
 */
export default function GuestRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-10">Memeriksa sesi...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
