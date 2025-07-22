import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import RegisterAdmin from "@/pages/RegisterAdmin";
import AdminDashboard from "@/pages/admin/Dashboard";
import Checkout from "@/pages/Checkout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import ProductDetail from "@/pages/ProductDetail";
import Navbar from "@/components/Navbar";
import Shipping from "./pages/Shipping";
import Payment from "@/pages/Payment";
import TransactionResult from "@/pages/TransactionResult";
import OrderSummary from "@/pages/OrderSummary";
import MyOrders from "@/pages/MyOrders";
import Thanks from "@/pages/Thanks";
import Footer from "@/components/Footer";
import Pending from "@/pages/Pending";
import Error from "@/pages/Error";
import { useAuth } from "@/context/auth";
import { useEffect } from "react";

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
    return <div className="text-center p-10">Loading...</div>;
  }

  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">
          <Routes>
            {/* Auth routes (selalu bisa diakses) */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-admin" element={<RegisterAdmin />} />

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
              <Route path="/order-summary/:orderId" element={<OrderSummary />} />
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
