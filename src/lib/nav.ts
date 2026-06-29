import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  PieChart,
  Repeat,
  Settings,
  Tags,
  type LucideIcon,
} from "lucide-react";

// `labelKey` is a key into the `nav` dictionary section; the visible label is
// resolved per-locale at render time.
export interface NavItem {
  href: string;
  labelKey:
    | "dashboard"
    | "transactions"
    | "accounts"
    | "budgets"
    | "categories"
    | "reports"
    | "recurring"
    | "settings"
    | "home"
    | "activity";
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/transactions", labelKey: "transactions", icon: ArrowLeftRight },
  { href: "/accounts", labelKey: "accounts", icon: Wallet },
  { href: "/budgets", labelKey: "budgets", icon: Target },
  { href: "/categories", labelKey: "categories", icon: Tags },
  { href: "/reports", labelKey: "reports", icon: PieChart },
  { href: "/recurring", labelKey: "recurring", icon: Repeat },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

// Subset shown on the mobile bottom bar (plus a centered "+" add button).
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "home", icon: LayoutDashboard },
  { href: "/transactions", labelKey: "activity", icon: ArrowLeftRight },
  { href: "/budgets", labelKey: "budgets", icon: Target },
  { href: "/settings", labelKey: "settings", icon: Settings },
];
