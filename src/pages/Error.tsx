import { Link } from "react-router-dom";
import { XCircleIcon } from "lucide-react";

export default function ErrorPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center px-4">
      <XCircleIcon className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Pembayaran Gagal</h1>
      <p className="text-gray-600 mb-6">
        Terjadi kesalahan saat memproses pembayaran. Silakan coba lagi atau gunakan metode lain.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
