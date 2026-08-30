import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CartProvider } from "./context/CartContext";
import LandingPage from "./components/landing-page";
import FoodSelectUI from "./components/food-select-page";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/register/RegisterPage";
import UserDashboard from "./components/user-dashboard/UserDashboard";
import { GlobalCartDrawer } from "./components/GlobalCartDrawer";
import AdminLayout from "./admin/routes/admin";
import AdminOverview from "./admin/routes/admin.index";
import AdminMenu from "./admin/routes/admin.menu";
import AdminUsers from "./admin/routes/admin.users";
import AdminOffers from "./admin/routes/admin.offers";
import "./admin/styles.css";
import "./App.css";

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/menu" element={<FoodSelectUI />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="offers" element={<AdminOffers />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <GlobalCartDrawer />
      </CartProvider>
    </BrowserRouter>
  );
}
