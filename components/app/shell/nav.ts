import {
  BarChart3,
  Database,
  LayoutDashboard,
  Megaphone,
  Radar,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Media Database", href: "/media", icon: Database },
  { title: "Campaigns", href: "/campaigns", icon: Megaphone },
  { title: "Monitor", href: "/monitor", icon: Radar },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Settings", href: "/settings", icon: Settings },
];
