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
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <Wallet className="size-4.5" />
      </span>
      {showName && (
        <span className="text-lg font-semibold tracking-tight">Barakah</span>
      )}
    </div>
  );
}
