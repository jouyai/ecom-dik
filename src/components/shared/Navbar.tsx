import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, ShoppingBag, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useCart } from "@/context/cartStore";

// Komponen NavLink untuk menghindari repetisi kode styling
const NavLink = ({ to, children }: { to: string; children: React.ReactNode }) => (
  <Link
    to={to}
    className="text-stone-600 hover:text-stone-900 transition-colors duration-200"
  >
    {children}
  </Link>
);

export default function Navbar() {
  const { user, logout } = useAuth();
  const { refresh, count, setCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!user || user.role !== "buyer") {
        setCount(0);
        return;
      }

      try {
        const snapshot = await getDocs(
          collection(db, "cart", user.email!, "items")
        );
        const total = snapshot.docs.reduce(
          (acc, doc) => acc + (doc.data().quantity || 1),
          0
        );
        setCount(total);
      } catch (err) {
        console.error("Gagal mengambil jumlah cart:", err);
      }
    };

    fetchCartCount();
  }, [user, refresh, setCount]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout gagal:", err);
    }
  };

  // Komponen Ikon Keranjang dengan Badge
  const CartIcon = ({ isMobile = false }: { isMobile?: boolean }) => (
    <Link to="/checkout" className="relative group flex items-center">
      <div className="relative">
        <ShoppingBag className="h-6 w-6 text-stone-600 group-hover:text-stone-900 transition-colors" />
        {count > 0 && (
          <span className="absolute -top-2 -right-3 bg-amber-600 text-white text-xs font-semibold rounded-full h-5 w-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </div>
      {isMobile && <span className="ml-4">Keranjang</span>}
    </Link>
  );

  // Menu untuk pengguna yang sudah login
  const UserMenuDesktop = (
    <div className="flex items-center gap-x-5">
      {user?.role === "buyer" && <CartIcon />}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <UserCircle className="h-8 w-8 text-stone-600" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.username || user?.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user?.role === 'admin' ? (
            <>
              <DropdownMenuItem onClick={() => navigate('/admin')}>Dashboard</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/admin/orders')}>Pesanan</DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem onClick={() => navigate('/orders')}>Pesanan Saya</DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>Settings</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Menu untuk pengguna yang belum login
  const GuestMenuDesktop = (
    <div className="flex items-center gap-x-5">
      <NavLink to="/">Beranda</NavLink>
      <Link to="/login">
        <Button size="sm" variant="ghost">Masuk</Button>
      </Link>
      <Link to="/register">
        <Button size="sm" className="bg-stone-800 hover:bg-stone-700 text-white">Daftar</Button>
      </Link>
    </div>
  );

  // Menu mobile
  const MobileMenu = (
     <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon"><Menu className="h-5 w-5" /></Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-64">
          <div className="mt-8 flex flex-col space-y-6 text-lg">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <>
                    <NavLink to="/admin">Dashboard</NavLink>
                    <NavLink to="/admin/orders">Pesanan</NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/">Beranda</NavLink>
                    <NavLink to="/orders">Pesanan Saya</NavLink>
                    <CartIcon isMobile={true} />
                  </>
                )}
                <Button variant="destructive" onClick={handleLogout} className="w-full !mt-10">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/">Beranda</NavLink>
                <Link to="/login"><Button variant="outline" className="w-full">Masuk</Button></Link>
                <Link to="/register"><Button className="w-full bg-stone-800 hover:bg-stone-700 text-white">Daftar</Button></Link>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
  );

  return (
    <header className="bg-stone-50/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-stone-800 tracking-wide">
          Furniture.go
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center">
          {user ? UserMenuDesktop : GuestMenuDesktop}
        </div>

        {/* Mobile Nav */}
        <div className="md:hidden">
          {MobileMenu}
        </div>
      </nav>
    </header>
  );
}
