"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Shield,
  Settings,
  Users,
  AlertTriangle,
  Activity,
} from "lucide-react";

const navigation = [
  { name: "Executive Summary", href: "/", icon: BarChart3 },
  { name: "SoD Monitoring", href: "/sod-monitoring", icon: Shield },
  { name: "API Integration", href: "/api-integration", icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  FinanceGuard
                </h1>
                <p className="text-xs text-gray-500">
                  Enterprise Controls Monitor
                </p>
              </div>
            </div>
          </div>

          <nav className="flex space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-blue-100 text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <AlertTriangle className="h-4 w-4" />
              <span>Demo Mode</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
