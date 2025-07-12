import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useCart } from "@/lib/cartStore";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { refresh, count, setCount } = useCart();

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!user || user.role !== "buyer") {
        setCount(0);
        return;
      }

      try {
        const snapshot = await getDocs(collection(db, "cart", user.email!, "items"));
        let total = 0;
        snapshot.forEach(doc => {
          total += doc.data().quantity || 1;
        });
        setCount(total);
      } catch (err) {
        console.error("Gagal mengambil jumlah cart:", err);
      }
    };

    fetchCartCount();
  }, [user, refresh, setCount]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const CartLink = (
    <Link to="/checkout" className="relative text-sm font-medium">
      Keranjang
      {count > 0 && (
        <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full px-1.5">
          {count}
        </span>
      )}
    </Link>
  );

  return (
    <nav className="bg-white shadow px-4 py-3 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-green-600">
        Furniture.go
      </Link>

      {/* Desktop */}
      <div className="hidden md:flex items-center space-x-4">
        <Link to="/" className="text-sm font-medium">Beranda</Link>

        {user?.role === "admin" && (
          <Link to="/admin" className="text-sm font-medium">Dashboard</Link>
        )}

        {user?.role === "buyer" && (
          <>
            {CartLink}
            <Link to="/orders" className="text-sm font-medium">Pesanan Saya</Link>
          </>
        )}

        {user ? (
          <Button size="sm" variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        ) : (
          <>
            <Link to="/login"><Button size="sm" variant="outline">Masuk</Button></Link>
            <Link to="/register"><Button size="sm">Daftar</Button></Link>
          </>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon"><Menu className="h-5 w-5" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="mt-6 space-y-4 flex flex-col">
              <Link to="/" onClick={() => navigate("/")}>Beranda</Link>

              {user?.role === "admin" && (
                <Link to="/admin" onClick={() => navigate("/admin")}>Dashboard</Link>
              )}

              {user?.role === "buyer" && (
                <>
                  {CartLink}
                  <Link to="/orders">Pesanan Saya</Link>
                </>
              )}

              {user ? (
                <Button variant="destructive" onClick={handleLogout} className="w-full">
                  Logout
                </Button>
              ) : (
                <>
                  <Link to="/login"><Button variant="outline" className="w-full">Masuk</Button></Link>
                  <Link to="/register"><Button className="w-full">Daftar</Button></Link>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
