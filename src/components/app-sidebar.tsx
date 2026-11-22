"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserChip } from "@/components/user-chip";
import { useDict } from "@/components/i18n-provider";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function AppSidebar({
  name,
  email,
  householdName,
}: {
  name: string;
  email: string;
  householdName: string;
}) {
  const pathname = usePathname();
  const dict = useDict();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e bg-sidebar backdrop-blur-2xl md:flex">
      <div className="flex items-center justify-between px-5 py-4">
        <Logo />
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {active && (
                <span className="nav-active-bar absolute inset-y-2 start-0 w-1 rounded-full bg-primary" />
              )}
              <item.icon className="size-4.5 transition-transform duration-300 group-hover:scale-110" />
              {dict.nav[item.labelKey]}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <UserChip name={name} email={email} householdName={householdName} />
      </div>
    </aside>
  );
}
