"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, LogOut, Settings } from "lucide-react";
import { MOBILE_NAV_ITEMS } from "@/lib/nav";
import { useDict } from "@/components/i18n-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/(dashboard)/actions";

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function BottomNav({
  userName,
  userEmail,
  householdName,
}: {
  userName?: string;
  userEmail?: string;
  householdName?: string;
} = {}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const dict = useDict();
  const left = MOBILE_NAV_ITEMS.slice(0, 3);
  const right = MOBILE_NAV_ITEMS.slice(3, 6);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-7 items-center px-2 py-1.5">
        {left.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        <div className="flex justify-center">
          <Link
            href="/transactions?new=1"
            aria-label={dict.dashboard.addTransaction}
            className="flex size-12 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-background transition-transform active:scale-95"
          >
            <Plus className="size-6" />
          </Link>
        </div>

        {right.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        {userName && userEmail && householdName && (
          <MobileUserMenu
            name={userName}
            email={userEmail}
            householdName={householdName}
          />
        )}
      </div>
    </nav>
  );
}

function NavLink({
  item,
  active,
}: {
  item: (typeof MOBILE_NAV_ITEMS)[number];
  active: boolean;
}) {
  const dict = useDict();
  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-md py-1 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <item.icon className="size-5" />
      {dict.nav[item.labelKey]}
    </Link>
  );
}

function MobileUserMenu({
  name,
  email,
  householdName,
}: {
  name: string;
  email: string;
  householdName: string;
}) {
  const t = useDict().nav;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex flex-col items-center gap-0.5 rounded-md py-1 text-[11px] font-medium text-muted-foreground transition-colors">
        <Avatar className="size-5">
          <AvatarFallback className="bg-primary/15 text-[8px] font-bold text-primary">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <span className="truncate">Profile</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <div className="px-1.5 py-1">
          <p className="text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{householdName}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem nativeButton={false} render={<Link href="/settings" />}>
          <Settings className="size-4" />
          {t.settings}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void logoutAction();
          }}
        >
          <LogOut className="size-4" />
          {t.logout}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
