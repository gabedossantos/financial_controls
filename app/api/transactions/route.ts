import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { safeParseMateriality } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");
    const actionType = searchParams.get("type");
    const riskLevel = searchParams.get("riskLevel");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { description: { contains: search, mode: "insensitive" } },
        { transactionId: { contains: search, mode: "insensitive" } },
        {
          employee: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { employeeId: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    if (actionType && actionType !== "ALL") {
      where.action = actionType;
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          employee: {
            include: {
              department: true,
              role: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Validate & coerce materiality params
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

    // Enhanced ML-based risk assessment with materiality
    const enhancedTransactions = transactions
      .map((transaction: any) => {
            const amount = transaction.amount || 0;
        const employeeName = `${transaction.employee.firstName} ${transaction.employee.lastName}`;
        const departmentName =
          transaction.employee.department?.name || "Unknown";

        // ML-Enhanced Risk Calculation
        let riskScore = 1;
        let riskLevel = "LOW";
        let mlAnalysis = {
          isolationForestScore: 0,
          clusterDeviation: 0,
          behaviorAnomaly: 0,
          materialityImpact: "IMMATERIAL",
        };

        // 1. Materiality Assessment
        let materialityAdjustedThreshold = performanceMateriality;
        if (
          ["PAYMENT_APPROVE", "VENDOR_CREATE", "CASH_TRANSFER"].includes(
            transaction.action,
          )
        ) {
          materialityAdjustedThreshold =
            performanceMateriality * highRiskMultiplier;
        }

        // 2. Enhanced Risk Scoring with ML simulation
        if (amount >= overallMateriality) {
          riskScore = 9;
          riskLevel = "CRITICAL";
          mlAnalysis.materialityImpact = "MATERIAL";
          mlAnalysis.isolationForestScore = 0.9; // Highly anomalous
        } else if (amount >= materialityAdjustedThreshold) {
          riskScore = 7;
          riskLevel = "HIGH";
          mlAnalysis.materialityImpact = "SIGNIFICANT";
          mlAnalysis.isolationForestScore = 0.7;
        } else if (transaction.action === "PAYMENT_APPROVE" && amount > 10000) {
          riskScore = 6;
          riskLevel = "HIGH";
          mlAnalysis.behaviorAnomaly = 0.6; // Moderate anomaly
        } else if (transaction.action === "VENDOR_CREATE") {
          riskScore = 4;
          riskLevel = "MEDIUM";
          mlAnalysis.clusterDeviation = 0.4; // Expected for role
        } else if (amount > 5000) {
          riskScore = 3;
          riskLevel = "MEDIUM";
        } else if (amount <= trivialThreshold) {
          riskScore = 1;
          riskLevel = "TRIVIAL";
          mlAnalysis.materialityImpact = "TRIVIAL";
        }

        // 3. Pattern Recognition Adjustments
        const timestamp = new Date(transaction.timestamp);
        const hour = timestamp.getHours();

        // After-hours activity increases risk
        if (hour < 7 || hour > 19) {
          riskScore += 1;
          mlAnalysis.behaviorAnomaly += 0.2;
          if (riskScore >= 6) riskLevel = "HIGH";
          else if (riskScore >= 4) riskLevel = "MEDIUM";
        }

        // High-frequency user activity (simulated)
        const userTransactionCount = transactions.filter(
          (t: any) =>
            t.employeeId === transaction.employeeId &&
            new Date(t.timestamp).toDateString() === timestamp.toDateString(),
        ).length;

        if (userTransactionCount > 15) {
          riskScore += 1;
          mlAnalysis.clusterDeviation += 0.3;
        }

        return {
          ...transaction,
          riskScore: Math.min(riskScore, 10), // Cap at 10
          riskLevel,
          employeeName,
          departmentName,
          mlAnalysis,
          materialityContext: {
            overallMateriality,
            performanceMateriality,
            trivialThreshold,
            adjustedThreshold: materialityAdjustedThreshold,
            impact: mlAnalysis.materialityImpact,
          },
        };
      })
    .filter((transaction: any) => {
        if (!riskLevel || riskLevel === "ALL") return true;
        return transaction.riskLevel === riskLevel;
      });

    return NextResponse.json({
      transactions: enhancedTransactions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
            totalAmount: transactions.reduce((sum: any, t: any) => sum + (t.amount || 0), 0),
         actionTypes: [...new Set(transactions.map((t: any) => t.action))],
  // ...existing code...
           riskDistribution: {
             HIGH: enhancedTransactions.filter((t: any) => t.riskLevel === "HIGH").length,
             MEDIUM: enhancedTransactions.filter((t: any) => t.riskLevel === "MEDIUM").length,
             LOW: enhancedTransactions.filter((t: any) => t.riskLevel === "LOW").length,
           },
      },
    });
  } catch (error) {
    console.error("Transactions API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
