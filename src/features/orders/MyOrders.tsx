import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import useMidtransSnap from "@/hooks/useMidtransSnap";
import { Loader2 } from "lucide-react";

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
  snap_result?: {
    order_id: string;
    [key: string]: any;
  };
}

const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

export default function PesananSaya() {
  const isSnapReady = useMidtransSnap();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
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
          .map(doc => {
              const data = doc.data();
              return { 
                  id: doc.id, 
                  ...data,
                  status: formatStatus(data.status)
              } as Order
          });
        
        setOrders(userOrders);
      } catch (error) {
        console.error("Error fetching orders: ", error);
        toast.error("Gagal memuat riwayat pesanan.");
      }
    };

    if (!authLoading) {
        fetchOrders();
    }
  }, [user, authLoading]);
  
  const handlePayment = async (order: Order) => {
    if (!isSnapReady || !user) {
        toast.error("Layanan pembayaran sedang dimuat, coba lagi sesaat.");
        return;
    }
    setPayingOrder(order.id);

    try {
        let tokenToUse = order.snap_token;

        if (order.status === 'Gagal' || order.status === 'Expired') {
            toast.info("Membuat sesi pembayaran baru...");
            const newOrderId = `RETRY-${order.id.substring(0, 8)}-${Date.now()}`;
            const res = await fetch("https://midtrans-dika-production.up.railway.app/api/create-transaction", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: newOrderId,
                    gross_amount: order.total,
                    name: user.displayName || user.username || "Pelanggan",
                    email: user.email,
                }),
            });

            const data = await res.json();
            if (!data.token) throw new Error("Gagal mendapatkan token pembayaran baru.");
            
            tokenToUse = data.token;
            const orderRef = doc(db, "orders", order.id);
            await updateDoc(orderRef, { snap_token: tokenToUse, status: 'menunggu konfirmasi' });
            setOrders(prev => prev.map(o => o.id === order.id ? {...o, snap_token: tokenToUse, status: 'Menunggu Konfirmasi'} : o));
        }

        if (!tokenToUse) {
            throw new Error("Token pembayaran tidak ditemukan.");
        }

        window.snap.pay(tokenToUse, {
            onSuccess: async (result: any) => {
                const orderRef = doc(db, "orders", order.id);
                await updateDoc(orderRef, { status: "sudah dibayar", snap_result: result });
                toast.success("Pembayaran Berhasil!");
                setOrders(prev => prev.map(o => o.id === order.id ? {...o, status: 'Sudah Dibayar'} : o));
            },
            onPending: (_result: any) => {
                toast.info("Status Pembayaran Masih Menunggu Konfirmasi.");
            },
            onError: async (_result: any) => {
                const orderRef = doc(db, "orders", order.id);
                await updateDoc(orderRef, { status: "gagal" });
                toast.error("Pembayaran Gagal.");
                setOrders(prev => prev.map(o => o.id === order.id ? {...o, status: 'Gagal'} : o));
            },
            onClose: async () => {
                const orderRef = doc(db, "orders", order.id);
                const currentOrder = orders.find(o => o.id === order.id);
                if (currentOrder && currentOrder.status !== 'Sudah Dibayar') {
                    await updateDoc(orderRef, { status: "gagal" });
                    toast.info("Pembayaran Dibatalkan dan Ditandai Sebagai Gagal.");
                    setOrders(prev => prev.map(o => o.id === order.id ? {...o, status: 'Gagal'} : o));
                }
            }
        });

    } catch (error: any) {
        toast.error(`Gagal Memproses Pembayaran: ${error.message}`);
    } finally {
        setPayingOrder(null);
    }
  };

  const handleCheckStatus = async (order: Order) => {
    const midtransOrderId = order.snap_result?.order_id;

    if (!midtransOrderId) {
      toast.error("Tidak dapat menemukan ID transaksi Midtrans untuk pesanan ini.");
      return;
    }

    setCheckingStatus(order.id);
    toast.info("Memeriksa status pembayaran...");
    try {
        const res = await fetch(`https://midtrans-dika-production.up.railway.app/api/check-status/${midtransOrderId}`);
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.status_message || "Gagal menghubungi server.");
        }

        const data = await res.json();
        const newStatus = formatStatus(data.new_status);

        setOrders(prevOrders => prevOrders.map(o => o.id === order.id ? {...o, status: newStatus} : o));
        toast.success(`Status Pesanan Berhasil Diperbarui Menjadi: ${newStatus}`);

    } catch (error: any) {
        toast.error(`Gagal Memeriksa Status: ${error.message}`);
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

  const getStatusClass = (status: string) => {
    switch (status) {
        case 'Sudah Dibayar':
            return 'bg-green-100 text-green-800';
        case 'Menunggu Konfirmasi':
            return 'bg-yellow-100 text-yellow-800';
        case 'Gagal':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (authLoading) {
    return <div className="text-center py-10">Memuat sesi...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        {user?.role === "admin" ? "Semua Pesanan" : "Pesanan Saya"}
      </h1>
      {orders.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-stone-300 rounded-lg">
            <p className="text-stone-500">Anda belum memiliki riwayat pesanan.</p>
        </div>
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
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusClass(order.status)}`}>
                    {order.status}
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
                    {user?.role !== 'admin' && (order.status === 'Menunggu Konfirmasi' || order.status === 'Gagal') && (
                        <>
                            {order.status === 'Menunggu Konfirmasi' && 
                                <Button 
                                    variant="outline" 
                                    onClick={() => handleCheckStatus(order)}
                                    disabled={checkingStatus === order.id}
                                >
                                    {checkingStatus === order.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {checkingStatus === order.id ? 'Memeriksa...' : 'Periksa Status'}
                                </Button>
                            }
                            <Button 
                                onClick={() => handlePayment(order)}
                                disabled={!isSnapReady || payingOrder === order.id}
                            >
                                {payingOrder === order.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                {order.status === 'Gagal' ? 'Coba Bayar Lagi' : 'Lanjutkan Pembayaran'}
                            </Button>
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
