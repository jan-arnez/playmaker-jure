import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning";
}

const variantStyles = {
  default: "from-muted/50 to-muted/20 border-border/50",
  primary: "from-primary/20 to-primary/5 border-primary/20",
  success: "from-green-500/20 to-green-500/5 border-green-500/20",
  warning: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
};

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/20 text-primary",
  success: "bg-green-500/20 text-green-500",
  warning: "bg-amber-500/20 text-amber-500",
};

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  variant = "default" 
}: StatCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl border bg-gradient-to-br p-5 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
      variantStyles[variant]
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold tracking-tight md:text-3xl">{value}</p>
            {trend && (
              <span className={cn(
                "text-xs font-medium",
                trend.positive ? "text-green-500" : "text-red-500"
              )}>
                {trend.positive ? "+" : ""}{trend.value}%
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className={cn(
          "rounded-lg p-2.5 transition-transform group-hover:scale-110",
          iconVariantStyles[variant]
        )}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      {/* Decorative gradient */}
      <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-background/0 to-background/50 opacity-50" />
    </div>
  );
}
