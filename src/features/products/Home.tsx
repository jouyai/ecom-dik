import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Award, Truck, Headset, Star } from "lucide-react";
import { Link as ScrollLink } from "react-scroll"; 

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  description: string;
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Furniture | Home";

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, "products"));
        const data = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...(doc.data() as Omit<Product, "id">),
            } as Product)
        );
        setProducts(data);

        const uniqueCategories = [
          "all",
          ...Array.from(new Set(data.map((p) => p.category))),
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

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const ProductSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="w-full h-52 bg-stone-200" />
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
                  <div className="w-full h-52 bg-stone-100 overflow-hidden">
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

      {/* Why Choose Us Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-stone-800 mb-4">Kenapa Memilih Kami?</h2>
            <p className="max-w-2xl mx-auto text-stone-600 mb-12">
                Kami berkomitmen untuk memberikan yang terbaik bagi setiap sudut rumah Anda.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="flex flex-col items-center">
                    <div className="bg-amber-100 p-4 rounded-full mb-4">
                        <Award className="h-8 w-8 text-amber-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-stone-800">Kualitas Terbaik</h3>
                    <p className="text-stone-600 mt-2">Setiap produk dibuat dengan material pilihan dan pengerjaan yang teliti.</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="bg-amber-100 p-4 rounded-full mb-4">
                        <Truck className="h-8 w-8 text-amber-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-stone-800">Pengiriman Cepat</h3>
                    <p className="text-stone-600 mt-2">Pesanan Anda kami antar dengan aman dan tepat waktu ke seluruh Indonesia.</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="bg-amber-100 p-4 rounded-full mb-4">
                        <Headset className="h-8 w-8 text-amber-700" />
                    </div>
                    <h3 className="text-lg font-semibold text-stone-800">Layanan Pelanggan</h3>
                    <p className="text-stone-600 mt-2">Tim kami siap membantu Anda 24/7 untuk menjawab setiap pertanyaan.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-stone-50 py-20">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-stone-800 mb-4">Apa Kata Mereka?</h2>
            <p className="max-w-2xl mx-auto text-stone-600 mb-12">
                Cerita dari para pelanggan yang telah mempercayakan kami untuk mengisi rumah mereka.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-white text-left p-6 border-stone-200 shadow-sm">
                    <CardContent className="p-0">
                        <div className="flex text-amber-500 mb-4">
                            <Star fill="currentColor" />
                            <Star fill="currentColor" />
                            <Star fill="currentColor" />
                            <Star fill="currentColor" />
                            <Star fill="currentColor" />
                        </div>
                        <p className="text-stone-600 italic">"Sofa yang saya beli sangat nyaman dan mengubah total suasana ruang keluarga. Kualitasnya melebihi ekspektasi!"</p>
                        <div className="flex items-center mt-6">
                            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Pelanggan 1" className="w-12 h-12 rounded-full mr-4" />
                            <div>
                                <p className="font-semibold text-stone-800">Sarah Wijayanti</p>
                                <p className="text-sm text-stone-500">Pemilik Rumah, Jakarta</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white text-left p-6 border-stone-200 shadow-sm">
                    <CardContent className="p-0">
                        <div className="flex text-amber-500 mb-4">
                            <Star fill="currentColor" />
                            <Star fill="currentColor" />
                            <Star fill="currentColor" />
                            <Star fill="currentColor" />
                            <Star fill="currentColor" />
                        </div>
                        <p className="text-stone-600 italic">"Proses pembelian sangat mudah dan pengirimannya cepat. Meja makannya pas sekali untuk dapur saya. Terima kasih!"</p>
                        <div className="flex items-center mt-6">
                            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704e" alt="Pelanggan 2" className="w-12 h-12 rounded-full mr-4" />
                            <div>
                                <p className="font-semibold text-stone-800">Budi Santoso</p>
                                <p className="text-sm text-stone-500">Desainer Interior</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white text-left p-6 border-stone-200 shadow-sm">
                    <CardContent className="p-0">
                        <div className="flex text-amber-500 mb-4">
                            <Star fill="currentColor" />
                            <Star fill="currentColor" />
                            <Star fill="currentColor" />
                            <Star fill="currentColor" />
                            <Star fill="currentColor" />
                        </div>
                        <p className="text-stone-600 italic">"Layanan pelanggannya sangat responsif. Mereka membantu saya memilih lemari yang tepat. Sangat direkomendasikan."</p>
                        <div className="flex items-center mt-6">
                            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704f" alt="Pelanggan 3" className="w-12 h-12 rounded-full mr-4" />
                            <div>
                                <p className="font-semibold text-stone-800">Rina Hartono</p>
                                <p className="text-sm text-stone-500">Pengusaha Kafe, Bandung</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>
    </div>
  );
}
