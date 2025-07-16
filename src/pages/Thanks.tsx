import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/lib/cartStore";
import { CheckCircle } from "lucide-react";

export default function Thanks() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const { toggleRefresh } = useCart();

  // Reset badge/cart saat user sampai di halaman ini
  useEffect(() => {
    toggleRefresh();
  }, [toggleRefresh]);

  // Timer untuk redirect otomatis
  useEffect(() => {
    if (countdown <= 0) {
      navigate("/");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <section className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
      <CheckCircle className="mx-auto text-green-500 w-16 h-16" aria-hidden="true" />
      
      <h1 className="text-3xl font-bold text-gray-800">
        Pembayaran Berhasil 🎉
      </h1>

      <p className="text-gray-600">
        Terima kasih telah melakukan pemesanan! Kami sedang memproses pesanan kamu.
      </p>

      <p className="text-sm text-gray-500">
        Kamu akan diarahkan kembali ke halaman utama dalam{" "}
        <span className="font-bold text-gray-800">{countdown}</span> detik.
      </p>
    </section>
  );
}
