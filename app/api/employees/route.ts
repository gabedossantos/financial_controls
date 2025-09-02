import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { safeParseMateriality } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const department = searchParams.get("department");
    const search = searchParams.get("search");
    const riskLevel = searchParams.get("riskLevel");

    // Validate & coerce materiality thresholds
    const materiality = safeParseMateriality(request.url);
    if (!materiality.success) {
      return NextResponse.json(
        { error: "Invalid materiality parameters", details: materiality.error },
        { status: 400 },
      );
    }
    const {
      overallMateriality,
      performanceMateriality,
      trivialThreshold,
      highRiskMultiplier,
    } = materiality.data;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { isActive: true };

    if (department && department !== "ALL") {
      where.department = { name: department };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { employeeId: { contains: search, mode: "insensitive" } },
        { department: { name: { contains: search, mode: "insensitive" } } },
        { role: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [employees, totalCount] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          department: true,
          role: true,
          violations: {
            where: {
              status: { in: ["OPEN", "INVESTIGATING"] },
            },
          },
          transactions: {
            orderBy: { timestamp: "desc" },
            take: 50, // Get more transactions for better analysis
          },
        },
        orderBy: { riskScore: "desc" },
        skip,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    // Enhanced ML-based employee risk assessment with materiality considerations
    const enhancedEmployees = employees
  .map((employee: any) => {
        const violations = employee.violations || [];
        const transactions = employee.transactions || [];

        // Calculate total transaction volume for materiality assessment
        const totalTransactionAmount = transactions.reduce(
          (sum: number, t: any) => sum + (t.amount || 0),
          0,
        );
        const avgTransactionAmount =
          transactions.length > 0
            ? totalTransactionAmount / transactions.length
            : 0;
        const transactionCount = transactions.length;

        // ML-Enhanced Risk Calculation
        let riskScore = 1;
        let riskLevel = "MINIMAL";
        let mlAnalysis = {
          materialityExposure: 0,
          behaviorAnomaly: 0,
          volumeAnomaly: 0,
          roleRiskMultiplier: 1,
          violationTrend: "STABLE",
        };

        // 1. Materiality-based Risk Assessment
        if (totalTransactionAmount >= overallMateriality) {
          riskScore += 4;
          mlAnalysis.materialityExposure = 0.9;
        } else if (totalTransactionAmount >= performanceMateriality) {
          riskScore += 2;
          mlAnalysis.materialityExposure = 0.6;
        } else if (totalTransactionAmount > trivialThreshold) {
          riskScore += 1;
          mlAnalysis.materialityExposure = 0.3;
        }

        // 2. Role-based Risk Multiplier
        const roleName = employee.role?.name || "";
        const permissions = employee.role?.permissions || [];

        if (
          ["FINANCE_MANAGER", "ACCOUNTING_MANAGER", "CFO"].includes(roleName)
        ) {
          mlAnalysis.roleRiskMultiplier = 1.5;
          riskScore += 2;
        } else if (["APPROVER", "SENIOR_ACCOUNTANT"].includes(roleName)) {
          mlAnalysis.roleRiskMultiplier = 1.3;
          riskScore += 1;
        } else if (
          permissions.includes("PAYMENT_APPROVE") ||
          permissions.includes("VENDOR_CREATE")
        ) {
          mlAnalysis.roleRiskMultiplier = 1.2;
          riskScore += 1;
        }

        // 3. Violation Pattern Analysis
        const violationCount = violations.length;
        const sodViolations = violations.filter(
          (v: any) => v.violationType === "SOD_VIOLATION",
        ).length;
        const temporalViolations = violations.filter(
          (v: any) => v.violationType === "SOD_TEMPORAL",
        ).length;

        if (violationCount >= 5) {
          riskScore += 3;
          mlAnalysis.violationTrend = "INCREASING";
        } else if (violationCount >= 3) {
          riskScore += 2;
          mlAnalysis.violationTrend = "CONCERNING";
        } else if (violationCount > 0) {
          riskScore += 1;
          mlAnalysis.violationTrend = "MONITORED";
        }

        // 4. Transaction Behavior Analysis
        if (transactionCount > 100) {
          riskScore += 1;
          mlAnalysis.volumeAnomaly = 0.7;
        } else if (transactionCount > 50) {
          mlAnalysis.volumeAnomaly = 0.4;
        }

        // High-value individual transactions
        const highValueTransactions = transactions.filter(
          (t: any) => (t.amount || 0) >= performanceMateriality * highRiskMultiplier,
        ).length;

        if (highValueTransactions > 10) {
          riskScore += 2;
          mlAnalysis.behaviorAnomaly = 0.8;
        } else if (highValueTransactions > 5) {
          riskScore += 1;
          mlAnalysis.behaviorAnomaly = 0.5;
        }

        // 5. Temporal Pattern Analysis (simulated)
  const recentTransactions = transactions.filter((t: any) => {
          const transactionDate = new Date(t.timestamp);
          const daysSince =
            (Date.now() - transactionDate.getTime()) / (1000 * 60 * 60 * 24);
          return daysSince <= 30;
        });

        if (recentTransactions.length > transactions.length * 0.8) {
          // High recent activity
          riskScore += 1;
          mlAnalysis.behaviorAnomaly += 0.2;
        }

        // Cap risk score and determine final level
        riskScore = Math.min(riskScore * mlAnalysis.roleRiskMultiplier, 10);

        if (riskScore >= 8) {
          riskLevel = "CRITICAL";
        } else if (riskScore >= 6) {
          riskLevel = "HIGH";
        } else if (riskScore >= 4) {
          riskLevel = "MEDIUM";
        } else if (riskScore >= 2) {
          riskLevel = "LOW";
        } else {
          riskLevel = "MINIMAL";
        }

        return {
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.email || "", // Use email as fallback since phone doesn't exist
          hireDate: employee.startDate,
          department: employee.department,
          role: employee.role,
          violationCount: violationCount,
          totalTransactionAmount,
          avgTransactionAmount: Math.round(avgTransactionAmount),
          transactionCount,
          riskScore: Math.round(riskScore * 10) / 10,
          riskLevel,
          mlAnalysis,
          materialityContext: {
            overallMateriality,
            performanceMateriality,
            trivialThreshold,
            highRiskMultiplier,
            exposure: mlAnalysis.materialityExposure,
          },
        };
      })
  .filter((employee: any) => {
        if (!riskLevel || riskLevel === "ALL") return true;
        return employee.riskLevel === riskLevel;
      });

    return NextResponse.json({
      employees: enhancedEmployees,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalEmployees: enhancedEmployees.length,
        riskDistribution: {
          CRITICAL: enhancedEmployees.filter((e: any) => e.riskLevel === "CRITICAL")
            .length,
          HIGH: enhancedEmployees.filter((e: any) => e.riskLevel === "HIGH").length,
          MEDIUM: enhancedEmployees.filter((e: any) => e.riskLevel === "MEDIUM")
            .length,
          LOW: enhancedEmployees.filter((e: any) => e.riskLevel === "LOW").length,
          MINIMAL: enhancedEmployees.filter((e: any) => e.riskLevel === "MINIMAL")
            .length,
        },
        totalTransactionVolume: enhancedEmployees.reduce(
          (sum: number, e: any) => sum + e.totalTransactionAmount,
          0,
        ),
        totalViolations: enhancedEmployees.reduce(
          (sum: number, e: any) => sum + e.violationCount,
          0,
        ),
      },
    });
  } catch (error) {
    console.error("Employees API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employees" },
      { status: 500 },
    );
  }
}
