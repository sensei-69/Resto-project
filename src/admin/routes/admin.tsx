import { Outlet } from "react-router-dom";
import { BarChart3, Gift, UtensilsCrossed, Users } from "lucide-react";
import { DashboardShell, type NavItem } from "../components/dashboard/shell";

const nav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: BarChart3, exact: true },
  { to: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/offers", label: "Offers", icon: Gift },
];

export default function AdminLayout() {
  return (
    <DashboardShell role="Owner" person="Yanis Bouzid" nav={nav}>
      <Outlet />
    </DashboardShell>
  );
}
