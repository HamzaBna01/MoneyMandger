import { connection } from "next/server";
import { requireHousehold } from "@/lib/session";
import { materializeDueRules } from "@/lib/recurring";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

// Every dashboard route is per-user (reads the session cookie), so never cache.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Opt out of prerendering — this subtree depends on the incoming request
  // (session cookie) and must never be statically baked as a redirect.
  await connection();
  const { userName, userEmail, household, householdId } = await requireHousehold();

  // Materialize recurring transactions automatically the next time the dashboard
  // is loaded so rules are processed without any manual action.
  await materializeDueRules(householdId);

  return (
    <div className="flex min-h-screen">
      <AppSidebar
        name={userName}
        email={userEmail}
        householdName={household.name}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b px-4 py-3 md:hidden">
          <Logo />
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-8 md:pt-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <BottomNav
        userName={userName}
        userEmail={userEmail}
        householdName={household.name}
      />
    </div>
  );
}
