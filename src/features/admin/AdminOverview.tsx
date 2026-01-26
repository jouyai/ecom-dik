import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, ShoppingBag, CreditCard, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// --- INTERFACE DISAMAKAN DENGAN MyOrders.tsx ---
interface Order {
  id: string;
  total: number; // Field yang benar adalah 'total', bukan 'totalAmount'
  status: string;
  createdAt: Timestamp;
  user?: string;
  items: any[];
}

// Helper untuk format status (sama seperti di MyOrders)
const formatStatus = (status: string) => {
  if (!status) return "-";
  return status.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

// Helper warna badge status
const getStatusColor = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes('sudah dibayar') || s.includes('settlement') || s.includes('capture')) return "bg-green-100 text-green-800 hover:bg-green-100";
  if (s.includes('gagal') || s.includes('deny') || s.includes('cancel')) return "bg-red-100 text-red-800 hover:bg-red-100";
  return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
}

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Query yang sama dengan MyOrders (untuk Admin)
        const ordersRef = collection(db, "orders");
        const q = query(ordersRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        // Mapping data
        const orders = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Pastikan ambil field 'total'
            total: typeof data.total === 'number' ? data.total : 0,
            status: formatStatus(data.status || "")
          } as Order;
        });

        // Hitung Statistik
        const totalRevenue = orders.reduce((acc, curr) => acc + curr.total, 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        setStats({ totalRevenue, totalOrders, avgOrderValue });

        // Ambil 5 transaksi terakhir untuk list
        setRecentOrders(orders.slice(0, 5));

        // Siapkan Data Grafik (Group by Date)
        const groupedData: Record<string, number> = {};

        // Kita reverse dulu biar grafik urut dari tanggal lama ke baru
        [...orders].reverse().forEach(order => {
          if (order.createdAt?.seconds) {
            const date = new Date(order.createdAt.seconds * 1000).toLocaleDateString("id-ID", {
              day: "numeric", month: "short"
            });
            groupedData[date] = (groupedData[date] || 0) + order.total;
          }
        });

        const chartArray = Object.keys(groupedData).map(date => ({
          name: date,
          total: groupedData[date]
        }));

        setChartData(chartArray);

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Memuat data analisis...</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Kartu Statistik */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Akumulasi semua pesanan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Transaksi berhasil</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">Per keranjang belanja</p>
          </CardContent>
        </Card>
      </div>

      {/* Grafik & Recent Orders */}
      <div className="grid gap-4 md:grid-cols-7">

        {/* Grafik Penjualan */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Overview Penjualan</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] w-full" style={{ minWidth: 0, minHeight: 300 }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300} minWidth={0}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `Rp ${(value || 0) / 1000}k`}
                    />
                    <Tooltip
                      formatter={(value: number | undefined) => [formatCurrency(value || 0), "Total"]}
                      cursor={{ fill: "transparent" }}
                      contentStyle={{ borderRadius: "8px" }}
                    />
                    <Bar dataKey="total" fill="#18181b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Belum ada data penjualan.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Transaksi Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada transaksi.</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="h-9 w-9 rounded-full bg-stone-100 flex-shrink-0 flex items-center justify-center border">
                        <CreditCard className="h-4 w-4 text-stone-600" />
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        <p className="text-sm font-medium leading-none truncate w-[120px]">
                          {order.user || "Guest"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.createdAt ?
                            new Date(order.createdAt.seconds * 1000).toLocaleDateString("id-ID")
                            : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-sm">
                        +{formatCurrency(order.total)}
                      </span>
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(order.status)}`}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}