import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

declare global {
  interface Window {
    snap: any;
  }
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string;
  user?: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: Timestamp;
  snap_token?: string;
}

export default function PesananSaya() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetching, setFetching] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setFetching(true);
      try {
        let q;
        if (user.role === "admin") {
          q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        } else {
          q = query(
            collection(db, "orders"),
            where("user", "==", user.email),
            orderBy("createdAt", "desc")
          );
        }

        const querySnapshot = await getDocs(q);
        const userOrders = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Order));
        
        setOrders(userOrders);
      } catch (error) {
        console.error("Error fetching orders: ", error);
        toast.error("Gagal memuat riwayat pesanan.");
      } finally {
        setFetching(false);
      }
    };

    if (!authLoading) {
        fetchOrders();
    }
  }, [user, authLoading]);
  
  const handleRetryPayment = (orderId: string, snapToken: string) => {
    if (!window.snap) {
        toast.error("Layanan pembayaran tidak tersedia saat ini.");
        return;
    }

    window.snap.pay(snapToken, {
        onSuccess: async (result: any) => {
            const orderRef = doc(db, "orders", orderId);
            await updateDoc(orderRef, {
                status: "sudah dibayar",
                snap_result: result,
            });
            toast.success("Pembayaran berhasil!");
            setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? {...o, status: 'sudah dibayar'} : o));
        },
        onPending: (_result: any) => {
            toast.info("Status pembayaran masih menunggu konfirmasi.");
        },
        onError: (_result: any) => {
            toast.error("Pembayaran gagal.");
        },
        onClose: () => {
            toast.info("Anda menutup jendela pembayaran.");
        }
    });
  };

  const handleCheckStatus = async (orderId: string) => {
    setCheckingStatus(orderId);
    toast.info("Memeriksa status pembayaran...");
    try {
        const res = await fetch(`https://midtrans-dika-production.up.railway.app/api/check-status/${orderId}`);
        
        if (!res.ok) {
            throw new Error("Gagal menghubungi server.");
        }

        const data = await res.json();
        const newStatus = data.new_status;

        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? {...o, status: newStatus} : o));
        toast.success(`Status pesanan berhasil diperbarui menjadi: ${newStatus.replace("_", " ")}`);

    } catch (error: any) {
        toast.error(`Gagal memeriksa status: ${error.message}`);
    } finally {
        setCheckingStatus(null);
    }
  };

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return "-";
    return timestamp.toDate().toLocaleDateString("id-ID", {
      day: "2-digit", month: "long", year: "numeric"
    });
  };

  if (authLoading || fetching) {
    return <div className="text-center py-10">Memuat pesanan...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {user?.role === "admin" ? "Semua Pesanan" : "Pesanan Saya"}
      </h1>
      {orders.length === 0 ? (
        <p>Belum ada riwayat pesanan.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">ORDER ID: {order.id}</p>
                    <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    {user?.role === 'admin' && (
                        <p className="text-sm text-gray-700 pt-1"><strong>Pembeli:</strong> {order.user}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                    order.status === 'sudah dibayar' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.status.replace("_", " ")}
                  </span>
                </div>
                
                <div className="border-t border-b py-4 my-4">
                  {order.items.map(item => (
                      <div key={item.id} className="flex items-center space-x-4 mb-2">
                          <img src={item.image || 'https://placehold.co/64x64/e2e8f0/e2e8f0'} alt={item.name} className="w-16 h-16 rounded-md object-cover"/>
                          <div>
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-sm text-gray-600">{item.quantity} x Rp {item.price.toLocaleString()}</p>
                          </div>
                      </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <div>
                      <p className="font-bold text-lg">Total: Rp {order.total.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* --- PENAMBAHAN TOMBOL BARU --- */}
                    {user?.role !== 'admin' && order.status === 'menunggu konfirmasi' && (
                        <>
                            <Button 
                                variant="outline" 
                                onClick={() => handleCheckStatus(order.id)}
                                disabled={checkingStatus === order.id}
                            >
                                {checkingStatus === order.id ? 'Memeriksa...' : 'Periksa Status'}
                            </Button>
                            {order.snap_token && (
                                <Button onClick={() => handleRetryPayment(order.id, order.snap_token!)}>
                                Lanjutkan Pembayaran
                                </Button>
                            )}
                        </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
