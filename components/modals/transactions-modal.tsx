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
  Activity,
  DollarSign,
  Calendar,
  User,
  Building,
  Target,
} from "lucide-react";

interface Transaction {
  id: string;
  transactionId: string;
  description: string;
  action: string;
  amount: number | null;
  timestamp: string;
  employeeName: string;
  departmentName: string;
  riskLevel: string;
  riskScore: number;
  materialityContext?: {
    overallMateriality: number;
    performanceMateriality: number;
    trivialThreshold: number;
    adjustedThreshold: number;
    impact: string;
  };
}

interface TransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialitySettings?: any;
  recalculationTrigger?: number;
}

export function TransactionsModal({
  isOpen,
  onClose,
  materialitySettings,
  recalculationTrigger = 0,
}: TransactionsModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen, currentPage, searchTerm, recalculationTrigger]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        // Pass materiality settings to API
        ...(materialitySettings && {
          overallMateriality: materialitySettings.overallMateriality.toString(),
          performanceMateriality:
            materialitySettings.performanceMateriality.toString(),
          trivialThreshold: materialitySettings.trivialThreshold.toString(),
          highRiskMultiplier: materialitySettings.highRiskMultiplier.toString(),
        }),
      });

      const response = await fetch(`/api/transactions?${params}`);
      const data = await response.json();

      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      setTransactions([]);
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
      case "TRIVIAL":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getMaterialityBadgeColor = (impact: string) => {
    switch (impact) {
      case "MATERIAL":
        return "bg-red-100 text-red-700 border-red-200";
      case "SIGNIFICANT":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "IMMATERIAL":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "TRIVIAL":
        return "bg-gray-100 text-gray-600 border-gray-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] h-[95vh] overflow-hidden bg-white rounded-2xl shadow-2xl border-0 flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl"></div>
        <div className="relative z-10 h-full flex flex-col min-h-0">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 -mx-6 -mt-6 px-6 py-5 rounded-t-2xl">
            <DialogTitle className="flex items-center justify-between text-xl font-semibold text-white">
              <div className="flex items-center">
                <Activity className="h-6 w-6 mr-3" />
                Live Transaction Analysis ({totalCount.toLocaleString()})
              </div>
              {materialitySettings && (
                <div className="flex items-center space-x-2 text-sm">
                  <Target className="h-4 w-4" />
                  <span>
                    Materiality: $
                    {materialitySettings.overallMateriality.toLocaleString()}
                  </span>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 px-6 py-4 overflow-hidden flex flex-col min-h-0">
            {/* Search */}
            <div className="flex items-center space-x-4 mb-6 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions, employees, or transaction IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {materialitySettings && (
                <div className="text-xs bg-purple-50 border border-purple-200 px-3 py-2 rounded-xl">
                  <div className="font-medium text-purple-700">
                    Active Configuration
                  </div>
                  <div className="text-purple-600">
                    {materialitySettings.preset === "custom"
                      ? "Custom"
                      : materialitySettings.preset.charAt(0).toUpperCase() +
                        materialitySettings.preset.slice(1)}{" "}
                    Profile
                  </div>
                </div>
              )}
            </div>

            {/* Transactions List - Enhanced scrolling */}
            <div className="flex-1 overflow-y-auto min-h-0 scrollbar-enhanced">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-4 pr-2">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-blue-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-4">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                              {transaction.transactionId}
                            </h4>
                            <Badge
                              className={`${getRiskBadgeColor(transaction.riskLevel)} rounded-lg font-medium`}
                            >
                              {transaction.riskLevel} RISK
                            </Badge>
                            {transaction.materialityContext && (
                              <Badge
                                className={`${getMaterialityBadgeColor(transaction.materialityContext.impact)} rounded-lg font-medium`}
                              >
                                {transaction.materialityContext.impact}
                              </Badge>
                            )}
                            <span className="text-xs text-gray-500 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 font-medium">
                              {transaction.action}
                            </span>
                          </div>

                          <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                            {transaction.description}
                          </p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div className="flex items-center bg-green-50 px-3 py-2 rounded-xl border border-green-100">
                              <DollarSign className="h-3 w-3 mr-2 text-green-600" />
                              <span className="font-medium text-green-800">
                                {formatCurrency(transaction.amount)}
                              </span>
                            </div>
                            <div className="flex items-center bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                              <User className="h-3 w-3 mr-2 text-blue-600" />
                              <span className="text-blue-800">
                                {transaction.employeeName}
                              </span>
                            </div>
                            <div className="flex items-center bg-purple-50 px-3 py-2 rounded-xl border border-purple-100">
                              <Building className="h-3 w-3 mr-2 text-purple-600" />
                              <span className="text-purple-800">
                                {transaction.departmentName}
                              </span>
                            </div>
                            <div className="flex items-center bg-amber-50 px-3 py-2 rounded-xl border border-amber-100">
                              <Calendar className="h-3 w-3 mr-2 text-amber-600" />
                              <span className="text-amber-800">
                                {formatDate(transaction.timestamp)}
                              </span>
                            </div>
                          </div>

                          {/* Enhanced Materiality Context */}
                          {transaction.materialityContext && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                              <div className="text-center p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                                <div className="text-xs text-blue-600 font-medium">
                                  Threshold
                                </div>
                                <div className="text-xs font-semibold text-blue-800">
                                  $
                                  {transaction.materialityContext.adjustedThreshold.toLocaleString()}
                                </div>
                              </div>
                              <div className="text-center p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                                <div className="text-xs text-green-600 font-medium">
                                  Performance
                                </div>
                                <div className="text-xs font-semibold text-green-800">
                                  $
                                  {transaction.materialityContext.performanceMateriality.toLocaleString()}
                                </div>
                              </div>
                              <div className="text-center p-2 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                                <div className="text-xs text-amber-600 font-medium">
                                  Trivial
                                </div>
                                <div className="text-xs font-semibold text-amber-800">
                                  $
                                  {transaction.materialityContext.trivialThreshold.toLocaleString()}
                                </div>
                              </div>
                              <div className="text-center p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                                <div className="text-xs text-purple-600 font-medium">
                                  Overall
                                </div>
                                <div className="text-xs font-semibold text-purple-800">
                                  $
                                  {transaction.materialityContext.overallMateriality.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-4 border border-gray-200 shadow-sm">
                            <div className="text-xs text-gray-500 mb-2 font-medium">
                              AI Risk Score
                            </div>
                            <div
                              className={`text-2xl font-bold ${
                                transaction.riskScore >= 7
                                  ? "text-red-600"
                                  : transaction.riskScore >= 4
                                    ? "text-amber-600"
                                    : "text-green-600"
                              }`}
                            >
                              {transaction.riskScore}/10
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ML Enhanced
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced Pagination */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 -mx-6 px-6 py-4 rounded-b-2xl mt-4 flex-shrink-0">
              <div className="text-sm text-gray-600">
                Showing {Math.min((currentPage - 1) * 20 + 1, totalCount)} to{" "}
                {Math.min(currentPage * 20, totalCount)} of {totalCount}{" "}
                transactions
                {materialitySettings && (
                  <div className="text-xs text-purple-600 mt-1">
                    Filtered with{" "}
                    {materialitySettings.preset === "custom"
                      ? "Custom"
                      : materialitySettings.preset.charAt(0).toUpperCase() +
                        materialitySettings.preset.slice(1)}{" "}
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
