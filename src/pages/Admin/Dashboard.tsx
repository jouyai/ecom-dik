import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function AdminDashboard() {
  const [products, setProducts] = useState<any[]>([])
  const [form, setForm] = useState({ name: "", category: "", price: "", description: "", image: "" })
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchProducts = async () => {
    const querySnapshot = await getDocs(collection(db, "products"))
    const items = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    setProducts(items)
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // ✅ Validasi input
    const { name, category, price, description, image } = form
    if (!name || !category || !price || isNaN(Number(price))) {
      toast.error("Nama, kategori, dan harga harus diisi dengan benar.")
      return
    }

    const priceValue = parseFloat(price)

    try {
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), {
          name,
          category,
          price: priceValue,
          description,
          image,
        })
        toast.success("Produk berhasil diupdate!")
      } else {
        await addDoc(collection(db, "products"), {
          name,
          category,
          price: priceValue,
          description,
          image,
        })
        toast.success("Produk berhasil ditambahkan!")
      }

      setForm({ name: "", category: "", price: "", description: "", image: "" })
      setEditingId(null)
      fetchProducts()
    } catch (err) {
      console.error(err)
      toast.error("Gagal menyimpan produk.")
    }
  }

  const handleEdit = (product: any) => {
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      description: product.description,
      image: product.image,
    })
    setEditingId(product.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus produk ini?")) return
    await deleteDoc(doc(db, "products", id))
    toast.success("Produk dihapus.")
    fetchProducts()
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 p-4">
      <h1 className="text-3xl font-bold mb-4">Dashboard Admin - Produk</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input
          placeholder="Nama Produk"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          placeholder="Kategori"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        />
        <Input
          placeholder="Harga"
          type="number"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <Input
          placeholder="Gambar (URL)"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
        />
        <Input
          placeholder="Deskripsi"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <Button type="submit" className="col-span-full">
          {editingId ? "Update Produk" : "Tambah Produk"}
        </Button>
      </form>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Nama</th>
              <th className="p-2 border">Kategori</th>
              <th className="p-2 border">Harga</th>
              <th className="p-2 border">Deskripsi</th>
              <th className="p-2 border">Gambar</th>
              <th className="p-2 border">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="border p-2">{p.name}</td>
                <td className="border p-2">{p.category}</td>
                <td className="border p-2">Rp {Number(p.price).toLocaleString()}</td>
                <td className="border p-2">{p.description}</td>
                <td className="border p-2">
                  {p.image && <img src={p.image} alt={p.name} className="w-12 h-12 object-cover" />}
                </td>
                <td className="border p-2 flex gap-2">
                  <Button variant="outline" onClick={() => handleEdit(p)}>Edit</Button>
                  <Button variant="destructive" onClick={() => handleDelete(p.id)}>Hapus</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
