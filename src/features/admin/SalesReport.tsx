import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, Calendar } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

interface Order {
    id: string;
    total: number;
    status: string;
    createdAt: Timestamp;
    user?: string;
    items: OrderItem[];
}

const formatStatus = (status: string) => {
    if (!status) return "-";
    return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("sudah dibayar") || s.includes("settlement") || s.includes("capture"))
        return "bg-green-100 text-green-800";
    if (s.includes("gagal") || s.includes("deny") || s.includes("cancel") || s.includes("kadaluarsa"))
        return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
};

export default function SalesReport() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const ordersRef = collection(db, "orders");
                const q = query(ordersRef, orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);

                const orderData = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        total: typeof data.total === "number" ? data.total : 0,
                        status: formatStatus(data.status || ""),
                    } as Order;
                });

                setOrders(orderData);
                setFilteredOrders(orderData);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    // Filter orders berdasarkan rentang tanggal
    useEffect(() => {
        if (!startDate && !endDate) {
            setFilteredOrders(orders);
            return;
        }

        const filtered = orders.filter((order) => {
            if (!order.createdAt?.seconds) return false;
            const orderDate = new Date(order.createdAt.seconds * 1000);
            orderDate.setHours(0, 0, 0, 0);

            if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                if (orderDate < start) return false;
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (orderDate > end) return false;
            }

            return true;
        });

        setFilteredOrders(filtered);
    }, [startDate, endDate, orders]);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(val);

    const formatDate = (timestamp: Timestamp) => {
        if (!timestamp?.seconds) return "-";
        return new Date(timestamp.seconds * 1000).toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    const handlePrint = () => {
        window.print();
    };

    // Calculate totals
    const totalRevenue = filteredOrders.reduce((acc, curr) => acc + curr.total, 0);
    const totalOrders = filteredOrders.length;

    if (loading) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Memuat data laporan...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Filter Controls - Hidden when printing */}
            <Card className="print:hidden">
                <CardHeader>
                    <CardTitle className="text-lg">Filter Laporan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Dari Tanggal</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="pl-10 w-[180px]"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">Sampai Tanggal</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-10 w-[180px]"
                                />
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setStartDate("");
                                setEndDate("");
                            }}
                        >
                            Reset Filter
                        </Button>
                        <div className="flex-1" />
                        <Button onClick={handlePrint} className="gap-2">
                            <Printer className="h-4 w-4" />
                            Cetak Laporan
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Print Header - Only visible when printing */}
            <div className="hidden print:block mb-8">
                <h1 className="text-2xl font-bold text-center">Laporan Penjualan</h1>
                <p className="text-center text-gray-600">Furniture.go</p>
                <p className="text-center text-sm text-gray-500 mt-2">
                    {startDate || endDate
                        ? `Periode: ${startDate || "Awal"} - ${endDate || "Sekarang"}`
                        : `Per tanggal: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(totalRevenue)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Table */}
            <Card ref={printRef}>
                <CardHeader className="print:pb-2">
                    <CardTitle>Detail Transaksi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">No</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Pembeli</TableHead>
                                    <TableHead>Produk</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            Tidak ada data untuk ditampilkan
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredOrders.map((order, index) => (
                                        <TableRow key={order.id}>
                                            <TableCell>{index + 1}</TableCell>
                                            <TableCell>{formatDate(order.createdAt)}</TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {order.id.slice(0, 12)}...
                                            </TableCell>
                                            <TableCell>{order.user || "-"}</TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px]">
                                                    {order.items?.map((item, i) => (
                                                        <div key={i} className="text-xs truncate">
                                                            {item.quantity}x {item.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatCurrency(order.total)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-xs ${getStatusColor(order.status)} print:border print:border-gray-300`}
                                                >
                                                    {order.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Total Row */}
                    {filteredOrders.length > 0 && (
                        <div className="mt-4 pt-4 border-t flex justify-end">
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Total Keseluruhan</p>
                                <p className="text-xl font-bold text-green-600">
                                    {formatCurrency(totalRevenue)}
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Print Footer */}
            <div className="hidden print:block mt-8 pt-4 border-t text-center text-xs text-gray-500">
                <p>Dicetak pada: {new Date().toLocaleString("id-ID")}</p>
                <p>© {new Date().getFullYear()} Furniture.go - Laporan ini dibuat secara otomatis</p>
            </div>
        </div>
    );
}
