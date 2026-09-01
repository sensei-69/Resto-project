import {
  LayoutDashboard,
  ShoppingBag,
  TicketCheck,
  UserCog,
  UtensilsCrossed,
} from "lucide-react";
import type { NavItem } from "../admin/components/dashboard/shell";

/** Shared customer navigation - identical on every user page so options never disappear. */
export const USER_NAV: NavItem[] = [
  { to: "/dashboard", label: "My space", icon: LayoutDashboard, exact: true },
  { to: "/my-orders", label: "My orders", icon: ShoppingBag, exact: true },
  { to: "/tickets", label: "My tickets", icon: TicketCheck, exact: true },
  { to: "/profile", label: "My infos", icon: UserCog, exact: true },
  { to: "/menu", label: "Order food", icon: UtensilsCrossed },
];
