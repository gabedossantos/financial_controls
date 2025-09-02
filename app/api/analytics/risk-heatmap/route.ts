import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { StatisticalAnalysisEngine } from "@/lib/statistical-analysis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get departments with their employees and violations
  type Violation = { violationType: string };
  type Employee = { isActive: boolean; violations: Violation[] };
  type Department = { name: string; employees: Employee[] };

  const departments: Department[] = await prisma.department.findMany({
      include: {
        employees: {
          include: {
            violations: {
              where: {
                detectedAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                },
              },
            },
          },
        },
      },
    });

    const riskHeatmapData = departments.map((department: Department) => {
      const activeEmployees = department.employees.filter((e: Employee) => e.isActive);
      const allViolations = activeEmployees.flatMap((e: Employee) => e.violations);

      // Calculate department risk score
  const violationCounts = activeEmployees.map((e: Employee) => e.violations.length);
      const avgViolations =
        violationCounts.length > 0
          ? StatisticalAnalysisEngine.calculateMean(violationCounts)
          : 0;

      const riskScore = StatisticalAnalysisEngine.calculateRiskScore({
        transactionVolume: activeEmployees.length * 10, // Simulated based on employee count
        roleConflicts: allViolations.filter(
          (v: Violation) => v.violationType === "SOD_ROLE_CONFLICT",
        ).length,
        anomalyScore: avgViolations * 2,
        temporalViolations: allViolations.filter(
          (v: Violation) => v.violationType === "SOD_TEMPORAL",
        ).length,
        previousViolations: allViolations.length,
      });

      return {
        department: department.name,
        riskScore: Math.round(riskScore * 10) / 10,
        violationCount: allViolations.length,
        employeeCount: activeEmployees.length,
      };
    });

    return NextResponse.json(riskHeatmapData);
  } catch (error) {
    console.error("Risk heatmap API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch risk heatmap data" },
      { status: 500 },
    );
  }
}
