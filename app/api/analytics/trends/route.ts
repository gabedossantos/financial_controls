import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { StatisticalAnalysisEngine } from "@/lib/statistical-analysis";
import { safeParseTrendParams } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const parsed = safeParseTrendParams(request.url);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error },
        { status: 400 },
      );
    }
    const { days, metric } = parsed.data;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    if (metric === "violations") {
      // Get violations trend data
      const violations = await prisma.violation.findMany({
        where: {
          detectedAt: { gte: startDate },
        },
        orderBy: { detectedAt: "asc" },
      });

      // Group by day
      const trendData: { [key: string]: number } = {};

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split("T")[0];
        trendData[dateKey!] = 0;
      }

  violations.forEach((violation: { detectedAt: Date }) => {
        const dateKey = new Date(violation.detectedAt)
          .toISOString()
          .split("T")[0];
        if (dateKey && trendData[dateKey] !== undefined) {
          trendData[dateKey]++;
        }
      });

      const formattedData = Object.entries(trendData).map(([date, value]) => ({
        date,
        value,
        label: new Date(date).toLocaleDateString(),
      }));

      return NextResponse.json({ trendData: formattedData });
    } else if (metric === "transactions") {
      // Daily transaction counts
      const txns = await prisma.transaction.findMany({
        where: { timestamp: { gte: startDate } },
        orderBy: { timestamp: "asc" },
      });

      const trendData: { [key: string]: number } = {};
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split("T")[0]!;
        trendData[dateKey] = 0;
      }

      txns.forEach((t: { timestamp: Date }) => {
        const dateKey = new Date(t.timestamp).toISOString().split("T")[0]!;
        if (trendData[dateKey] !== undefined) trendData[dateKey]!++;
      });

      const formattedData = Object.entries(trendData).map(([date, value]) => ({
        date,
        value,
        label: new Date(date).toLocaleDateString(),
      }));

      return NextResponse.json({ trendData: formattedData });
    } else if (metric === "risk_scores") {
      // Get risk score trend data
  const employees = await prisma.employee.findMany({
        where: { isActive: true },
        include: {
          violations: {
            where: {
              detectedAt: { gte: startDate },
            },
          },
        },
      });

      // Calculate daily average risk scores
      const dailyRiskScores: { [key: string]: number[] } = {};

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toISOString().split("T")[0];
        dailyRiskScores[dateKey!] = [];

        employees.forEach((employee: { violations: Array<{ detectedAt: Date; violationType: string }> }) => {
          // Calculate risk score for this employee on this day
          const dayViolations = employee.violations.filter((v) => {
            const violationDate = new Date(v.detectedAt)
              .toISOString()
              .split("T")[0];
            return violationDate === dateKey;
          });

          const riskScore = StatisticalAnalysisEngine.calculateRiskScore({
            transactionVolume: Math.random() * 50, // Simulated
            roleConflicts: dayViolations.length,
            anomalyScore: dayViolations.length > 0 ? 5 : 1,
            temporalViolations: dayViolations.filter(
              (v) => v.violationType === "SOD_TEMPORAL",
            ).length,
            previousViolations: employee.violations.length,
          });

          dailyRiskScores[dateKey]?.push(riskScore);
        });
      }

      const formattedData = Object.entries(dailyRiskScores).map(
        ([date, scores]) => ({
          date,
          value:
            scores.length > 0
              ? StatisticalAnalysisEngine.calculateMean(scores)
              : 1,
          label: new Date(date).toLocaleDateString(),
        }),
      );

      return NextResponse.json({ trendData: formattedData });
    } else if (metric === "control_effectiveness") {
      // Get control effectiveness metrics
      const metrics = await prisma.systemMetric.findMany({
        where: {
          metricName: "CONTROL_EFFECTIVENESS_SCORE",
          recordedAt: { gte: startDate },
        },
        orderBy: { recordedAt: "asc" },
      });

  const formattedData = metrics.map((metric: { recordedAt: Date; metricValue: number }) => ({
        date: metric.recordedAt.toISOString().split("T")[0]!,
        value: metric.metricValue,
        label: new Date(metric.recordedAt).toLocaleDateString(),
      }));

      return NextResponse.json({ trendData: formattedData });
    }

    return NextResponse.json({ trendData: [] });
  } catch (error) {
    console.error("Trends API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trend data" },
      { status: 500 },
    );
  }
}
