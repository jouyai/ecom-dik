import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth"
import { useCart } from "@/context/cartStore"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore"
import { useNavigate } from "react-router-dom"

interface Product {
  id: string
  name: string
  price: number
  quantity: number
}

interface ShippingInfo {
  name: string
  phone: string
  address: string
  city: string
  postalCode: string
}

export default function OrderSummary() {
  const { user } = useAuth()
  const { toggleRefresh } = useCart()
  const navigate = useNavigate()

  const [cart, setCart] = useState<Product[]>([])
  const [shipping, setShipping] = useState<ShippingInfo | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.title = "Furniture | Order Summary"
    
    const fetchCartAndShipping = async () => {
      if (!user) return

      const cartSnap = await getDocs(collection(db, "cart", user.email!, "items"))
      const cartItems = cartSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Product[]
      setCart(cartItems)

      const shippingSnap = await getDocs(
        query(collection(db, "shippings"), where("user", "==", user.email))
      )
      const shippingData = shippingSnap.docs
        .sort((a, b) => b.data().createdAt?.seconds - a.data().createdAt?.seconds)[0]
        ?.data() as ShippingInfo | undefined

      if (shippingData) {
        setShipping(shippingData)
      }
    }

    fetchCartAndShipping()
  }, [user])

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleConfirmPayment = async () => {
    if (!user) return toast.error("Kamu harus login")

    try {
      setLoading(true)

      const cartSnap = await getDocs(collection(db, "cart", user.email!, "items"))
      const deletions = cartSnap.docs.map((docItem) =>
        deleteDoc(doc(db, "cart", user.email!, "items", docItem.id))
      )
      await Promise.all(deletions)

      toggleRefresh()
      toast.success("Pembayaran berhasil! 🎉")
      navigate("/success")
    } catch (err: any) {
      toast.error("Gagal konfirmasi: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <p className="text-center p-6">Silakan login</p>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Ringkasan Pembayaran</h1>

      {shipping && (
        <div className="mb-6 border p-4 rounded bg-gray-50">
          <h2 className="font-semibold mb-2">Alamat Pengiriman</h2>
          <p>{shipping.name}</p>
          <p>{shipping.phone}</p>
          <p>{shipping.address}</p>
          <p>{shipping.city}, {shipping.postalCode}</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        <h2 className="text-lg font-semibold">Rincian Pesanan</h2>
        <ul className="text-sm text-gray-700">
          {cart.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>{item.name} x {item.quantity}</span>
              <span>Rp {(item.price * item.quantity).toLocaleString()}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>Rp {total.toLocaleString()}</span>
        </div>
      </div>

      <Button className="w-full" onClick={handleConfirmPayment} disabled={loading}>
        {loading ? "Memproses..." : "Konfirmasi Pembayaran"}
      </Button>
    </div>
  )
}
