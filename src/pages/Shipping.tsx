import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function Shipping() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return toast.error("Kamu harus login untuk melanjutkan")

    const { name, phone, address, city, postalCode } = form
    if (!name || !phone || !address || !city || !postalCode) {
      return toast.error("Lengkapi semua data pengiriman")
    }

    try {
      setLoading(true)
      await addDoc(collection(db, "shippings"), {
        user: user.email,
        ...form,
        createdAt: serverTimestamp(),
      })

      toast.success("Alamat pengiriman disimpan!")
      navigate("/payment")
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Informasi Pengiriman</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input name="name" placeholder="Nama Penerima" value={form.name} onChange={handleChange} />
        <Input name="phone" placeholder="Nomor Telepon" value={form.phone} onChange={handleChange} />
        <Input name="address" placeholder="Alamat Lengkap" value={form.address} onChange={handleChange} />
        <Input name="city" placeholder="Kota" value={form.city} onChange={handleChange} />
        <Input name="postalCode" placeholder="Kode Pos" value={form.postalCode} onChange={handleChange} />
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Menyimpan..." : "Buat Pesanan"}
        </Button>
      </form>
    </div>
  )
}
