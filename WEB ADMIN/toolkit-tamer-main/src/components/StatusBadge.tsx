import { cn } from "@/lib/utils";

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        active
          ? "bg-success/10 text-success ring-success/20"
          : "bg-muted text-muted-foreground ring-border"
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}
