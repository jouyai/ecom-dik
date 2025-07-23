import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth";
import { useCart } from "@/context/cartStore";
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Minus, Plus, Trash2, ChevronRight } from "lucide-react";

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
  const { refresh, toggleRefresh } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Furniture | Checkout";
    
    const fetchCart = async () => {
      if (!user) {
        setCart([]);
        return;
      }
      try {
        const snapshot = await getDocs(
          collection(db, "cart", user.email!, "items")
        );
        const items = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Product)
        );
        setCart(items);
      } catch (error) {
        console.error("Gagal memuat keranjang:", error);
        toast.error("Gagal memuat keranjang.");
      }
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
    const newQuantity = updatedItem.quantity + delta;

    if (newQuantity < 1) return;

    try {
      await updateDoc(doc(db, "cart", user.email!, "items", id), {
        quantity: newQuantity,
      });
      const updatedCart = [...cart];
      updatedCart[itemIndex] = { ...updatedItem, quantity: newQuantity };
      setCart(updatedCart);
      toggleRefresh();
    } catch (err: any) {
      toast.error("Gagal memperbarui jumlah: " + err.message);
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-stone-500 mb-8">
            <span className="text-stone-800 font-medium">Keranjang</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-stone-500">Pengiriman</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-stone-500">Pembayaran</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Keranjang Belanja Anda</CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-stone-500">Keranjang Anda kosong.</p>
                    <Button onClick={() => navigate('/')} className="mt-4 bg-stone-800 hover:bg-stone-700">Mulai Belanja</Button>
                  </div>
                ) : (
                  <ul className="divide-y divide-stone-200">
                    {cart.map((item) => (
                      <li key={item.id} className="flex py-6 space-x-6">
                        <img
                          src={item.image || 'https://placehold.co/128x128/e2e8f0/e2e8f0'}
                          alt={item.name}
                          className="w-24 h-24 md:w-32 md:h-32 object-contain bg-white rounded-md border border-stone-200"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-semibold text-stone-800">{item.name}</h3>
                            <p className="text-sm text-stone-500 mt-1">
                              Rp {item.price.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center border border-stone-300 rounded-md">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, -1)}>
                                    <Minus className="h-4 w-4"/>
                                </Button>
                                <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(item.id, 1)}>
                                    <Plus className="h-4 w-4"/>
                                </Button>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemove(item.id)}>
                                <Trash2 className="h-5 w-5 text-stone-500 hover:text-red-600" />
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {cart.length > 0 && (
            <div className="lg:col-span-1">
              <Card className="border-stone-200 shadow-sm sticky top-28">
                <CardHeader>
                  <CardTitle>Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span>Rp {total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Pengiriman</span>
                    <span>Akan dihitung</span>
                  </div>
                  <div className="border-t border-stone-200 pt-4 flex justify-between font-bold text-stone-800 text-lg">
                    <span>Total</span>
                    <span>Rp {total.toLocaleString()}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => navigate("/shipping")} className="w-full bg-stone-800 hover:bg-stone-700">
                    Lanjut ke Pengiriman
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
