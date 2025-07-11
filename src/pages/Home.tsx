import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      const snapshot = await getDocs(collection(db, "products"));
      const data = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...(doc.data() as Omit<Product, "id">),
          } as Product)
      );
      setProducts(data);

      const uniqueCategories = Array.from(new Set(data.map((p) => p.category)));
      setCategories(uniqueCategories);
    };

    fetchProducts();
  }, []);

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Produk Tersedia</h1>

      {/* Filter Kategori */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-4 py-1 border rounded-full ${
            selectedCategory === "all"
              ? "bg-green-500 text-white"
              : "bg-white text-gray-800"
          }`}
        >
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1 border rounded-full ${
              selectedCategory === cat
                ? "bg-green-500 text-white"
                : "bg-white text-gray-800"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Produk */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition">
            <CardContent className="p-4 space-y-3">
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-contain rounded bg-white"
                />
              )}
              <h2 className="text-xl font-semibold">{product.name}</h2>
              <p className="text-sm text-gray-500">{product.category}</p>
              <p className="text-lg font-bold text-green-600">
                Rp {product.price.toLocaleString()}
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                Lihat Detail
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
