import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight } from "lucide-react";
import { Link as ScrollLink } from "react-scroll";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
  isPublished: boolean;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const allProductsData = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...(doc.data() as Omit<Product, "id">),
            } as Product)
        );

        const publishedProducts = allProductsData.filter(
          (p) => p.isPublished === true
        );

        setProducts(publishedProducts);

        const uniqueCategories = [
          "all",
          ...Array.from(new Set(publishedProducts.map((p) => p.category))),
        ];
        setCategories(uniqueCategories);

      } catch (error) {
        console.error("Gagal memuat produk:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);
// ar_bdrt
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const ProductSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="w-full h-64 bg-stone-200" />
      <Skeleton className="h-6 w-3/4 bg-stone-200" />
      <Skeleton className="h-4 w-1/2 bg-stone-200" />
      <Skeleton className="h-10 w-full bg-stone-200" />
    </div>
  );

  return (
    <div className="bg-stone-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-stone-800 mb-4">
          Ruang Sempurna, Gaya Anda
        </h1>
        <p className="max-w-2xl mx-auto text-stone-600 mb-8">
          Temukan koleksi furnitur pilihan yang dirancang untuk kenyamanan,
          keindahan, dan kehidupan Anda.
        </p>
        <ScrollLink
          to="products-section"
          smooth={true}
          duration={500}
          offset={-80}
          spy={true}
        >
          <Button 
            size="lg" 
            className="bg-stone-800 hover:bg-stone-700 text-white group cursor-pointer"
          >
            Lihat Koleksi <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </ScrollLink>
      </section>

      {/* Products Section */}
      <main id="products-section" className="container mx-auto px-4 py-12">
        {/* Filter Kategori */}
        <div className="mb-10 flex justify-center flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${
                selectedCategory === cat
                  ? "bg-stone-800 text-white shadow-md"
                  : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Grid Produk */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
          ) : (
            filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden border-stone-200 rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <CardContent className="p-0">
                  <div className="w-full h-64 bg-stone-100 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5 space-y-2">
                    <p className="text-xs text-stone-500 uppercase tracking-wider">{product.category}</p>
                    <h2 className="text-lg font-semibold text-stone-800 truncate">{product.name}</h2>
                    <p className="text-xl font-bold text-amber-700">
                      Rp {product.price.toLocaleString()}
                    </p>
                    <Button
                      variant="outline"
                      className="w-full !mt-4 border-stone-800 text-stone-800 hover:bg-stone-800 hover:text-white"
                    >
                      Lihat Detail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
}