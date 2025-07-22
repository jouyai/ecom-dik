import { Loader2 } from "lucide-react";

/**
 * Komponen ini menampilkan indikator loading layar penuh
 * yang digunakan saat aplikasi pertama kali memuat data sesi pengguna.
 */
export default function AppLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-stone-50">
      <Loader2 className="h-10 w-10 animate-spin text-stone-500" />
      <p className="mt-4 text-lg text-stone-600">Memuat Sesi Anda...</p>
    </div>
  );
}
