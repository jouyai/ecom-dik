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
          {/* Kolom 1 */}
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
          {/* Kolom 2 */}
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
          {/* Deskripsi & Tombol */}
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

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "products"));
    const items = querySnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Product)
    );
    setProducts(items);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
      toast.error("Gagal menyimpan produk. Lihat konsol untuk detail.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Anda yakin ingin menghapus produk ini secara permanen?"))
      return;
    try {
      await deleteDoc(doc(db, "products", id));
      toast.success("Produk berhasil dihapus.");
      fetchProducts();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus produk.");
    }
  };

  const formInitialData = editingProduct
    ? { ...INITIAL_FORM_STATE, ...editingProduct }
    : INITIAL_FORM_STATE;

  return (
    <div className="max-w-7xl mx-auto mt-10 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Produk Furnitur</h1>
        {editingProduct && (
          <Button variant="secondary" onClick={handleCancelEdit}>
            Batal Edit
          </Button>
        )}
      </div>

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
  );
}
