import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MetricDelta {
  /** Already-formatted text, e.g. "12% vs last month". */
  text: string;
  /** Arrow direction — the actual change (up = larger than last month). */
  up: boolean;
  /** Colour semantics — whether the change is good or bad for this metric. */
  tone: "positive" | "negative";
}

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
  delta,
}: {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative";
  hint?: string;
  delta?: MetricDelta;
}) {
  const Arrow = delta?.up ? ArrowUp : ArrowDown;
  return (
    <Card className="h-full justify-center">
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={cn(
            "relative flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset",
            tone === "positive" && "bg-positive/12 text-positive ring-positive/25 dark:shadow-[0_0_24px_-6px_var(--positive)]",
            tone === "negative" && "bg-negative/12 text-negative ring-negative/25 dark:shadow-[0_0_24px_-6px_var(--negative)]",
            tone === "default" && "bg-primary/12 text-primary ring-primary/25 dark:shadow-[0_0_24px_-6px_var(--primary)]"
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="font-display truncate text-2xl font-bold tabular-nums">{value}</p>
          {delta ? (
            <p
              className={cn(
                "flex items-center gap-0.5 text-xs tabular-nums",
                delta.tone === "positive" ? "text-positive" : "text-negative"
              )}
            >
              <Arrow className="size-3 shrink-0" />
              {delta.text}
            </p>
          ) : (
            hint && <p className="text-xs text-muted-foreground">{hint}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
