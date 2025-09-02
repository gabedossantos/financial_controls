export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  roleId: string;
  manager?: string | null;
  startDate: Date;
  isActive: boolean;
  riskScore: number;
  department?: Department;
  role?: Role;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  headCount: number;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  riskLevel: number;
  conflictingRoles: string[];
  permissions: string[];
}

export interface Transaction {
  id: string;
  transactionId: string;
  employeeId: string;
  action: string;
  category: string;
  amount?: number | null;
  description: string;
  systemId?: string | null;
  ipAddress?: string | null;
  timestamp: Date;
  metadata?: any;
  employee?: Employee;
}

export interface Violation {
  id: string;
  violationId: string;
  employeeId: string;
  violationType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  riskScore: number;
  description: string;
  detectionMethod: string;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "FALSE_POSITIVE";
  detectedAt: Date;
  resolvedAt?: Date;
  resolutionNotes?: string;
  relatedTransactions: string[];
  employee?: Employee;
}

export interface SystemMetric {
  id: string;
  metricName: string;
  metricValue: number;
  metricUnit?: string;
  category: string;
  recordedAt: Date;
  metadata?: any;
}

export interface DashboardStats {
  totalEmployees: number;
  totalTransactions: number;
  activeViolations: number;
  controlEffectivenessScore: number;
  highRiskViolations: number;
  avgResolutionTime: number;
  complianceRate: number;
  riskTrend: "UP" | "DOWN" | "STABLE";
}

export interface StatisticalAnalysis {
  zScore: number;
  standardDeviation: number;
  mean: number;
  percentile: number;
  isOutlier: boolean;
}

export interface SODAnalysisResult {
  violations: Violation[];
  riskScore: number;
  patterns: string[];
  temporalConflicts: TemporalConflict[];
}

export interface TemporalConflict {
  employeeId: string;
  conflictingActions: string[];
  timeWindow: number; // hours
  riskLevel: number;
  detectedAt: Date;
}

export interface RiskHeatmapData {
  department: string;
  riskScore: number;
  violationCount: number;
  employeeCount: number;
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}
