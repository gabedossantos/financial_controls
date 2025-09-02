"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  Users,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { TrendChart } from "@/components/charts/trend-chart";

interface Violation {
  id: string;
  violationId: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeId: string;
    email: string;
    department: { name: string };
    role: { name: string };
  };
  violationType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  description: string;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "FALSE_POSITIVE";
  detectedAt: string;
  resolvedAt?: string;
}

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: { name: string };
  role: { name: string };
  riskScore: number;
  riskLevel: "MINIMAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  violationCount: number;
}

export default function SODMonitoring() {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [violationsTotal, setViolationsTotal] = useState<number>(0);
  const [employeesTotal, setEmployeesTotal] = useState<number>(0);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"violations" | "employees">(
    "violations",
  );

  // Filters
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    Promise.all([fetchViolations(), fetchEmployees(), fetchTrendData()]).then(
      () => setLoading(false),
    );
  }, [severityFilter, statusFilter, departmentFilter, searchTerm]);

  const fetchViolations = async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        ...(severityFilter !== "ALL" && { severity: severityFilter }),
        ...(statusFilter !== "ALL" && { status: statusFilter }),
      });

      const response = await fetch(`/api/violations?${params}`);
      const data = await response.json();
      setViolations(data.violations || []);
      setViolationsTotal(
        data.pagination?.totalCount ?? (data.violations?.length || 0),
      );
    } catch (error) {
      console.error("Failed to fetch violations:", error);
      setViolations([]);
      setViolationsTotal(0);
    }
  };

  const fetchEmployees = async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "20",
        ...(departmentFilter !== "ALL" && { department: departmentFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/employees?${params}`);
      const data = await response.json();
      setEmployees(data.employees || []);
      setEmployeesTotal(
        data.pagination?.totalCount ?? (data.employees?.length || 0),
      );
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployees([]);
      setEmployeesTotal(0);
    }
  };

  const fetchTrendData = async () => {
    try {
      const response = await fetch(
        "/api/analytics/trends?days=30&metric=violations",
      );
      const data = await response.json();
      setTrendData(data.trendData || []);
    } catch (error) {
      console.error("Failed to fetch trend data:", error);
      setTrendData([]);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "text-red-700 bg-red-50 border-red-200";
      case "HIGH":
        return "text-orange-700 bg-orange-50 border-orange-200";
      case "MEDIUM":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "LOW":
        return "text-green-700 bg-green-50 border-green-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OPEN":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "INVESTIGATING":
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case "RESOLVED":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "FALSE_POSITIVE":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "CRITICAL":
        return "text-red-800 bg-red-100 border-red-200";
      case "HIGH":
        return "text-red-700 bg-red-50 border-red-200";
      case "MEDIUM":
        return "text-yellow-700 bg-yellow-50 border-yellow-200";
      case "LOW":
        return "text-green-700 bg-green-50 border-green-200";
      case "MINIMAL":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeViolations = violations.filter(
    (v) => v.status === "OPEN" || v.status === "INVESTIGATING",
  ).length;
  const criticalViolations = violations.filter(
    (v) => v.severity === "CRITICAL",
  ).length;
  const highRiskEmployees = employees.filter(
    (e) => e.riskLevel === "HIGH" || e.riskLevel === "CRITICAL",
  ).length;
  const avgRiskScore =
    employees.length > 0
      ? employees.reduce((sum, emp) => sum + (emp.riskScore ?? 0), 0) /
        employees.length
      : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Segregation of Duties Monitoring
            </h1>
            <p className="text-purple-100 text-lg">
              Advanced detection and analysis of SoD violations and control
              conflicts
            </p>
          </div>
          <div className="text-right">
            <p className="text-purple-100 text-sm">Real-time Analysis</p>
            <p className="text-white font-semibold">
              {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Violations"
          value={activeViolations}
          subtitle="Open & Under Investigation"
          icon={AlertTriangle}
          trend={activeViolations <= 10 ? "down" : "up"}
          trendValue={`${activeViolations <= 10 ? "Within" : "Above"} threshold`}
        />

        <StatCard
          title="Critical Violations"
          value={criticalViolations}
          subtitle="Requiring immediate action"
          icon={TrendingUp}
          trend={criticalViolations === 0 ? "down" : "up"}
          trendValue={
            criticalViolations === 0 ? "No critical issues" : "Needs attention"
          }
        />

        <StatCard
          title="High-Risk Employees"
          value={highRiskEmployees}
          subtitle="Risk score > 7.0"
          icon={Users}
          trend={highRiskEmployees <= 5 ? "down" : "up"}
          trendValue={`${Math.round((highRiskEmployees / employees.length) * 100)}% of workforce`}
        />

        <StatCard
          title="Average Risk Score"
          value={avgRiskScore.toFixed(1)}
          subtitle="Enterprise-wide average"
          icon={Shield}
          trend={
            avgRiskScore <= 4 ? "down" : avgRiskScore >= 6 ? "up" : "stable"
          }
          trendValue={
            avgRiskScore <= 4
              ? "Low risk"
              : avgRiskScore >= 6
                ? "Elevated risk"
                : "Moderate risk"
          }
        />
      </div>

      {/* Trend Chart */}
      <TrendChart
        data={trendData}
        title="Violation Detection Trend (30 Days)"
        color="#8B5CF6"
        height={300}
      />

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("violations")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "violations"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Violations ({violationsTotal})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab("employees")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "employees"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Risk Profiles ({employeesTotal})</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Filters */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {activeTab === "violations" ? (
              <>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL">All Severities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="FALSE_POSITIVE">False Positive</option>
                </select>
              </>
            ) : (
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Departments</option>
                <option value="Finance">Finance</option>
                <option value="Information Technology">IT</option>
                <option value="Human Resources">HR</option>
                <option value="Operations">Operations</option>
                <option value="Procurement">Procurement</option>
              </select>
            )}

            <div className="flex items-center text-sm text-gray-500">
              <Filter className="h-4 w-4 mr-1" />
              <span>
                {activeTab === "violations" ? violationsTotal : employeesTotal}{" "}
                results
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "violations" ? (
            <div className="space-y-4">
              {violations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No violations found matching the current filters.</p>
                </div>
              ) : (
                violations.map((violation) => (
                  <div
                    key={violation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(violation.status)}
                          <h3 className="font-medium text-gray-900">
                            {violation.violationId}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-md border ${getSeverityColor(violation.severity)}`}
                          >
                            {violation.severity}
                          </span>
                          <span className="text-sm text-gray-500">
                            Risk Score: {violation.riskScore.toFixed(1)}
                          </span>
                        </div>

                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            {violation.description}
                          </p>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">
                              Employee:
                            </span>
                            <p className="text-gray-600">
                              {violation.employee.firstName}{" "}
                              {violation.employee.lastName} (
                              {violation.employee.employeeId})
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Department:
                            </span>
                            <p className="text-gray-600">
                              {violation.employee.department.name}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Detected:
                            </span>
                            <p className="text-gray-600">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {new Date(
                                violation.detectedAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {employees.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No employees found matching the current filters.</p>
                </div>
              ) : (
                employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </h3>
                          <span className="text-sm text-gray-500">
                            ({employee.employeeId})
                          </span>
                          <span
                            className={`px-2 py-1 text-xs rounded-md border ${getRiskLevelColor(employee.riskLevel)}`}
                          >
                            {employee.riskLevel} RISK
                          </span>
                          <span className="text-sm text-gray-500">
                            Score: {(employee.riskScore ?? 0).toFixed(1)}/10
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">
                              Department:
                            </span>
                            <p className="text-gray-600">
                              {employee.department.name}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Role:
                            </span>
                            <p className="text-gray-600">
                              {employee.role.name}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">
                              Active Violations:
                            </span>
                            <p className="text-gray-600">
                              {employee.violationCount ?? 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
