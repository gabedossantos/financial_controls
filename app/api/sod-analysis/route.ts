import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { StatisticalAnalysisEngine } from "@/lib/statistical-analysis";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { employeeId, timeWindowHours = 72 } = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required" },
        { status: 400 },
      );
    }

    // Get employee with role information
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        role: true,
        department: true,
        transactions: {
          orderBy: { timestamp: "desc" },
          take: 500, // Last 500 transactions for analysis
        },
        violations: {
          where: {
            detectedAt: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // Analyze temporal violations
    const allEmployees = await prisma.employee.findMany({
      include: { role: true },
    });

    // Convert Prisma transaction data to match interface
  const transactionData = employee.transactions.map((t: any) => ({
      ...t,
      amount: t.amount ?? undefined,
      systemId: t.systemId ?? undefined,
      ipAddress: t.ipAddress ?? undefined,
    }));

    const temporalViolations =
      StatisticalAnalysisEngine.detectTemporalViolations(
        transactionData,
        allEmployees,
        timeWindowHours,
      );

    // Calculate risk score
    const riskScore = StatisticalAnalysisEngine.calculateRiskScore({
      transactionVolume: employee.transactions.length,
      roleConflicts: employee.role?.conflictingRoles.length ?? 0,
      anomalyScore: employee.riskScore,
      temporalViolations: temporalViolations.length,
      previousViolations: employee.violations.length,
    });

    // Analyze user behavior patterns
    const behaviorAnalysis =
      StatisticalAnalysisEngine.analyzeUserBehavior(transactionData);

    // Generate pattern insights
    const patterns = [];

    if (temporalViolations.length > 0) {
      patterns.push(
        `Detected ${temporalViolations.length} temporal SoD violations in recent activity`,
      );
    }

    if (behaviorAnalysis.anomalies.length > 0) {
      patterns.push(
        `Identified ${behaviorAnalysis.anomalies.length} behavioral anomalies`,
      );
    }

    if (
      employee.transactions.length >
      behaviorAnalysis.baselineProfile.avgTransactionsPerDay * 50
    ) {
      patterns.push(
        "Transaction volume significantly above departmental average",
      );
    }

    if (
      employee.role?.conflictingRoles.length &&
      employee.role.conflictingRoles.length > 0
    ) {
      patterns.push(
        `Role has ${employee.role.conflictingRoles.length} known conflicting role(s)`,
      );
    }

    const result = {
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        employeeId: employee.employeeId,
        email: employee.email,
        department: employee.department?.name,
        role: employee.role?.name,
        riskScore: employee.riskScore,
      },
      analysis: {
        riskScore: Math.round(riskScore * 10) / 10,
        temporalViolations,
        existingViolations: employee.violations,
        patterns,
        behaviorAnalysis,
        recommendations: [
          ...(temporalViolations.length > 0
            ? ["Review and address temporal SoD violations immediately"]
            : []),
          ...(riskScore > 7
            ? ["Implement additional monitoring for high-risk activities"]
            : []),
          ...(behaviorAnalysis.anomalies.length > 0
            ? ["Investigate unusual behavior patterns"]
            : []),
          ...(patterns.length === 0
            ? ["Continue normal monitoring procedures"]
            : []),
        ],
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("SoD analysis error:", error);
    return NextResponse.json(
      { error: "Failed to perform SoD analysis" },
      { status: 500 },
    );
  }
}
