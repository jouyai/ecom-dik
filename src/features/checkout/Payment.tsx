import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCart } from "@/context/cartStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ChevronRight, Loader2 } from "lucide-react";
import useMidtransSnap from "@/hooks/useMidtransSnap";

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

  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
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
      const orderId = `ORDER-${Date.now()}`;

      const res = await fetch(
        "https://midtrans-dika-production.up.railway.app/api/create-transaction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction_details: {
              order_id: orderId,
              gross_amount: total,
            },
            customer_details: {
              first_name: user.displayName || user.username || "Pelanggan",
              email: user.email,
            },
            callbacks: {
              finish: "https://ecom-dik.vercel.app/thanks",
            }
          }),
        }
      );

      const data = await res.json();
      if (!data.token) throw new Error("Gagal mendapatkan Snap token.");

      const snapToken = data.token;
      window.snap.pay(snapToken, {
        onSuccess: async (result: any) => {
          await addDoc(collection(db, "orders"), {
            user: user.email, items: cart, total, paymentMethod: "MIDTRANS", status: "sudah dibayar", createdAt: serverTimestamp(), snap_result: result,
          });
          await clearCart();
          toast.success("Pembayaran Berhasil! Anda akan diarahkan...");
          // HAPUS NAVIGATE: Biarkan Midtrans yang mengarahkan
        },
        onPending: async (result: any) => {
          await addDoc(collection(db, "orders"), {
            user: user.email, items: cart, total, paymentMethod: "MIDTRANS", status: "menunggu konfirmasi", createdAt: serverTimestamp(), snap_result: result, snap_token: snapToken,
          });
          await clearCart();
          toast.info("Pembayaran sedang diproses. Anda akan diarahkan...");
          // HAPUS NAVIGATE: Biarkan Midtrans yang mengarahkan
        },
        onError: (_result: any) => {
          toast.error("Pembayaran gagal atau dibatalkan.");
          setPaymentProcessing(false); // Hentikan loading jika error
        },
        onClose: () => {
          toast.info("Anda menutup jendela pembayaran.");
          setPaymentProcessing(false);
        },
      });
    } catch (err: any) {
      toast.error("Gagal memproses pembayaran: " + err.message);
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
                </CardContent>
                <CardFooter>
                    <Button className="w-full bg-stone-800 hover:bg-stone-700 h-12 text-base" onClick={handleSnapPayment} disabled={!isSnapReady || paymentProcessing}>
                        {paymentProcessing ? <Loader2 className="animate-spin mr-2" /> : null}
                        {paymentProcessing ? "Memproses..." : "Bayar Sekarang"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
  );
}
