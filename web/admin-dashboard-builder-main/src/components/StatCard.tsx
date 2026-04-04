import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  color: "blue" | "emerald" | "amber" | "rose";
}

const colorMap = {
  blue: "bg-stat-blue/10 text-stat-blue",
  emerald: "bg-stat-emerald/10 text-stat-emerald",
  amber: "bg-stat-amber/10 text-stat-amber",
  rose: "bg-stat-rose/10 text-stat-rose",
};

export function StatCard({ title, value, change, changeType = "neutral", icon: Icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-card-foreground">{value}</p>
          {change && (
            <p className={`mt-1 text-xs font-medium ${
              changeType === "positive" ? "text-stat-emerald" : 
              changeType === "negative" ? "text-stat-rose" : "text-muted-foreground"
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
