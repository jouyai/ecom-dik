import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { formatStatus } from "@/lib/midtrans-status";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, orderBy } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import useMidtransSnap from "@/hooks/useMidtransSnap";
import { Loader2, Clock, Trash2 } from "lucide-react";
import { isOrderExpired, getTimeRemaining, formatTimeRemaining, releaseStock } from "@/lib/stockUtils";

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
  expiresAt?: Timestamp;
  stockReserved?: boolean;
  snap_token?: string;
  snap_result?: {
    order_id: string;
    [key: string]: any;
  };
}

// Countdown component untuk deadline pembayaran
const CountdownTimer = ({ expiresAt, onExpired }: { expiresAt: Timestamp; onExpired: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(expiresAt));

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpired();
      return;
    }

    const timer = setInterval(() => {
      const remaining = getTimeRemaining(expiresAt);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        onExpired();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpired, timeLeft]);

  if (timeLeft <= 0) return null;

  const isUrgent = timeLeft < 3600; // Kurang dari 1 jam

  return (
    <div className="flex flex-col items-end animate-pulse">
      <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm ${isUrgent ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
        <Clock className="h-3.5 w-3.5" />
        <span>Selesaikan bayar: {formatTimeRemaining(timeLeft)}</span>
      </div>
      <p className="text-[10px] text-stone-400 mt-1 italic select-none">Stok akan dilepas jika waktu habis</p>
    </div>
  );
};

export default function PesananSaya() {
  const isSnapReady = useMidtransSnap();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [checkingStatus, setCheckingStatus] = useState<string | null>(null);
  const [payingOrder, setPayingOrder] = useState<string | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  useEffect(() => {
    document.title = "Furniture | Pesanan Saya";

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
        const userOrders = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            status: formatStatus(data.status)
          } as Order;
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

      // Map status ke lowercase untuk pengecekan environment
      const currentStatus = order.status.toLowerCase();

      if (currentStatus === 'gagal' || currentStatus === 'kadaluarsa') {
        toast.info("Membuat sesi pembayaran baru...");
        const newOrderId = `RETRY-${order.id.substring(0, 8)}-${Date.now()}`;
        const res = await fetch("https://jouyai-midtrans-api.hf.space/api/create-transaction", {
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
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, snap_token: tokenToUse, status: 'Menunggu Konfirmasi' } : o));
      }

      if (!tokenToUse) {
        throw new Error("Token pembayaran tidak ditemukan.");
      }

      window.snap.pay(tokenToUse, {
        onSuccess: async (result: any) => {
          const orderRef = doc(db, "orders", order.id);
          await updateDoc(orderRef, { status: "sudah dibayar", snap_result: result });
          toast.success("Pembayaran Berhasil!");
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Sudah Dibayar' } : o));
        },
        onPending: (_result: any) => {
          toast.info("Status Pembayaran Masih Menunggu Konfirmasi.");
        },
        onError: async (_result: any) => {
          const orderRef = doc(db, "orders", order.id);
          await updateDoc(orderRef, { status: "gagal" });
          toast.error("Pembayaran Gagal.");
          setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'Gagal' } : o));
        },
        onClose: async () => {
          toast.info("Jendela pembayaran ditutup.");
        }
      });

    } catch (error: any) {
      toast.error(`Gagal Memproses Pembayaran: ${error.message}`);
    } finally {
      setPayingOrder(null);
    }
  };

  const handleCheckStatus = async (order: Order) => {
    const midtransOrderId = order.snap_result?.order_id || order.id;

    setCheckingStatus(order.id);
    toast.info("Memeriksa status pembayaran...");
    try {
      const res = await fetch(`https://jouyai-midtrans-api.hf.space/api/check-status/${midtransOrderId}`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.status_message || "Gagal menghubungi server.");
      }

      const data = await res.json();
      const newStatusLabel = formatStatus(data.new_status);

      setOrders(prevOrders => prevOrders.map(o => o.id === order.id ? { ...o, status: newStatusLabel } : o));
      toast.success(`Status Pesanan Berhasil Diperbarui Menjadi: ${newStatusLabel}`);

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
      case 'Kadaluarsa':
        return 'bg-red-100 text-red-800';
      case 'Dibatalkan':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCancelOrder = async (order: Order) => {
    setCancellingOrder(order.id);
    try {
      if (order.stockReserved !== false) {
        await releaseStock(order.items);
      }
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, { status: "dibatalkan", stockReserved: false });
      setOrders(prev => prev.map(o =>
        o.id === order.id ? { ...o, status: 'Dibatalkan', stockReserved: false } : o
      ));
      toast.success("Pesanan berhasil dibatalkan.");
    } catch (error) {
      console.error("Error cancelling order:", error);
      toast.error("Gagal membatalkan pesanan.");
    } finally {
      setCancellingOrder(null);
    }
  };

  const handleOrderExpired = async (order: Order) => {
    if (order.stockReserved) {
      try {
        await releaseStock(order.items);
        const orderRef = doc(db, "orders", order.id);
        await updateDoc(orderRef, { status: "kadaluarsa", stockReserved: false });
        setOrders(prev => prev.map(o =>
          o.id === order.id ? { ...o, status: 'Kadaluarsa', stockReserved: false } : o
        ));
        toast.info(`Pesanan ${order.id.slice(0, 8)}... telah kadaluarsa. Stok dikembalikan.`);
      } catch (error) {
        console.error("Error handling expired order:", error);
      }
    } else {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, { status: "kadaluarsa" });
      setOrders(prev => prev.map(o =>
        o.id === order.id ? { ...o, status: 'Kadaluarsa' } : o
      ));
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
                    <p className="text-xs text-stone-400 font-mono">ORDER ID: {order.id}</p>
                    <p className="text-sm text-stone-500">{formatDate(order.createdAt)}</p>
                    {user?.role === 'admin' && (
                      <p className="text-sm font-medium text-stone-700 mt-1">Pembeli: {order.user}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusClass(order.status)} underline-offset-2`}>
                      {order.status}
                    </span>
                    {order.status === 'Menunggu Konfirmasi' && order.expiresAt && !isOrderExpired(order.expiresAt) && (
                      <CountdownTimer
                        expiresAt={order.expiresAt}
                        onExpired={() => handleOrderExpired(order)}
                      />
                    )}
                  </div>
                </div>

                <div className="border-t border-b border-stone-100 py-4 my-4 space-y-3">
                  {order.items.map(item => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <img src={item.image || 'https://placehold.co/64x64?text=Product'} alt={item.name} className="w-14 h-14 rounded-lg object-cover border border-stone-100" />
                      <div className="flex-1">
                        <p className="font-semibold text-stone-800">{item.name}</p>
                        <p className="text-xs text-stone-500">{item.quantity} x Rp {item.price.toLocaleString()}</p>
                      </div>
                      <p className="font-bold text-stone-800 text-sm">Rp {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center bg-stone-50 p-3 rounded-lg">
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-tight font-bold">Total Pembayaran</p>
                    <p className="font-black text-xl text-stone-900">Rp {order.total.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {user?.role !== 'admin' && (order.status === 'Menunggu Konfirmasi' || order.status === 'Gagal') && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setOrderToCancel(order)}
                          disabled={cancellingOrder === order.id}
                        >
                          {cancellingOrder === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
                          Batal
                        </Button>
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
                          className="bg-stone-800 hover:bg-stone-700 text-white"
                          onClick={() => handlePayment(order)}
                          disabled={!isSnapReady || payingOrder === order.id}
                        >
                          {payingOrder === order.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          {order.status === 'Gagal' ? 'Coba Bayar Lagi' : 'Bayar Sekarang'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL KONFIRMASI INTERAKTIF */}
      <ConfirmModal
        isOpen={!!orderToCancel}
        onClose={() => setOrderToCancel(null)}
        onConfirm={() => {
          if (orderToCancel) {
            handleCancelOrder(orderToCancel);
            setOrderToCancel(null);
          }
        }}
        title="Batalkan Pesanan?"
        description="Barang-barang dalam pesanan ini akan kembali tersedia untuk dibeli oleh orang lain. Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Batalkan"
        variant="destructive"
        isLoading={!!cancellingOrder}
      />
    </div>
  );
}
