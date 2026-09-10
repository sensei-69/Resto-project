import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";
import { RequireAuth, RequireRole } from "./components/guards";
import LandingPage from "./components/landing-page";
import FoodSelectUI from "./components/food-select-page";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/register/RegisterPage";
import UserDashboard from "./components/user-dashboard/UserDashboard";
import MyOrdersPage from "./components/MyOrdersPage";
import ProfilePage from "./components/ProfilePage";
import DeliveryDashboard from "./components/DeliveryDashboard";
import TicketsPage from "./components/TicketsPage";
import { GlobalCartDrawer } from "./components/GlobalCartDrawer";
import AdminLayout from "./admin/routes/admin";
import AdminOverview from "./admin/routes/admin.index";
import AdminOrders from "./admin/routes/admin.orders";
import AdminMenu from "./admin/routes/admin.menu";
import AdminUsers from "./admin/routes/admin.users";
import AdminOffers from "./admin/routes/admin.offers";
import "./admin/styles.css";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CartProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/menu" element={<FoodSelectUI />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Any signed-in role */}
            <Route element={<RequireAuth />}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Delivery riders */}
            <Route element={<RequireRole roles={["DELIVERY"]} />}>
              <Route path="/delivery" element={<DeliveryDashboard />} />
            </Route>

            {/* One /admin shell, gated by role (Owner + Super Admin) */}
            <Route element={<RequireRole roles={["OWNER", "SUPER_ADMIN"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminOverview />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="menu" element={<AdminMenu />} />
                <Route element={<RequireRole roles={["SUPER_ADMIN"]} />}>
                  <Route path="users" element={<AdminUsers />} />
                </Route>
                <Route path="offers" element={<AdminOffers />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <GlobalCartDrawer />
        </CartProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
