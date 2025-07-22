import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useCart } from "@/lib/cartStore";

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
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toggleRefresh } = useCart();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute(
      "data-client-key",
      import.meta.env.VITE_MIDTRANS_CLIENT_KEY
    );
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchCart = async () => {
      if (!user) return;
      const snapshot = await getDocs(
        collection(db, "cart", user.email!, "items")
      );
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        quantity: doc.data().quantity || 1,
        name: doc.data().name,
        price: doc.data().price,
        image: doc.data().image,
      }));
      setCart(items);

      const totalPrice = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      setTotal(totalPrice);
    };

    fetchCart();
  }, [user]);

  const handleSnapPayment = async () => {
    if (!user || cart.length === 0) {
      return toast.error("Keranjang kosong.");
    }

    try {
      const orderId = `ORDER-${Date.now()}`;

      const res = await fetch(
        "https://midtrans-dika-production.up.railway.app/api/create-transaction",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order_id: orderId,
            gross_amount: total,
            name: user.displayName || "Pelanggan",
            email: user.email,
            callback_urls: {
              finish: "https://ecom-dik.vercel.app/thanks",
            },
          }),
        }
      );

      const data = await res.json();
      if (!data.token) throw new Error("Gagal mendapatkan Snap token.");

      window.snap.pay(data.token, {
        onSuccess: async (result: any) => {
          await addDoc(collection(db, "orders"), {
            user: user.email,
            items: cart,
            total,
            paymentMethod: "MIDTRANS",
            status: "sudah dibayar",
            createdAt: serverTimestamp(),
            snap_result: result,
          });

          await clearCart();
          toast.success("Pembayaran berhasil!");
          navigate(
            `/thanks?order_id=${result.order_id}&status_code=${result.status_code}&transaction_status=${result.transaction_status}`
          );
        },
        onPending: async (result: any) => {
          await addDoc(collection(db, "orders"), {
            user: user.email,
            items: cart,
            total,
            paymentMethod: "MIDTRANS",
            status: "menunggu konfirmasi",
            createdAt: serverTimestamp(),
            snap_result: result,
          });

          await clearCart();
          toast("Pembayaran sedang diproses...");
          navigate(
            `/thanks?order_id=${result.order_id}&status_code=${result.status_code}&transaction_status=${result.transaction_status}`
          );
        },
        onError: (result: any) => {
          toast.error("Pembayaran gagal atau dibatalkan.");
          navigate(
            `/thanks?order_id=${result.order_id}&status_code=${result.status_code}&transaction_status=deny`
          );
        },
        onClose: () => {
          toast.info("Anda menutup jendela pembayaran.");
        },
      });
    } catch (err: any) {
      toast.error("Gagal memproses pembayaran: " + err.message);
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
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Konfirmasi Pembayaran</h1>
      <p className="mb-4 font-bold">Total: Rp {total.toLocaleString()}</p>
      <Button className="w-full" onClick={handleSnapPayment}>
        Bayar Sekarang
      </Button>
    </div>
  );
}
