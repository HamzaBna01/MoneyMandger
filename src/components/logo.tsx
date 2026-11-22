import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showName = true,
}: {
  className?: string;
  showName?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_20px_-4px_var(--glow)]">
        <Wallet className="size-4.5" />
      </span>
      {showName && (
        <span className="font-display text-lg font-bold">Barakah</span>
      )}
    </div>
  );
}
