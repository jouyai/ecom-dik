import { Link } from "react-router-dom";
import { ClockIcon } from "lucide-react";

export default function Pending() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center px-4">
      <ClockIcon className="w-16 h-16 text-yellow-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Pembayaran Sedang Diproses</h1>
      <p className="text-gray-600 mb-6">
        Kami sedang menunggu konfirmasi dari sistem pembayaran. Jangan tutup halaman ini terlalu cepat.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
