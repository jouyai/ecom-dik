import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth";
import { useCart } from "@/lib/cartStore";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export default function Checkout() {
  const { user } = useAuth();
  const [cart, setCart] = useState<Product[]>([]);
  const [loading] = useState(false);
  const { refresh, toggleRefresh } = useCart();
  const navigate = useNavigate();

  const handleProceedToShipping = () => {
    navigate("/shipping");
  };

  useEffect(() => {
    const fetchCart = async () => {
      if (!user) return;

      const snapshot = await getDocs(
        collection(db, "cart", user.email!, "items")
      );
      const items = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            quantity: doc.data().quantity || 1,
            ...doc.data(),
          } as Product)
      );
      setCart(items);
    };

    fetchCart();
  }, [user, refresh]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleRemove = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "cart", user.email!, "items", id));
      setCart(cart.filter((item) => item.id !== id));
      toggleRefresh();
      toast.success("Item dihapus dari keranjang.");
    } catch (err: any) {
      toast.error("Gagal menghapus: " + err.message);
    }
  };

  const handleQuantityChange = async (id: string, delta: number) => {
    if (!user) return;
    const itemIndex = cart.findIndex((item) => item.id === id);
    if (itemIndex === -1) return;

    const updatedItem = { ...cart[itemIndex] };
    updatedItem.quantity += delta;

    if (updatedItem.quantity < 1) return;

    try {
      await updateDoc(doc(db, "cart", user.email!, "items", id), {
        quantity: updatedItem.quantity,
      });
      const updatedCart = [...cart];
      updatedCart[itemIndex] = updatedItem;
      setCart(updatedCart);
      toggleRefresh();
    } catch (err: any) {
      toast.error("Gagal memperbarui jumlah: " + err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Proses pembayaran</h1>
      {cart.length === 0 ? (
        <p className="text-gray-500">Keranjang kamu kosong.</p>
      ) : (
        <>
          <ul className="space-y-4">
            {cart.map((item) => (
              <li
                key={item.id}
                className="flex flex-col md:flex-row items-center gap-4 border p-4 rounded"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full md:w-32 h-32 object-contain bg-white rounded"
                  />
                )}
                <div className="flex-1 w-full">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    Rp {item.price.toLocaleString()} x {item.quantity} = Rp{" "}
                    {(item.price * item.quantity).toLocaleString()}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(item.id, -1)}
                    >
                      -
                    </Button>
                    <span>{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuantityChange(item.id, 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => handleRemove(item.id)}
                >
                  Hapus
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex justify-between items-center border-t pt-4">
            <p className="font-bold text-lg">
              Total: Rp {total.toLocaleString()}
            </p>
            <Button onClick={handleProceedToShipping} disabled={loading}>
              {loading ? "Memproses..." : "Buat Pesanan"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
