"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, LogOut, Ellipsis } from "lucide-react";
import { MOBILE_NAV_ITEMS, MOBILE_MORE_ITEMS } from "@/lib/nav";
import { useDict } from "@/components/i18n-provider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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

// Dock slots, start to end: Home · Activity · "+" · Accounts · More.
const SLOT_COUNT = 5;

/**
 * Floating glass dock for phones: Home, Activity, a raised "+" button,
 * Accounts and a "More" sheet holding every other page plus the profile.
 * Slides out of the way while scrolling down and returns on scroll up.
 */
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
  const dict = useDict();
  const [moreOpen, setMoreOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const [home, activity, accounts] = MOBILE_NAV_ITEMS;
  const moreActive = moreOpen || MOBILE_MORE_ITEMS.some((i) => isActive(i.href));
  const slotActive = [
    !moreOpen && isActive(home.href),
    !moreOpen && isActive(activity.href),
    false, // "+" button
    !moreOpen && isActive(accounts.href),
    moreActive,
  ];
  const activeSlot = slotActive.indexOf(true);

  // Hide while scrolling down the page, show again on the way up. The app
  // scrolls inside <main>, so listen in the capture phase.
  useEffect(() => {
    const onScroll = (e: Event) => {
      const el = e.target;
      if (!(el instanceof HTMLElement) || el.tagName !== "MAIN") return;
      const y = el.scrollTop;
      const dy = y - lastY.current;
      if (Math.abs(dy) > 6) setHidden(dy > 0 && y > 80);
      lastY.current = y;
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => document.removeEventListener("scroll", onScroll, { capture: true });
  }, []);

  return (
    <>
      <nav
        className={cn(
          "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-40 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden",
          hidden && !moreOpen && "translate-y-[calc(100%+1.5rem)]"
        )}
      >
        <div className="dock relative mx-auto grid h-16 max-w-md grid-cols-5 items-center rounded-[1.75rem] border bg-background/85 px-1 backdrop-blur-2xl">
          {/* Sliding active pill */}
          {activeSlot >= 0 && (
            <span
              aria-hidden
              className="dock-pill pointer-events-none absolute inset-y-1.5 start-1 rounded-[1.4rem]"
              style={{
                width: `calc((100% - 0.5rem) / ${SLOT_COUNT})`,
                transform: `translateX(calc(${activeSlot * 100}% * var(--dock-dir, 1)))`,
              }}
            />
          )}

          <DockLink item={home} active={slotActive[0]} label={dict.nav[home.labelKey]} />
          <DockLink item={activity} active={slotActive[1]} label={dict.nav[activity.labelKey]} />

          <div className="flex justify-center">
            <Link
              href="/transactions?new=1"
              aria-label={dict.dashboard.addTransaction}
              className="dock-add relative flex size-14 -translate-y-4 items-center justify-center rounded-full bg-primary text-primary-foreground ring-[5px] ring-background transition-transform duration-300 active:scale-90"
            >
              <Plus className="size-6" strokeWidth={2.5} />
            </Link>
          </div>

          <DockLink item={accounts} active={slotActive[3]} label={dict.nav[accounts.labelKey]} />

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={cn(
              "relative z-10 flex h-full min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors",
              moreActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Ellipsis
              className={cn("size-5 transition-transform duration-300", moreActive && "-translate-y-0.5 scale-110")}
            />
            <span className="w-full truncate text-center">{dict.nav.more}</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="rounded-t-[2rem] border-x-0 bg-popover/90 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] pt-3 backdrop-blur-2xl md:hidden"
        >
          <span aria-hidden className="mx-auto block h-1.5 w-12 rounded-full bg-muted-foreground/30" />
          <SheetTitle className="sr-only">{dict.nav.more}</SheetTitle>

          {userName && (
            <div className="sheet-tile flex items-center gap-3 rounded-2xl border bg-card p-3" style={{ "--i": 0 } as React.CSSProperties}>
              <Avatar className="size-11">
                <AvatarFallback className="bg-primary/15 text-sm font-bold text-primary">
                  {initials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[householdName, userEmail].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5">
            {MOBILE_MORE_ITEMS.map((item, i) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "sheet-tile group flex flex-col items-center gap-2 rounded-2xl border p-3.5 text-xs font-medium transition-colors active:scale-95",
                    active
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "bg-card text-foreground hover:border-primary/40"
                  )}
                  style={{ "--i": i + 1 } as React.CSSProperties}
                >
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                      active
                        ? "bg-primary text-primary-foreground shadow-[0_0_20px_-4px_var(--glow)]"
                        : "bg-muted text-primary"
                    )}
                  >
                    <item.icon className="size-5" />
                  </span>
                  <span className="w-full truncate text-center">{dict.nav[item.labelKey]}</span>
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              void logoutAction();
            }}
            className="sheet-tile flex h-12 items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 text-sm font-semibold text-destructive transition-colors active:bg-destructive/20"
            style={{ "--i": MOBILE_MORE_ITEMS.length + 1 } as React.CSSProperties}
          >
            <LogOut className="size-4" />
            {dict.nav.logout}
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}

function DockLink({
  item,
  active,
  label,
}: {
  item: (typeof MOBILE_NAV_ITEMS)[number];
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative z-10 flex h-full min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <item.icon
        className={cn("size-5 transition-transform duration-300", active && "-translate-y-0.5 scale-110")}
      />
      <span className="w-full truncate text-center">{label}</span>
    </Link>
  );
}
