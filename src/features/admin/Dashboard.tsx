import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import AdminOverview from "./AdminOverview"; // <--- IMPORT KOMPONEN BARU
import { LayoutDashboard, Package } from "lucide-react"; // Icon tambahan

// ... (Interface Product & INITIAL_FORM_STATE tetap sama, JANGAN DIHAPUS) ...
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  isPublished: boolean;
  createdAt?: Timestamp;
}

type ProductFormState = Omit<Product, "id" | "createdAt">;

const INITIAL_FORM_STATE: ProductFormState = {
  name: "",
  category: "",
  price: 0,
  description: "",
  imageUrl: "",
  isPublished: true,
};

// ... (Component ProductForm tetap sama, JANGAN DIHAPUS) ...
const ProductForm = ({
  onSubmit,
  initialData,
  isEditing,
  isLoading,
}: {
  onSubmit: (data: ProductFormState) => void;
  initialData: ProductFormState;
  isEditing: boolean;
  isLoading: boolean;
}) => {
    // ... (Isi ProductForm tetap sama) ...
    const [form, setForm] = useState(initialData);
  
    useEffect(() => {
      setForm(initialData);
    }, [initialData]);
  
    const handleChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value, type } = e.target;
      const isCheckbox = type === "checkbox";
      setForm((prev) => ({
        ...prev,
        [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
      }));
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const numericForm = {
        ...form,
        price: Number(form.price) || 0,
      };
      onSubmit(numericForm);
    };
  
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            {isEditing ? "Edit Produk Furnitur" : "Tambah Produk Baru"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <Input
                name="name"
                placeholder="Nama Produk (e.g., Meja Makan Kayu Jati)"
                value={form.name}
                onChange={handleChange}
                required
              />
              <Input
                name="category"
                placeholder="Kategori (e.g., Meja, Kursi, Lemari)"
                value={form.category}
                onChange={handleChange}
                required
              />
              <Input
                name="price"
                placeholder="Harga"
                type="number"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  name="imageUrl"
                  placeholder="URL Gambar Produk"
                  value={form.imageUrl}
                  onChange={handleChange}
                  className="flex-grow"
                />
                {form.imageUrl && (
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    className="w-12 h-12 object-cover rounded-md"
                  />
                )}
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="isPublished"
                  name="isPublished"
                  checked={form.isPublished}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({ ...prev, isPublished: checked }))
                  }
                />
                <Label htmlFor="isPublished">Publikasikan Produk</Label>
              </div>
            </div>
            <div className="md:col-span-2">
              <Textarea
                name="description"
                placeholder="Deskripsi lengkap produk..."
                value={form.description}
                onChange={handleChange}
                rows={4}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading
                  ? "Menyimpan..."
                  : isEditing
                  ? "Update Produk"
                  : "Tambah Produk"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
};

// ... (Component ProductTable tetap sama, JANGAN DIHAPUS) ...
const ProductTable = ({
    products,
    onEdit,
    onDelete,
  }: {
    products: Product[];
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Produk</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gambar</TableHead>
                <TableHead>Nama Produk</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.imageUrl && (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded-md"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.category}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    }).format(p.price)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isPublished ? "default" : "secondary"}>
                      {p.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEdit(p)}>
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(p.id)}
                    >
                      Hapus
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

// --- KOMPONEN UTAMA DASHBOARD DIPERBARUI ---
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "products">("overview"); // State untuk Tab
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Admin Dashboard | E-Com Dika";
    if (activeTab === "products") {
        fetchProducts();
    }
  }, [activeTab]);

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    const items = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Product)
    );
    setProducts(items);
  };

  const handleFormSubmit = async (data: ProductFormState) => {
    setIsLoading(true);
    try {
      if (editingProduct) {
        const productRef = doc(db, "products", editingProduct.id);
        await updateDoc(productRef, data);
        toast.success("Produk berhasil diupdate!");
      } else {
        await addDoc(collection(db, "products"), {
          ...data,
          createdAt: serverTimestamp(),
        });
        toast.success("Produk berhasil ditambahkan!");
      }
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan produk.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus permanen?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("Produk dihapus.");
      fetchProducts();
    } catch (err) {
      toast.error("Gagal menghapus.");
    }
  };

  const formInitialData = editingProduct
    ? { ...INITIAL_FORM_STATE, ...editingProduct }
    : INITIAL_FORM_STATE;

  return (
    <div className="max-w-7xl mx-auto mt-8 px-4 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
                Kelola penjualan dan katalog produk toko Anda.
            </p>
        </div>
        
        {/* Tombol Navigasi Tab */}
        <div className="flex bg-stone-100 p-1 rounded-lg">
            <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === "overview" 
                    ? "bg-white text-stone-900 shadow-sm" 
                    : "text-stone-500 hover:text-stone-900"
                }`}
            >
                <LayoutDashboard className="w-4 h-4" />
                Overview
            </button>
            <button
                onClick={() => setActiveTab("products")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === "products" 
                    ? "bg-white text-stone-900 shadow-sm" 
                    : "text-stone-500 hover:text-stone-900"
                }`}
            >
                <Package className="w-4 h-4" />
                Produk
            </button>
        </div>
      </div>

      {/* Konten Berdasarkan Tab */}
      {activeTab === "overview" ? (
        <AdminOverview />
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4">
            {editingProduct && (
                <div className="mb-4 flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <span className="text-blue-800 font-medium">Mode Edit: {editingProduct.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => setEditingProduct(null)}>
                        Batal Edit
                    </Button>
                </div>
            )}
            
            <ProductForm
                onSubmit={handleFormSubmit}
                initialData={formInitialData}
                isEditing={!!editingProduct}
                isLoading={isLoading}
            />

            <ProductTable
                products={products}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
      )}
    </div>
  );
}