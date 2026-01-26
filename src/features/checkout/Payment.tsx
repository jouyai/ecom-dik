import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCart } from "@/context/cartStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ChevronRight, Loader2, Clock } from "lucide-react";
import useMidtransSnap from "@/hooks/useMidtransSnap";
import { validateStock, reserveStock, ORDER_EXPIRY_DURATION } from "@/lib/stockUtils";

declare global {
  interface Window {
    snap: any;
  }
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function Payment() {
  const isSnapReady = useMidtransSnap();
  const { user } = useAuth();
  const { toggleRefresh } = useCart();
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    document.title = "Furniture | Payment";

    const fetchCart = async () => {
      if (!user) return;
      try {
        const snapshot = await getDocs(
          collection(db, "cart", user.email!, "items")
        );
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as CartItem));
        setCart(items);

        const totalPrice = items.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        setTotal(totalPrice);
      } catch (error) {
        console.error("Gagal memuat keranjang:", error);
        toast.error("Gagal memuat detail pembayaran.");
      }
    };

    fetchCart();
  }, [user]);

  const handleSnapPayment = async () => {
    if (!isSnapReady) {
      toast.error("Layanan pembayaran sedang dimuat, coba lagi sesaat.");
      return;
    }
    if (!user || cart.length === 0) {
      return toast.error("Keranjang kosong.");
    }
    setPaymentProcessing(true);

    try {
      // 1. Validasi stock terlebih dahulu
      const stockCheck = await validateStock(cart);
      if (!stockCheck.valid) {
        toast.error(stockCheck.message || "Stok tidak mencukupi");
        setPaymentProcessing(false);
        return;
      }

      const orderId = `ORDER-${Date.now()}`;

      const res = await fetch(
        "https://jouyai-midtrans-api.hf.space/api/create-transaction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            gross_amount: total,
            name: user.displayName || user.username || "Pelanggan",
            email: user.email,
            finish: "https://ecom-dik.vercel.app/thanks",
          }),
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal membuat sesi pembayaran.");
      }

      const data = await res.json();
      if (!data.token) throw new Error("Gagal mendapatkan Snap token.");

      // 2. Reservasi stock & Simpan Order SEBELUM buka popup
      // Ini memastikan jika user refresh/close, pesanan sudah tercatat dan stok ter-book
      await reserveStock(cart);

      const expiresAt = Timestamp.fromDate(new Date(Date.now() + ORDER_EXPIRY_DURATION));
      const snapToken = data.token;

      const orderRef = await addDoc(collection(db, "orders"), {
        user: user.email,
        items: cart,
        total,
        paymentMethod: "MIDTRANS",
        status: "menunggu konfirmasi",
        createdAt: serverTimestamp(),
        expiresAt,
        stockReserved: true,
        snap_token: snapToken,
        order_id: orderId // ID unik untuk referensi Midtrans
      });

      // Menghapus dari keranjang karena sudah jadi pesanan
      await clearCart();

      window.snap.pay(snapToken, {
        onSuccess: async (result: any) => {
          await updateDoc(doc(db, "orders", orderRef.id), {
            status: "sudah dibayar",
            snap_result: result
          });
          toast.success("Pembayaran Berhasil!");
          navigate("/orders");
        },
        onPending: async (result: any) => {
          await updateDoc(doc(db, "orders", orderRef.id), {
            snap_result: result
          });
          toast.info("Silakan selesaikan pembayaran sesuai instruksi.");
          navigate("/orders");
        },
        onError: async (_result: any) => {
          toast.error("Terjadi kesalahan saat pembayaran.");
          navigate("/orders");
        },
        onClose: async () => {
          toast.info("Jendela pembayaran ditutup. Anda bisa melanjutkan pembayaran di halaman Pesanan Saya.");
          navigate("/orders");
        },
      });
    } catch (err: any) {
      toast.error(`Gagal memproses pembayaran: ${err.message}`);
      setPaymentProcessing(false);
    }
  };

  const clearCart = async () => {
    if (!user) return;
    const itemDeletes = cart.map((item) =>
      deleteDoc(doc(db, "cart", user.email!, "items", item.id))
    );
    await Promise.all(itemDeletes);
    toggleRefresh();
  };

  return (
    <div className="bg-stone-50 min-h-screen py-12">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-stone-500 mb-8">
          <Link to="/checkout" className="hover:text-amber-700">Keranjang</Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <Link to="/shipping" className="hover:text-amber-700">Pengiriman</Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="text-stone-800 font-medium">Pembayaran</span>
        </div>

        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Konfirmasi Pembayaran</CardTitle>
            <CardDescription>
              Periksa kembali pesanan Anda dan lanjutkan ke pembayaran.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 divide-y divide-stone-200">
              {cart.map(item => (
                <div key={item.id} className="flex items-center pt-4 first:pt-0">
                  <img src={item.image || 'https://placehold.co/64x64/e2e8f0/e2e8f0'} alt={item.name} className="w-16 h-16 rounded-md object-contain border p-1" />
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-stone-800">{item.name}</p>
                    <p className="text-sm text-stone-500">{item.quantity} x Rp {item.price.toLocaleString()}</p>
                  </div>
                  <p className="font-semibold text-stone-800">Rp {(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-200 mt-6 pt-6 space-y-2">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal</span>
                <span>Rp {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Pengiriman</span>
                <span>Gratis</span>
              </div>
              <div className="flex justify-between font-bold text-stone-800 text-xl">
                <span>Total Pembayaran</span>
                <span>Rp {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Info Batas Waktu */}
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-900">Batas Waktu Pembayaran</p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Pesanan Anda akan di-book selama **24 jam**. Jika pembayaran tidak diselesaikan, pesanan akan batal otomatis dan stok akan dilepaskan kembali ke toko.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-stone-800 hover:bg-stone-700 h-12 text-base"
              onClick={handleSnapPayment}
              disabled={!isSnapReady || paymentProcessing}
            >
              {paymentProcessing ? <Loader2 className="animate-spin mr-2" /> : null}
              {!isSnapReady ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Memuat Layanan...
                </>
              ) : paymentProcessing ? (
                "Memproses..."
              ) : (
                "Bayar Sekarang"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
