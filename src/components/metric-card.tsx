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
  value: string;
  icon: LucideIcon;
  tone?: "default" | "positive" | "negative";
  hint?: string;
  delta?: MetricDelta;
}) {
  const Arrow = delta?.up ? ArrowUp : ArrowDown;
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span
          className={cn(
            "flex size-11 items-center justify-center rounded-xl",
            tone === "positive" && "bg-positive/15 text-positive",
            tone === "negative" && "bg-negative/15 text-negative",
            tone === "default" && "bg-primary/15 text-primary"
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-semibold tabular-nums">{value}</p>
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
