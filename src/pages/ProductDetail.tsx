import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, collection, query, where, limit, getDocs } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth"
import { useCart } from "@/lib/cartStore"
import { toast } from "sonner"

interface Product {
  id: string
  name: string
  category: string
  price: number
  image: string
  description: string
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { toggleRefresh } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return
      const ref = doc(db, "products", id)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        const fetchedProduct = { id: snap.id, ...snap.data() } as Product
        setProduct(fetchedProduct)

        const q = query(
          collection(db, "products"),
          where("category", "==", fetchedProduct.category),
          limit(4)
        )
        const relSnap = await getDocs(q)
        const relItems = relSnap.docs
          .filter((doc) => doc.id !== fetchedProduct.id)
          .map((doc) => ({ id: doc.id, ...doc.data() } as Product))

        setRelatedProducts(relItems)
      }
      setLoading(false)
    }

    fetchProduct()
  }, [id])

  const handleAddToCart = async () => {
    if (!user) return toast.error("Silakan login terlebih dahulu.")
    try {
      const cartRef = doc(db, "cart", user.email!, "items", product!.id)
      const existing = await getDoc(cartRef)
      const currentQty = existing.exists() ? existing.data().quantity || 1 : 0

      await setDoc(cartRef, {
        name: product!.name,
        price: product!.price,
        image: product!.image,
        quantity: currentQty + 1,
      })

      toggleRefresh()
      toast.success("Produk ditambahkan ke keranjang!")
    } catch (err: any) {
      toast.error("Gagal menambahkan: " + err.message)
    }
  }

  if (loading) return <div className="p-6 text-center">Loading...</div>
  if (!product)
    return (
      <div className="p-6 text-center text-red-500">Produk tidak ditemukan.</div>
    )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-auto object-cover rounded"
        />
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">Kategori: {product.category}</p>
          <p className="text-lg text-green-600 font-semibold">
            Rp {product.price.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600 whitespace-pre-line">
            {product.description}
          </p>
          <Button className="w-full md:w-auto" onClick={handleAddToCart}>
            Tambah ke Keranjang
          </Button>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Produk Lainnya</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {relatedProducts.map((item) => (
              <div
                key={item.id}
                className="border rounded p-4 hover:shadow transition cursor-pointer"
                onClick={() => navigate(`/product/${item.id}`)}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-contain rounded bg-white"
                />
                <h3 className="text-lg font-semibold">{item.name}</h3>
                <p className="text-sm text-gray-500">{item.category}</p>
                <p className="text-green-600 font-bold">
                  Rp {item.price.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
