import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  PieChart,
  Repeat,
  Settings,
  Tags,
  BadgeDollarSign,
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
  | "credits"
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
  { href: "/credits", labelKey: "credits", icon: BadgeDollarSign },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

// Mobile dock: four tabs around a centered "+" button. Everything else lives
// in the "More" sheet so the bar never gets crowded.
export const MOBILE_NAV_ITEMS: NavItem[] = [
  { href: "/", labelKey: "home", icon: LayoutDashboard },
  { href: "/transactions", labelKey: "activity", icon: ArrowLeftRight },
  { href: "/accounts", labelKey: "accounts", icon: Wallet },
];

export const MOBILE_MORE_ITEMS: NavItem[] = [
  { href: "/budgets", labelKey: "budgets", icon: Target },
  { href: "/recurring", labelKey: "recurring", icon: Repeat },
  { href: "/credits", labelKey: "credits", icon: BadgeDollarSign },
  { href: "/categories", labelKey: "categories", icon: Tags },
  { href: "/reports", labelKey: "reports", icon: PieChart },
  { href: "/settings", labelKey: "settings", icon: Settings },
];
