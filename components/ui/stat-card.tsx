import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-red-600";
      case "down":
        return "text-green-600";
      case "stable":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return "↗";
      case "down":
        return "↙";
      case "stable":
        return "→";
      default:
        return "";
    }
  };

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          {trend && trendValue && (
            <div
              className={cn("flex items-center mt-2 text-sm", getTrendColor())}
            >
              <span className="mr-1">{getTrendIcon()}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="ml-4">
          <div className="p-3 bg-blue-50 rounded-lg">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
