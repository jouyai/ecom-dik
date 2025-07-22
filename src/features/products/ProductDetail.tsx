import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, limit, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth";
import { useCart } from "@/context/cartStore";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Minus, Plus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
}

// Skeleton component for loading state
const ProductDetailSkeleton = () => (
    <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-6 w-1/3 mb-8 bg-stone-200" />
        <div className="grid md:grid-cols-2 gap-12 items-start">
            <Skeleton className="w-full h-96 bg-stone-200 rounded-lg" />
            <div className="space-y-6">
                <Skeleton className="h-10 w-3/4 bg-stone-200" />
                <Skeleton className="h-6 w-1/4 bg-stone-200" />
                <Skeleton className="h-8 w-1/3 bg-stone-200" />
                <Skeleton className="h-24 w-full bg-stone-200" />
                <Skeleton className="h-12 w-full bg-stone-200" />
            </div>
        </div>
    </div>
);


export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toggleRefresh } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setQuantity(1); // Reset quantity on new product
      if (!id) return;

      try {
        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const fetchedProduct = { id: snap.id, ...snap.data() } as Product;
          setProduct(fetchedProduct);

          // Fetch related products
          const q = query(
            collection(db, "products"),
            where("category", "==", fetchedProduct.category),
            limit(5) // Fetch 5 to have 4 related items even if one is the current product
          );
          const relSnap = await getDocs(q);
          const relItems = relSnap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Product))
            .filter((p) => p.id !== fetchedProduct.id)
            .slice(0, 4); // Ensure only 4 items are shown

          setRelatedProducts(relItems);
        } else {
            setProduct(null);
        }
      } catch (error) {
          console.error("Failed to fetch product:", error);
          toast.error("Gagal memuat detail produk.");
      } finally {
          setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!user) return toast.error("Silakan login terlebih dahulu.");
    if (!product) return;
    
    try {
      const cartRef = doc(db, "cart", user.email!, "items", product.id);
      const existing = await getDoc(cartRef);
      const currentQty = existing.exists() ? existing.data().quantity || 0 : 0;

      await setDoc(cartRef, {
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: currentQty + quantity,
      }, { merge: true });

      toggleRefresh();
      toast.success(`${quantity} ${product.name} ditambahkan ke keranjang!`);
    } catch (err: any) {
      toast.error("Gagal menambahkan: " + err.message);
    }
  };

  if (loading) return <ProductDetailSkeleton />;
  if (!product)
    return (
      <div className="p-12 text-center text-red-500">
        <h2 className="text-2xl font-bold">Produk tidak ditemukan.</h2>
        <Button onClick={() => navigate('/')} className="mt-4">Kembali ke Beranda</Button>
      </div>
    );

  return (
    <div className="bg-stone-50 py-12">
      <div className="container mx-auto px-4">
        {/* Breadcrumbs */}
        <div className="flex items-center text-sm text-stone-500 mb-8">
            <Link to="/" className="hover:text-amber-700">Beranda</Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="capitalize hover:text-amber-700 cursor-pointer" onClick={() => navigate(`/?category=${product.category}`)}>{product.category}</span>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span className="text-stone-800 font-medium truncate">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Product Image */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-stone-200">
             <img
                src={product.image}
                alt={product.name}
                className="w-full h-auto max-h-[500px] object-contain rounded"
             />
          </div>
          
          {/* Product Info */}
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-stone-800">{product.name}</h1>
            <p className="text-3xl font-bold text-amber-700">
              Rp {product.price.toLocaleString()}
            </p>
            <div className="prose text-stone-600">
              <p>{product.description}</p>
            </div>
            
            <div className="flex items-center space-x-4 pt-4">
                <div className="flex items-center border border-stone-300 rounded-md">
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                        <Minus className="h-4 w-4"/>
                    </Button>
                    <span className="w-12 text-center font-semibold">{quantity}</span>
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q + 1)}>
                        <Plus className="h-4 w-4"/>
                    </Button>
                </div>
                <Button size="lg" className="w-full bg-stone-800 hover:bg-stone-700 text-white" onClick={handleAddToCart}>
                    Tambah ke Keranjang
                </Button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-stone-800 mb-8">Anda Mungkin Juga Suka</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((item) => (
                <Card
                  key={item.id}
                  className="group overflow-hidden border-stone-200 rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  <CardContent className="p-0">
                    <div className="w-full h-64 bg-stone-100 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 space-y-2">
                      <p className="text-xs text-stone-500 uppercase tracking-wider">{item.category}</p>
                      <h2 className="text-lg font-semibold text-stone-800 truncate">{item.name}</h2>
                      <p className="text-xl font-bold text-amber-700">
                        Rp {item.price.toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
