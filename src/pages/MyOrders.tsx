import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore"
import { Card, CardContent } from "@/components/ui/card"

interface Order {
  id: string
  items: {
    name: string
    quantity: number
    price: number
    image?: string
  }[]
  total: number
  createdAt?: Timestamp
  status?: string
}

export default function MyOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return

      const q = query(
        collection(db, "orders"),
        where("user", "==", user.email),
        orderBy("createdAt", "desc")
      )

      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Order, "id">),
      }))
      setOrders(data)
    }

    fetchOrders()
  }, [user])

  const formatDate = (timestamp?: Timestamp) => {
    if (!timestamp) return "-"
    const date = timestamp.toDate()
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pesanan Saya</h1>

      {orders.length === 0 ? (
        <p className="text-gray-500">Belum ada pesanan.</p>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <p>ID: {order.id}</p>
                  <p>{formatDate(order.createdAt)}</p>
                </div>

                <span className="inline-block text-sm text-white bg-blue-600 px-2 py-0.5 rounded">
                  {order.status || "diproses"}
                </span>

                <ul className="space-y-2 mt-2">
                  {order.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-4">
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-contain bg-white rounded"
                        />
                      )}
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          x{item.quantity} @ Rp {item.price.toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <p className="text-right font-bold text-green-600 mt-2">
                  Total: Rp {order.total.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
