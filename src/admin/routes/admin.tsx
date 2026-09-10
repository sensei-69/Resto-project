import { Outlet } from "react-router-dom";
import { BarChart3, ClipboardList, Gift, UtensilsCrossed, Users } from "lucide-react";
import { DashboardShell, type NavItem } from "../components/dashboard/shell";
import { useAuth } from "../../context/AuthContext";

const ownerNav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: BarChart3, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
  { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/admin/offers", label: "Offers", icon: Gift },
];

// Platform-level oversight: the Users section is Super Admin only.
const superAdminNav: NavItem[] = [
  ...ownerNav,
  { to: "/admin/users", label: "Users", icon: Users },
];

export default function AdminLayout() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  return (
    <DashboardShell
      role={isSuperAdmin ? "Super Admin" : "Owner"}
      person={user?.name ?? ""}
      nav={isSuperAdmin ? superAdminNav : ownerNav}
    >
      <Outlet />
    </DashboardShell>
  );
}
