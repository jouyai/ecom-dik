import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCart } from "@/lib/cartStore";

export default function Payment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const { toggleRefresh } = useCart();

  interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }

  // Load Midtrans Snap script
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

  // Ambil data keranjang dari Firestore
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
    if (!user || cart.length === 0) return toast.error("Keranjang kosong.");

    try {
      const orderId = `ORDER-${Date.now()}`;
      const res = await fetch(
        "https://midtrans-dika-production.up.railway.app/api/create-transaction",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            order_id: orderId,
            gross_amount: total,
            name: user.displayName || "Pelanggan",
            email: user.email,
            callback_urls: {
              finish: "http://ecom-dik.vercel.app/thanks",
              pending: "http://ecom-dik.vercel.app/pending",
              error: "http://ecom-dik.vercel.app/error",
            },
          }),
        }
      );

      const data = await res.json();

      if (!data.token) throw new Error("Gagal mendapatkan Snap token.");

      window.snap.pay(data.token, {
        onSuccess: async (result) => {
          // Tidak langsung simpan order di sini, karena pakai halaman redirect
          await addDoc(collection(db, "orders"), {
            user: user.email,
            items: cart,
            total,
            paymentMethod: "MIDTRANS",
            status: "sudah dibayar",
            createdAt: new Date(),
            snap_result: result,
          });

          const itemPromises = cart.map((item) =>
            deleteDoc(doc(db, "cart", user.email!, "items", item.id))
          );
          await Promise.all(itemPromises);
          toggleRefresh();

          toast.success("Pembayaran berhasil!");
          navigate("/thanks");
        },
        onPending: async (result) => {
          await addDoc(collection(db, "orders"), {
            user: user.email,
            items: cart,
            total,
            paymentMethod: "MIDTRANS",
            status: "menunggu konfirmasi",
            createdAt: new Date(),
            snap_result: result,
          });

          const itemPromises = cart.map((item) =>
            deleteDoc(doc(db, "cart", user.email!, "items", item.id))
          );
          await Promise.all(itemPromises);
          toggleRefresh();
          toast("Pembayaran masih diproses...");
          navigate("/pending");
        },
        onError: (result) => {
          toast.error("Pembayaran gagal.");
          navigate("/error");
        },
        onClose: () => {
          toast("Kamu menutup popup pembayaran.");
        },
      });
    } catch (err: any) {
      toast.error("Gagal memproses pembayaran: " + err.message);
    }
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
