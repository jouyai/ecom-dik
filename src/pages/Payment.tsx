// src/pages/Payment.tsx
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
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useCart } from "@/lib/cartStore";

export default function Payment() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("COD");
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

  const handlePayment = async () => {
    if (!user || cart.length === 0) return toast.error("Keranjang kosong.");

    try {
      await addDoc(collection(db, "orders"), {
        user: user.email,
        items: cart,
        total,
        paymentMethod,
        createdAt: new Date(),
        status: "menunggu konfirmasi",
      });

      // Setelah berhasil buat order, kosongkan keranjang
      const itemPromises = cart.map((item) =>
        deleteDoc(doc(db, "cart", user.email!, "items", item.id))
      );
      await Promise.all(itemPromises);
      toggleRefresh();

      toast.success("Pesanan berhasil dibuat!");
      navigate("/thanks");
    } catch (err: any) {
      toast.error("Gagal membuat pesanan: " + err.message);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pilih Metode Pembayaran</h1>
      <div className="space-y-4 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="payment"
            value="COD"
            checked={paymentMethod === "COD"}
            onChange={() => setPaymentMethod("COD")}
          />
          Bayar di Tempat (COD)
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="payment"
            value="TRANSFER_BCA"
            checked={paymentMethod === "TRANSFER_BCA"}
            onChange={() => setPaymentMethod("TRANSFER_BCA")}
          />
          Transfer Bank (BCA)
        </label>
      </div>
      <p className="mb-4 font-bold">Total: Rp {total.toLocaleString()}</p>
      <Button className="w-full" onClick={handlePayment}>
        Konfirmasi Pembayaran
      </Button>
    </div>
  );
}
