import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export default function Shipping() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  useEffect(() => {
    document.title = "Furniture | Shipping";
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Kamu harus login untuk melanjutkan");

    const { name, phone, address, city, postalCode } = form;
    if (!name || !phone || !address || !city || !postalCode) {
      return toast.error("Lengkapi semua data pengiriman");
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "shippings"), {
        user: user.email,
        ...form,
        createdAt: serverTimestamp(),
      });

      toast.success("Alamat pengiriman disimpan!");
      navigate("/payment");
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen py-12">
        <div className="container mx-auto max-w-2xl px-4">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-stone-500 mb-8">
                <Link to="/checkout" className="hover:text-amber-700">Keranjang</Link>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="text-stone-800 font-medium">Pengiriman</span>
                <ChevronRight className="h-4 w-4 mx-1" />
                <span className="text-stone-500">Pembayaran</span>
            </div>

            <Card className="border-stone-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Informasi Pengiriman</CardTitle>
                    <CardDescription>
                        Lengkapi detail di bawah ini untuk tujuan pengiriman pesanan Anda.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-stone-700">Nama Penerima</label>
                            <Input id="name" name="name" placeholder="John Doe" value={form.name} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                             <label htmlFor="phone" className="text-sm font-medium text-stone-700">Nomor Telepon</label>
                            <Input id="phone" name="phone" placeholder="08123456789" value={form.phone} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                             <label htmlFor="address" className="text-sm font-medium text-stone-700">Alamat Lengkap</label>
                            <Input id="address" name="address" placeholder="Jl. Sudirman No. 123" value={form.address} onChange={handleChange} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="city" className="text-sm font-medium text-stone-700">Kota</label>
                                <Input id="city" name="city" placeholder="Jakarta" value={form.city} onChange={handleChange} />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="postalCode" className="text-sm font-medium text-stone-700">Kode Pos</label>
                                <Input id="postalCode" name="postalCode" placeholder="12345" value={form.postalCode} onChange={handleChange} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button className="w-full md:w-auto bg-stone-800 hover:bg-stone-700" type="submit" disabled={loading}>
                            {loading ? "Menyimpan..." : "Lanjut ke Pembayaran"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    </div>
  );
}
