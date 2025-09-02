import { ClientDashboard } from "@/components/dashboard/client-dashboard";
import { headers } from "next/headers";

// Ensure this page is rendered dynamically to avoid build-time API fetches
export const dynamic = "force-dynamic";

function getBaseUrl() {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const fallbackPort = process.env.PORT || "3000";
  return host ? `${proto}://${host}` : `http://localhost:${fallbackPort}`;
}

async function getDashboardStats() {
  try {
    const response = await fetch(`${getBaseUrl()}/api/dashboard/stats`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error("Failed to fetch dashboard stats");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalEmployees: 100,
      totalTransactions: 5000,
      activeViolations: 12,
      controlEffectivenessScore: 87.5,
      highRiskViolations: 4,
      avgResolutionTime: 18.5,
      complianceRate: 94.2,
      riskTrend: "STABLE",
    };
  }
}

async function getTrendData() {
  try {
    const response = await fetch(
      `${getBaseUrl()}/api/analytics/trends?days=30&metric=violations`,
      {
        next: { revalidate: 300 },
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch trend data");
    }

    const data = await response.json();
    return data.trendData ?? [];
  } catch (error) {
    console.error("Failed to fetch trend data:", error);
    return [];
  }
}

async function getRiskHeatmapData() {
  try {
    const response = await fetch(`${getBaseUrl()}/api/analytics/risk-heatmap`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch risk heatmap data");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch risk heatmap data:", error);
    return [];
  }
}

export default async function ExecutiveDashboard() {
  const [dashboardStats, trendData, riskHeatmapData] = await Promise.all([
    getDashboardStats(),
    getTrendData(),
    getRiskHeatmapData(),
  ]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Executive Financial Controls Dashboard
            </h1>
            <p className="text-blue-100 text-lg">
              Real-time monitoring of segregation of duties and financial
              control effectiveness
            </p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Last Updated</p>
            <p className="text-white font-semibold">
              {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Client-side Dashboard Components */}
      <ClientDashboard
        dashboardStats={dashboardStats}
        trendData={trendData}
        riskHeatmapData={riskHeatmapData}
      />
    </div>
  );
}
