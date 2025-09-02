"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  Building,
  Mail,
  Phone,
  Calendar,
  Target,
  AlertTriangle,
} from "lucide-react";

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hireDate: string;
  department: {
    name: string;
  };
  role: {
    name: string;
    permissions: string[];
  };
  violationCount: number;
  totalTransactionAmount: number;
  riskLevel: string;
}

interface EmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialitySettings?: any;
  recalculationTrigger?: number;
}

export function EmployeesModal({
  isOpen,
  onClose,
  materialitySettings,
  recalculationTrigger = 0,
}: EmployeesModalProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen, currentPage, searchTerm, recalculationTrigger]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        // Pass materiality settings for enhanced risk calculation
        ...(materialitySettings && {
          overallMateriality: materialitySettings.overallMateriality.toString(),
          performanceMateriality:
            materialitySettings.performanceMateriality.toString(),
          trivialThreshold: materialitySettings.trivialThreshold.toString(),
          highRiskMultiplier: materialitySettings.highRiskMultiplier.toString(),
        }),
      });

      const response = await fetch(`/api/employees?${params}`);
      const data = await response.json();

      setEmployees(data.employees || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      setEmployees([]);
    }
    setLoading(false);
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "CRITICAL":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      case "MINIMAL":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] h-[95vh] overflow-hidden bg-white rounded-2xl shadow-2xl border-0 flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-teal-50 rounded-2xl"></div>
        <div className="relative z-10 h-full flex flex-col min-h-0">
          <DialogHeader className="bg-gradient-to-r from-green-600 to-teal-600 -mx-6 -mt-6 px-6 py-5 rounded-t-2xl">
            <DialogTitle className="flex items-center justify-between text-xl font-semibold text-white">
              <div className="flex items-center">
                <Users className="h-6 w-6 mr-3" />
                Employee Risk Analysis ({totalCount.toLocaleString()})
              </div>
              {materialitySettings && (
                <div className="flex items-center space-x-2 text-sm">
                  <Target className="h-4 w-4" />
                  <span>Risk Profile: {materialitySettings.preset}</span>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 px-6 py-4 overflow-hidden flex flex-col min-h-0">
            {/* Search */}
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, employee ID, department, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              {materialitySettings && (
                <div className="text-xs bg-green-50 border border-green-200 px-3 py-2 rounded-xl">
                  <div className="font-medium text-green-700">
                    Materiality Threshold
                  </div>
                  <div className="text-green-600">
                    ${materialitySettings.overallMateriality.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Employees List - Enhanced scrolling */}
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-enhanced">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-green-200"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900 truncate">
                              {employee.firstName} {employee.lastName}
                            </h4>
                            <Badge
                              className={`${getRiskBadgeColor(employee.riskLevel)} rounded-lg font-medium`}
                            >
                              {employee.riskLevel} RISK
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            ID: {employee.employeeId}
                          </div>
                          <div className="text-sm font-medium text-blue-600">
                            {employee.role.name} • {employee.department.name}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-xl p-3 border border-gray-200">
                            <div className="text-xs text-gray-500 mb-1 font-medium">
                              Violations
                            </div>
                            <div
                              className={`text-xl font-bold ${
                                employee.violationCount >= 5
                                  ? "text-red-600"
                                  : employee.violationCount >= 2
                                    ? "text-amber-600"
                                    : "text-green-600"
                              }`}
                            >
                              {employee.violationCount}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                          <Mail className="h-3 w-3 mr-2 text-blue-600" />
                          <span className="text-xs text-blue-800 truncate">
                            {employee.email}
                          </span>
                        </div>
                        <div className="flex items-center bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                          <Phone className="h-3 w-3 mr-2 text-green-600" />
                          <span className="text-xs text-green-800">
                            {employee.phone}
                          </span>
                        </div>
                        <div className="flex items-center bg-purple-50 px-3 py-2 rounded-xl border border-purple-100">
                          <Calendar className="h-3 w-3 mr-2 text-purple-600" />
                          <span className="text-xs text-purple-800">
                            {formatDate(employee.hireDate)}
                          </span>
                        </div>
                        <div className="flex items-center bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                          <Building className="h-3 w-3 mr-2 text-amber-600" />
                          <span className="text-xs text-amber-800">
                            {employee.department.name}
                          </span>
                        </div>
                      </div>

                      {/* Transaction Volume & Risk Indicators */}
                      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-semibold text-gray-700 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2 text-orange-500" />
                            Risk Analysis
                          </h5>
                          <div className="text-right">
                            <div className="text-xs text-gray-500">
                              Transaction Volume
                            </div>
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(employee.totalTransactionAmount)}
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Risk Metrics */}
                        {materialitySettings && (
                          <div className="grid grid-cols-3 gap-2">
                            <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                              <div className="text-xs text-gray-500">
                                vs Material
                              </div>
                              <div
                                className={`text-sm font-bold ${
                                  employee.totalTransactionAmount >=
                                  materialitySettings.overallMateriality
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {employee.totalTransactionAmount >=
                                materialitySettings.overallMateriality
                                  ? "HIGH"
                                  : "LOW"}
                              </div>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                              <div className="text-xs text-gray-500">
                                vs Performance
                              </div>
                              <div
                                className={`text-sm font-bold ${
                                  employee.totalTransactionAmount >=
                                  materialitySettings.performanceMateriality
                                    ? "text-amber-600"
                                    : "text-green-600"
                                }`}
                              >
                                {employee.totalTransactionAmount >=
                                materialitySettings.performanceMateriality
                                  ? "MED"
                                  : "LOW"}
                              </div>
                            </div>
                            <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                              <div className="text-xs text-gray-500">
                                Activity
                              </div>
                              <div
                                className={`text-sm font-bold ${
                                  employee.totalTransactionAmount <=
                                  materialitySettings.trivialThreshold
                                    ? "text-gray-600"
                                    : employee.totalTransactionAmount >=
                                        materialitySettings.performanceMateriality
                                      ? "text-red-600"
                                      : "text-blue-600"
                                }`}
                              >
                                {employee.totalTransactionAmount <=
                                materialitySettings.trivialThreshold
                                  ? "MIN"
                                  : employee.totalTransactionAmount >=
                                      materialitySettings.performanceMateriality
                                    ? "HIGH"
                                    : "MED"}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Permissions Overview */}
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="text-xs text-gray-500 mb-2">
                            Key Permissions
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {employee.role.permissions
                              .slice(0, 3)
                              .map((permission) => (
                                <span
                                  key={permission}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg border border-blue-200"
                                >
                                  {permission}
                                </span>
                              ))}
                            {employee.role.permissions.length > 3 && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
                                +{employee.role.permissions.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced Pagination */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 -mx-6 px-6 py-4 rounded-b-2xl mt-4">
              <div className="text-sm text-gray-600">
                Showing {Math.min((currentPage - 1) * 20 + 1, totalCount)} to{" "}
                {Math.min(currentPage * 20, totalCount)} of {totalCount}{" "}
                employees
                {materialitySettings && (
                  <div className="text-xs text-green-600 mt-1">
                    Risk assessment based on {materialitySettings.preset}{" "}
                    materiality profile
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border-gray-300"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-xl border-gray-300"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
