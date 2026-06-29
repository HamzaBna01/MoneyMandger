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
    <aside className="hidden w-64 shrink-0 flex-col border-e bg-sidebar md:flex">
      <div className="flex items-center justify-between px-5 py-4">
        <Logo />
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="size-4.5" />
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
