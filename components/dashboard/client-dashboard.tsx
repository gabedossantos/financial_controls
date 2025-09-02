"use client";

import {
  useState,
  useCallback,
  useContext,
  createContext,
  useEffect,
} from "react";
import {
  Shield,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  Activity,
  BarChart3,
  Calculator,
  Settings2,
  Target,
  AlertCircle,
  Zap,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { EnhancedStatCard } from "@/components/ui/enhanced-stat-card";
import { EnhancedTrendChart } from "@/components/charts/enhanced-trend-chart";
import { RiskHeatmap } from "@/components/charts/risk-heatmap";
import { CustomPieChart } from "@/components/charts/pie-chart";
import { TransactionsModal } from "@/components/modals/transactions-modal";
import { EmployeesModal } from "@/components/modals/employees-modal";
import { EnhancedSlider } from "@/components/ui/enhanced-slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Create context for materiality settings
export const MaterialityContext = createContext<{
  settings: any;
  recalculationTrigger: number;
} | null>(null);

interface ClientDashboardProps {
  dashboardStats: {
    totalEmployees: number;
    totalTransactions: number;
    activeViolations: number;
    controlEffectivenessScore: number;
    highRiskViolations: number;
    avgResolutionTime: number;
    complianceRate: number;
    riskTrend: string;
  };
  trendData: any[];
  riskHeatmapData: any[];
}

export function ClientDashboard({
  dashboardStats,
  trendData,
  riskHeatmapData,
}: ClientDashboardProps) {
  const [isTransactionsModalOpen, setIsTransactionsModalOpen] = useState(false);
  const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState(false);

  // Enhanced Materiality Configuration State
  const [materialitySettings, setMaterialitySettings] = useState({
    overallMateriality: 50000,
    performanceMateriality: 37500,
    trivialThreshold: 2500,
    highRiskMultiplier: 0.5,
    preset: "custom" as "conservative" | "balanced" | "aggressive" | "custom",
  });

  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalculationTrigger, setRecalculationTrigger] = useState(0);
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [recalculatedStats, setRecalculatedStats] = useState(dashboardStats);
  const [isDataUpdated, setIsDataUpdated] = useState(false);
  const [selectedDays, setSelectedDays] = useState(30);
  const [rangeRefreshing, setRangeRefreshing] = useState(false);

  // Use recalculated stats for current display data
  const currentStats = isDataUpdated ? recalculatedStats : dashboardStats;

  // Calculate violation severity distribution for pie chart
  const severityData = [
    {
      name: "Critical",
      value: currentStats.highRiskViolations || 4,
      color: "#FF6363",
    },
    {
      name: "High",
      value: Math.floor((currentStats.activeViolations || 12) * 0.3),
      color: "#FF9149",
    },
    {
      name: "Medium",
      value: Math.floor((currentStats.activeViolations || 12) * 0.5),
      color: "#FF90BB",
    },
    {
      name: "Low",
      value: Math.floor((currentStats.activeViolations || 12) * 0.2),
      color: "#80D8C3",
    },
  ];

  const getTrendIndicator = (trend: string) => {
    switch (trend) {
      case "UP":
        return { text: "Risk Increasing", color: "text-red-600" };
      case "DOWN":
        return { text: "Risk Decreasing", color: "text-green-600" };
      default:
        return { text: "Risk Stable", color: "text-blue-600" };
    }
  };

  const trendIndicator = getTrendIndicator(currentStats.riskTrend);

  // Preset configurations
  const presets = {
    conservative: {
      overallMateriality: 25000,
      performanceMateriality: 18750,
      trivialThreshold: 1250,
      highRiskMultiplier: 0.3,
    },
    balanced: {
      overallMateriality: 50000,
      performanceMateriality: 37500,
      trivialThreshold: 2500,
      highRiskMultiplier: 0.5,
    },
    aggressive: {
      overallMateriality: 100000,
      performanceMateriality: 75000,
      trivialThreshold: 5000,
      highRiskMultiplier: 0.7,
    },
  };

  const applyPreset = (preset: keyof typeof presets) => {
    setMaterialitySettings({
      ...presets[preset],
      preset,
    });
  };

  const handleRecalculate = useCallback(async () => {
    setIsRecalculating(true);
    setIsDataUpdated(false);

    try {
      // Create materiality parameters for API calls
      const materialityParams = new URLSearchParams({
        overallMateriality: materialitySettings.overallMateriality.toString(),
        performanceMateriality:
          materialitySettings.performanceMateriality.toString(),
        trivialThreshold: materialitySettings.trivialThreshold.toString(),
        highRiskMultiplier: materialitySettings.highRiskMultiplier.toString(),
      });
      materialityParams.set("days", String(selectedDays));

      // Fetch recalculated dashboard stats with new materiality settings
      // NOTE: endpoint is /api/dashboard/stats (not /api/dashboard)
      const response = await fetch(`/api/dashboard/stats?${materialityParams}`);
      const newDashboardData = await response.json();
      // Optional: small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 800));

      setRecalculatedStats({
        ...dashboardStats,
        ...newDashboardData,
      });
      setRecalculationTrigger((prev) => prev + 1);
      setIsDataUpdated(true);

      console.log(
        "Risk scores recalculated with materiality settings:",
        materialitySettings,
      );
      console.log("Updated stats:", newDashboardData);
    } catch (error) {
      console.error("Recalculation failed:", error);
    } finally {
      setIsRecalculating(false);
      setMaterialitySettings((prev) => ({ ...prev, preset: "custom" }));
    }
  }, [materialitySettings, dashboardStats, selectedDays]);

  // Fetch stats when date range changes (from the trend chart)
  const refreshStatsForRange = useCallback(
    async (days: number) => {
      try {
        if (rangeRefreshing) return;
        setRangeRefreshing(true);
        const params = new URLSearchParams({ days: String(days) });
        params.set(
          "overallMateriality",
          String(materialitySettings.overallMateriality),
        );
        params.set(
          "performanceMateriality",
          String(materialitySettings.performanceMateriality),
        );
        params.set(
          "trivialThreshold",
          String(materialitySettings.trivialThreshold),
        );
        params.set(
          "highRiskMultiplier",
          String(materialitySettings.highRiskMultiplier),
        );

        const res = await fetch(`/api/dashboard/stats?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to refresh dashboard stats");
        const data = await res.json();

        setRecalculatedStats({
          ...dashboardStats,
          ...data,
        });
        setIsDataUpdated(true);
      } catch (e) {
        console.error("Failed to refresh stats for selected range:", e);
      } finally {
        setRangeRefreshing(false);
      }
    },
    [materialitySettings, dashboardStats, rangeRefreshing],
  );

  const handleRangeChange = useCallback(
    (days: number) => {
      if (days === selectedDays) return;
      setSelectedDays(days);
      refreshStatsForRange(days);
    },
    [refreshStatsForRange, selectedDays],
  );

  // On mount, refresh stats once to ensure totals (e.g., Transactions Analyzed) are up to date
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!isDataUpdated) {
          await refreshStatsForRange(selectedDays);
          if (!cancelled) setIsDataUpdated(true);
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getRiskCoverageEstimate = () => {
    const { overallMateriality, performanceMateriality, trivialThreshold } =
      materialitySettings;
    const coverage = Math.min(
      95,
      Math.max(
        60,
        85 -
          (overallMateriality - 50000) / 10000 +
          (performanceMateriality - 37500) / 5000,
      ),
    );
    return Math.round(coverage);
  };

  const getPresetBadgeColor = (preset: string) => {
    switch (preset) {
      case "conservative":
        return "bg-red-100 text-red-700 border-red-200";
      case "balanced":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "aggressive":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-purple-100 text-purple-700 border-purple-200";
    }
  };

  return (
    <MaterialityContext.Provider
      value={{
        settings: materialitySettings,
        recalculationTrigger,
      }}
    >
      <div className="space-y-8">
        {/* Revolutionary Materiality Configuration Panel */}
        <div className="relative">
          {/* Quick Actions Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 rounded-t-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                  <Settings2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    AI-Powered Risk Configuration
                  </h3>
                  <p className="text-purple-200 text-sm">
                    Real-time materiality analysis & risk recalibration
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge
                  className={`${getPresetBadgeColor(materialitySettings.preset)} font-medium px-3 py-1`}
                >
                  {materialitySettings.preset.charAt(0).toUpperCase() +
                    materialitySettings.preset.slice(1)}{" "}
                  Profile
                </Badge>
                <Button
                  onClick={() => setIsConfigExpanded(!isConfigExpanded)}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
                >
                  <Target className="h-4 w-4 mr-2" />
                  {isConfigExpanded ? "Collapse" : "Configure"}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Preset Selection */}
          <div className="bg-white border-x border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                <Zap className="h-4 w-4 mr-2 text-yellow-500" />
                Quick Presets
              </h4>
              <div className="text-xs text-gray-500">
                Risk Coverage:{" "}
                <span className="font-semibold text-green-600">
                  {getRiskCoverageEstimate()}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {Object.entries(presets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key as keyof typeof presets)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                    materialitySettings.preset === key
                      ? "border-purple-500 bg-purple-50 shadow-lg scale-105"
                      : "border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50"
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </div>
                  <div className="text-xs text-gray-600">
                    ${preset.overallMateriality.toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">
                    {key === "conservative" && "🛡️ High Security"}
                    {key === "balanced" && "⚖️ Standard"}
                    {key === "aggressive" && "🚀 Performance"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Expanded Configuration */}
          {isConfigExpanded && (
            <div className="bg-white border border-gray-200 rounded-b-2xl shadow-xl">
              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left Column - Core Materiality */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                      <h5 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-blue-600" />
                        Core Materiality Thresholds
                      </h5>

                      {/* Overall Materiality */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-sm font-medium text-gray-700">
                            Overall Materiality
                          </label>
                          <div className="bg-white px-3 py-1 rounded-lg border shadow-sm">
                            <span className="text-sm font-semibold text-blue-600">
                              $
                              {materialitySettings.overallMateriality.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <EnhancedSlider
                          value={[materialitySettings.overallMateriality]}
                          onValueChange={([value]) =>
                            setMaterialitySettings((prev) => ({
                              ...prev,
                              overallMateriality: value,
                              performanceMateriality: Math.round(value * 0.75),
                              trivialThreshold: Math.round(value * 0.05),
                              preset: "custom",
                            }))
                          }
                          max={200000}
                          min={10000}
                          step={5000}
                          className="mb-4"
                        />
                        <div className="text-xs text-gray-500">
                          Primary threshold for material misstatements
                        </div>
                      </div>

                      {/* Performance Materiality */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-sm font-medium text-gray-700">
                            Performance Materiality
                          </label>
                          <div className="bg-white px-3 py-1 rounded-lg border shadow-sm">
                            <span className="text-sm font-semibold text-green-600">
                              $
                              {materialitySettings.performanceMateriality.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <EnhancedSlider
                          value={[materialitySettings.performanceMateriality]}
                          onValueChange={([value]) =>
                            setMaterialitySettings((prev) => ({
                              ...prev,
                              performanceMateriality: value,
                              preset: "custom",
                            }))
                          }
                          max={150000}
                          min={5000}
                          step={2500}
                          className="mb-4"
                        />
                        <div className="text-xs text-gray-500">
                          Operational threshold for testing procedures
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Risk Adjustments */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                      <h5 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
                        Risk Adjustments
                      </h5>

                      {/* Trivial Threshold */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-sm font-medium text-gray-700">
                            Trivial Threshold
                          </label>
                          <div className="bg-white px-3 py-1 rounded-lg border shadow-sm">
                            <span className="text-sm font-semibold text-amber-600">
                              $
                              {materialitySettings.trivialThreshold.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <EnhancedSlider
                          value={[materialitySettings.trivialThreshold]}
                          onValueChange={([value]) =>
                            setMaterialitySettings((prev) => ({
                              ...prev,
                              trivialThreshold: value,
                              preset: "custom",
                            }))
                          }
                          max={10000}
                          min={500}
                          step={250}
                          className="mb-4"
                        />
                        <div className="text-xs text-gray-500">
                          Below this amount, items are considered
                          inconsequential
                        </div>
                      </div>

                      {/* High-Risk Multiplier */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className="text-sm font-medium text-gray-700">
                            High-Risk Area Multiplier
                          </label>
                          <div className="bg-white px-3 py-1 rounded-lg border shadow-sm">
                            <span className="text-sm font-semibold text-red-600">
                              {materialitySettings.highRiskMultiplier}x
                            </span>
                          </div>
                        </div>
                        <EnhancedSlider
                          value={[materialitySettings.highRiskMultiplier]}
                          onValueChange={([value]) =>
                            setMaterialitySettings((prev) => ({
                              ...prev,
                              highRiskMultiplier: value,
                              preset: "custom",
                            }))
                          }
                          max={1}
                          min={0.1}
                          step={0.05}
                          className="mb-4"
                        />
                        <div className="text-xs text-gray-500">
                          Reduces thresholds for high-risk areas (lower = more
                          sensitive)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Impact Analysis */}
                <div className="mt-8 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                  <h5 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-slate-600" />
                    Configuration Impact Analysis
                  </h5>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-white rounded-xl border border-blue-100">
                      <div className="text-2xl font-bold text-blue-600">
                        $
                        {(
                          materialitySettings.performanceMateriality *
                          materialitySettings.highRiskMultiplier
                        ).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        High-Risk Threshold
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl border border-green-100">
                      <div className="text-2xl font-bold text-green-600">
                        {getRiskCoverageEstimate()}%
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Est. Coverage
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl border border-amber-100">
                      <div className="text-2xl font-bold text-amber-600">
                        {Math.round(
                          materialitySettings.overallMateriality /
                            materialitySettings.trivialThreshold,
                        )}
                        x
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Sensitivity Range
                      </div>
                    </div>
                    <div className="text-center p-4 bg-white rounded-xl border border-purple-100">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.round(
                          100 - materialitySettings.highRiskMultiplier * 100,
                        )}
                        %
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        Risk Adjustment
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Recalculation Button */}
                <div className="mt-8 flex justify-center">
                  <Button
                    onClick={handleRecalculate}
                    disabled={isRecalculating}
                    className={`px-12 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white rounded-2xl flex items-center space-x-3 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 disabled:opacity-70 disabled:transform-none ${
                      isRecalculating ? "animate-pulse" : ""
                    }`}
                  >
                    {isRecalculating ? (
                      <>
                        <RefreshCw className="h-6 w-6 animate-spin" />
                        <span className="text-lg font-semibold">
                          AI Recalculating Risk Matrix...
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-6 w-6" />
                        <span className="text-lg font-semibold">
                          Apply AI Risk Recalculation
                        </span>
                        <Calculator className="h-6 w-6" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            key={`control-effectiveness-${recalculationTrigger}`}
            title="Control Effectiveness Score"
            value={`${Math.round(currentStats.controlEffectivenessScore)}%`}
            subtitle="Weighted average across all controls"
            icon={Shield}
            trend={currentStats.controlEffectivenessScore >= 85 ? "up" : "down"}
            trendValue={`${currentStats.controlEffectivenessScore >= 85 ? "Above" : "Below"} target (85%)`}
          />

          <StatCard
            key={`active-violations-${recalculationTrigger}`}
            title="Active Violations"
            value={currentStats.activeViolations}
            subtitle="Requiring immediate attention"
            icon={AlertTriangle}
            trend={
              currentStats.riskTrend === "DOWN"
                ? "down"
                : currentStats.riskTrend === "UP"
                  ? "up"
                  : "stable"
            }
            trendValue={trendIndicator.text}
          />

          <StatCard
            key={`high-risk-violations-${recalculationTrigger}`}
            title="High-Risk Violations"
            value={currentStats.highRiskViolations}
            subtitle="Critical & High severity"
            icon={TrendingUp}
            trend={currentStats.highRiskViolations <= 5 ? "down" : "up"}
            trendValue={`${currentStats.highRiskViolations <= 5 ? "Within" : "Above"} acceptable range`}
          />

          <StatCard
            key={`avg-resolution-${recalculationTrigger}`}
            title="Avg Resolution Time"
            value={`${currentStats.avgResolutionTime}h`}
            subtitle="Hours to resolve violations"
            icon={Clock}
            trend={currentStats.avgResolutionTime <= 24 ? "down" : "up"}
            trendValue={`${currentStats.avgResolutionTime <= 24 ? "Meeting" : "Missing"} SLA (24h)`}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <EnhancedStatCard
            key={`employees-${recalculationTrigger}`}
            title="Total Employees Monitored"
            value={currentStats.totalEmployees}
            subtitle="Active employees under monitoring"
            icon={Users}
            className="md:col-span-1"
            isClickable={true}
            linkText="View employees"
            onClick={() => setIsEmployeesModalOpen(true)}
          />

          <EnhancedStatCard
            key={`transactions-${recalculationTrigger}`}
            title="Transactions Analyzed"
            value={currentStats.totalTransactions.toLocaleString()}
            subtitle="Total transactions in system"
            icon={Activity}
            className="md:col-span-1"
            isClickable={true}
            linkText="View transactions"
            onClick={() => setIsTransactionsModalOpen(true)}
          />

          <StatCard
            key={`compliance-rate-${recalculationTrigger}`}
            title="Compliance Rate"
            value={`${currentStats.complianceRate}%`}
            subtitle="Overall policy compliance"
            icon={CheckCircle}
            trend={currentStats.complianceRate >= 95 ? "up" : "stable"}
            trendValue={`${currentStats.complianceRate >= 95 ? "Excellent" : "Good"} compliance`}
            className="md:col-span-1"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EnhancedTrendChart
            title="Violations Trend"
            color="#60B5FF"
            height={350}
            metric="violations"
            onRangeChange={handleRangeChange}
          />

          <CustomPieChart
            key={`severity-chart-${recalculationTrigger}`}
            data={severityData}
            title="Violation Severity Distribution"
            height={350}
          />
        </div>

        {/* Risk Analysis */}
        <div className="grid grid-cols-1 gap-6">
          <RiskHeatmap
            key={`risk-heatmap-${recalculationTrigger}`}
            data={riskHeatmapData}
            title="Department Risk Assessment"
            height={400}
          />
        </div>

        {/* Quick Insights */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 rounded-t-lg">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              AI-Generated Insights & Recommendations
            </h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 border-l-4 border-l-blue-500 consistent-radius">
                  <h4 className="font-medium text-gray-900">
                    Control Performance
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Control effectiveness at{" "}
                    {Math.round(currentStats.controlEffectivenessScore)}%
                    {currentStats.controlEffectivenessScore >= 85
                      ? " exceeds target benchmark"
                      : " requires improvement"}
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 border-l-4 border-l-amber-500 consistent-radius">
                  <h4 className="font-medium text-gray-900">
                    Resolution Efficiency
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Average resolution time of {currentStats.avgResolutionTime}h
                    is
                    {currentStats.avgResolutionTime <= 24
                      ? " within"
                      : " exceeding"}{" "}
                    SLA requirements
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 border-l-4 border-l-green-500">
                  <h4 className="font-medium text-gray-900">
                    Materiality Impact
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Current settings provide {getRiskCoverageEstimate()}% risk
                    coverage with
                    {materialitySettings.preset} materiality profile
                  </p>
                </div>

                <div className="bg-red-50 border border-red-100 rounded-lg p-4 border-l-4 border-l-red-500 consistent-radius">
                  <h4 className="font-medium text-gray-900">
                    Priority Actions
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {currentStats.highRiskViolations} high-risk violations
                    require immediate investigation and remediation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Modals with Materiality Context */}
        <TransactionsModal
          isOpen={isTransactionsModalOpen}
          onClose={() => setIsTransactionsModalOpen(false)}
          materialitySettings={materialitySettings}
          recalculationTrigger={recalculationTrigger}
        />

        <EmployeesModal
          isOpen={isEmployeesModalOpen}
          onClose={() => setIsEmployeesModalOpen(false)}
          materialitySettings={materialitySettings}
          recalculationTrigger={recalculationTrigger}
        />
      </div>
    </MaterialityContext.Provider>
  );
}
