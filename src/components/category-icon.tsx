import { iconFor, toneFor } from "@/lib/categories";
import { cn } from "@/lib/utils";

export function CategoryIcon({
  icon,
  size = "md",
  className,
}: {
  icon: string | null | undefined;
  size?: "sm" | "md";
  className?: string;
}) {
  const Icon = iconFor(icon);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        toneFor(icon),
        size === "sm" ? "size-8" : "size-10",
        className
      )}
    >
      <Icon className={size === "sm" ? "size-4" : "size-5"} />
    </span>
  );
}
