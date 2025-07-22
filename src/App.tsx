import { Routes, Route } from "react-router-dom";
import Home from "@/features/products/Home";
import Login from "@/features/auth/Login";
import Register from "@/features/auth/Register";
import RegisterAdmin from "@/features/auth/RegisterAdmin";
import AdminDashboard from "@/features/admin/Dashboard";
import Checkout from "@/features/checkout/Checkout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import ProductDetail from "@/features/products/ProductDetail";
import Navbar from "@/components/shared/Navbar";
import Shipping from "@/features/checkout/Shipping";
import Payment from "@/features/checkout/Payment";
import TransactionResult from "@/features/checkout/TransactionResult";
import OrderSummary from "@/features/orders/OrderSummary";
import MyOrders from "@/features/orders/MyOrders";
import Footer from "@/components/shared/Footer";
import { useAuth } from "@/context/auth";
import { useEffect } from "react";
import ScrollToTop from "@/components/shared/ScrollToTop";
import ProfileSettings from "@/features/user/ProfileSettings";
import GuestRoute from "@/routes/GuestRoute";
import AppLoader from "./components/shared/AppLoader";

export default function AppRoutes() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user?.role === "buyer") {
      if (!document.getElementById("tawk-script")) {
        const s1 = document.createElement("script");
        s1.async = true;
        s1.src = "https://embed.tawk.to/6872b8c2e8509719117220b2/1j0023e90";
        s1.charset = "UTF-8";
        s1.setAttribute("crossorigin", "*");
        s1.id = "tawk-script";
        document.body.appendChild(s1);
      }
    } else {
      const tawkScript = document.getElementById("tawk-script");
      if (tawkScript) tawkScript.remove();
      const iframe = document.querySelector("iframe[src*='tawk']");
      if (iframe?.parentNode) iframe.parentNode.removeChild(iframe);
    }
  }, [user?.role]);

  if (loading) {
    return <AppLoader />;
  }

  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <ScrollToTop />
          <Routes>
            {/* Auth routes (selalu bisa diakses) */}
            <Route path="/" element={<Home />} />

            {/* Rute khusus untuk GUEST (pengguna yang belum login) */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-admin" element={<RegisterAdmin />} />
            </Route>

            {/* Rute yang dilindungi untuk semua user yang login */}
            <Route
              element={<ProtectedRoute allowedRoles={["admin", "buyer"]} />}
            >
              <Route path="/profile" element={<ProfileSettings />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<MyOrders />} />
            </Route>

            {/* Buyer public routes, tapi blok admin */}
            <Route element={<ProtectedRoute allowedRoles={["buyer"]} />}>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
            </Route>

            {/* Buyer-only routes */}
            <Route element={<ProtectedRoute allowedRoles={["buyer"]} />}>
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/payment" element={<Payment />} />
              <Route
                path="/order-summary/:orderId"
                element={<OrderSummary />}
              />
              <Route path="/orders" element={<MyOrders />} />
              <Route path="/thanks" element={<TransactionResult />} />
            </Route>
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  );
}
