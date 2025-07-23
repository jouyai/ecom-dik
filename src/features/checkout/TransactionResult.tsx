import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import type { JSX } from "react/jsx-runtime";

interface StatusDetails {
  icon: JSX.Element;
  title: string;
  message: string;
  color: string;
}

const statusMap: Record<string, StatusDetails> = {
  settlement: {
    icon: <CheckCircle className="h-16 w-16" />,
    title: "Pembayaran Berhasil 🎉",
    message: "Terima kasih telah melakukan pemesanan! Kami sedang memproses pesanan Anda.",
    color: "text-green-500",
  },
  capture: {
    icon: <CheckCircle className="h-16 w-16" />,
    title: "Pembayaran Berhasil 🎉",
    message: "Terima kasih telah melakukan pemesanan! Kami sedang memproses pesanan Anda.",
    color: "text-green-500",
  },
  pending: {
    icon: <Clock className="h-16 w-16" />,
    title: "Menunggu Pembayaran",
    message: "Kami masih menunggu konfirmasi pembayaran Anda. Silakan selesaikan pembayaran Anda.",
    color: "text-yellow-500",
  },
  deny: {
    icon: <XCircle className="h-16 w-16" />,
    title: "Pembayaran Ditolak",
    message: "Maaf, pembayaran Anda ditolak. Silakan coba lagi dengan metode pembayaran lain.",
    color: "text-red-500",
  },
  default: {
    icon: <XCircle className="h-16 w-16" />,
    title: "Terjadi Kesalahan",
    message: "Terjadi kesalahan yang tidak diketahui. Silakan hubungi dukungan pelanggan.",
    color: "text-red-500",
  }
};

export default function TransactionResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState<StatusDetails | null>(null);

  useEffect(() => {
    document.title = "Furniture | Transaction Result";

    const status = searchParams.get("transaction_status") || "default";
    setDetails(statusMap[status] || statusMap.default);

    const timer = setTimeout(() => {
      navigate("/");
    }, 7000);

    return () => clearTimeout(timer);
  }, [searchParams, navigate]);

  if (!details) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className={details.color}>{details.icon}</div>
      <h1 className="text-3xl font-bold mt-4">{details.title}</h1>
      <p className="text-gray-600 mt-2 max-w-md">{details.message}</p>
      <p className="text-sm text-gray-500 mt-8">
        Anda akan diarahkan kembali ke halaman utama secara otomatis...
      </p>
    </div>
  );
}