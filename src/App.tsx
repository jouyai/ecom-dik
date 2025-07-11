import { Routes, Route, useLocation } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AdminDashboard from "@/pages/admin/Dashboard";
import Checkout from "@/pages/Checkout";
import ProtectedRoute from "@/routes/ProtectedRoute";
import ProductDetail from "@/pages/ProductDetail";
import Navbar from "@/components/Navbar";
import Shipping from "./pages/Shipping";
import Payment from "@/pages/Payment";
import OrderSummary from "@/pages/OrderSummary";
import MyOrders from "@/pages/MyOrders";
import Thanks from "@/pages/Thanks";

export default function AppRoutes() {
  const location = useLocation();
  const hideNavbar = ["/login", "/register"].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/product/:id" element={<ProductDetail />} />

        {/* Protected Route - Admin Only */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        {/* Protected Route - Buyer Only */}
        <Route element={<ProtectedRoute allowedRoles={["buyer"]} />}>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/order-summary/:orderId" element={<OrderSummary />} />
          <Route path="/orders" element={<MyOrders />} />
          <Route path="/thanks" element={<Thanks />} />
        </Route>
      </Routes>
    </>
  );
}
