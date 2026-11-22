import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7faf7] px-4 py-8 text-foreground sm:px-6 dark:bg-background">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(120deg,#e9f8ef_0%,#fdf6df_34%,#eaf2ff_70%,#f8edf3_100%)] dark:bg-[linear-gradient(120deg,color-mix(in_oklch,var(--primary),transparent_82%),color-mix(in_oklch,var(--warning),transparent_86%),color-mix(in_oklch,var(--chart-4),transparent_88%),var(--background))]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-[linear-gradient(135deg,#1d9e75_0%,#28b886_36%,#ef9f27_100%)] opacity-95 dark:opacity-60" />
      <div className="absolute inset-x-0 top-72 -z-10 h-20 bg-[linear-gradient(180deg,color-mix(in_oklch,#1d9e75,transparent_72%),transparent)]" />
      <div className="absolute end-4 top-4 z-10 flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
