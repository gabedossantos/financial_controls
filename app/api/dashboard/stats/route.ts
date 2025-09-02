import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { StatisticalAnalysisEngine } from "@/lib/statistical-analysis";
import { safeParseMateriality } from "@/lib/validation";

export const dynamic = "force-dynamic";

async function retry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 150): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      // Known transient Prisma error code for connection resets
      const code = err?.code ?? err?.meta?.code;
      const isTransient = code === "P1017" || /Server has closed the connection/i.test(String(err?.message ?? ""));
      if (i < attempts - 1 && isTransient) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      else break;
    }
  }
  throw lastErr;
}

export async function GET(request: NextRequest) {
  try {
    // Materiality thresholds (query params with sensible defaults)
  const url = new URL(request.url);
    const parsed = safeParseMateriality(url.href);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid materiality parameters", details: parsed.error },
        { status: 400 },
      );
    }
    const {
      overallMateriality,
      performanceMateriality,
      trivialThreshold,
      highRiskMultiplier,
    } = parsed.data;
    const daysParam = url.searchParams.get("days");
    const windowDays = Math.max(
      1,
      Math.min(365, daysParam ? parseInt(daysParam, 10) : 30),
    );
    const highRiskThreshold =
      performanceMateriality * Math.max(0.1, Math.min(1, highRiskMultiplier));

    // Get current metrics
    const [
      totalEmployees,
      totalTransactions,
      baseActiveViolations,
      violationsLast30d,
      recentMetrics,
    ] = await Promise.all([
      retry(() => prisma.employee.count({ where: { isActive: true } })),
      retry(() => prisma.transaction.count()),
      retry(() =>
        prisma.violation.count({
          where: { status: { in: ["OPEN", "INVESTIGATING"] } },
        }),
      ),
      retry(() =>
        prisma.violation.findMany({
          where: {
            detectedAt: {
              gte: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000),
            },
          },
          include: { employee: true },
        }),
      ),
      retry(() =>
        prisma.systemMetric.findMany({
          where: {
            recordedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
          orderBy: { recordedAt: "desc" },
        }),
      ),
    ]);

    // Calculate control effectiveness score (weighted average of recent metrics)
    const controlEffectivenessMetrics = recentMetrics.filter(
      (m: { metricName: string }) => m.metricName === "CONTROL_EFFECTIVENESS_SCORE",
    );
    const controlEffectivenessScore =
      controlEffectivenessMetrics.length > 0
        ? StatisticalAnalysisEngine.calculateMean(
            controlEffectivenessMetrics.map((m: { metricValue: number }) => m.metricValue),
          )
        : 85.5;

    // Build a map of related transaction amounts for violations
    const relatedTxnIds = Array.from(
      new Set(
        violationsLast30d
          .flatMap((v: { relatedTransactions?: unknown[] | null }) => v.relatedTransactions || [])
          .filter(
            (id: unknown): id is string =>
              typeof id === "string" && id.length > 0,
          ),
      ),
    );

    let transactionsById = new Map<string, number | null>();
    if (relatedTxnIds.length > 0) {
  const txns = await retry(() => prisma.transaction.findMany({
        where: { transactionId: { in: relatedTxnIds } },
        select: { transactionId: true, amount: true },
  }));
      transactionsById = new Map(
        txns.map((t: { transactionId: string; amount: number | null }) => [t.transactionId, t.amount ?? null]),
      );
    }

    // Helper: get an effective amount for a violation based on its related transactions
    const getViolationAmount = (v: (typeof violationsLast30d)[number]) => {
      const ids = (v.relatedTransactions || []).filter(Boolean);
      if (ids.length === 0) return null;
      let maxAmt: number | null = null;
      for (const id of ids) {
        const amt = transactionsById.get(id) ?? null;
        if (typeof amt === "number") {
          maxAmt = maxAmt === null ? amt : Math.max(maxAmt, amt);
        }
      }
      return maxAmt;
    };

    // Recalculate active/high-risk violations with materiality thresholds from existing violations
  const recalculatedActiveViolations = violationsLast30d.filter((v: any) => {
      // Only consider unresolved/active states
      if (v.status !== "OPEN" && v.status !== "INVESTIGATING") return false;
      const effAmt = getViolationAmount(v);
      if (effAmt === null) {
        // Fallback: treat high severity as active if riskScore high
        return v.severity !== "LOW" && v.riskScore >= 6;
      }
      if (effAmt < trivialThreshold) return false; // inconsequential
      return effAmt >= performanceMateriality; // material under new threshold
    }).length;

  const recalculatedHighRiskViolations = violationsLast30d.filter((v: any) => {
      const effAmt = getViolationAmount(v);
      // High by severity OR by materiality under high-risk threshold
      const severityHigh = v.severity === "HIGH" || v.severity === "CRITICAL";
      const materialHigh =
        typeof effAmt === "number" ? effAmt >= highRiskThreshold : false;
      return severityHigh || materialHigh;
    }).length;

    // Analyze entire transactions table within the window to derive additional potential SoD violations
      let transactions: Array<{
        employeeId: string;
        action: string;
        amount: number | null;
        timestamp: Date;
      }> = [];
      try {
  transactions = await retry(() => prisma.transaction.findMany({
          select: {
            employeeId: true,
            action: true,
            amount: true,
            timestamp: true,
          },
  }));
      } catch (err) {
        transactions = [];
      }

    // Heuristic 1: High-value transactions above performance materiality
    const highValueDerived = transactions.filter((t) => {
      const amt = t.amount ?? 0;
      return amt >= performanceMateriality && amt >= trivialThreshold;
    }).length;

    // Heuristic 2: SoD conflict pairs within a temporal window per employee
    const perEmployeeMap = new Map<string, { [action: string]: number[] }>();
    for (const t of transactions) {
      const key = t.employeeId;
      const map = perEmployeeMap.get(key) ?? {};
      const arr = map[t.action] ?? [];
      arr.push(new Date(t.timestamp).getTime());
      map[t.action] = arr;
      if (!perEmployeeMap.has(key)) perEmployeeMap.set(key, map);
    }

    const DAY = 24 * 60 * 60 * 1000;
    function hasPairWithin(
      aTimes: number[] = [],
      bTimes: number[] = [],
      windowMs: number,
    ) {
      if (aTimes.length === 0 || bTimes.length === 0) return false;
      // Two-pointer check assuming arrays are small; sort for safety
      aTimes.sort((x, y) => x - y);
      bTimes.sort((x, y) => x - y);
      let i = 0,
        j = 0;
      while (i < aTimes.length && j < bTimes.length) {
        const diff = Math.abs(aTimes[i] - bTimes[j]);
        if (diff <= windowMs) return true;
        if (aTimes[i] < bTimes[j]) i++;
        else j++;
      }
      return false;
    }

    let sodPairDerived = 0;
    for (const [, actions] of perEmployeeMap) {
      // Vendor creation vs payment approval within 7 days
      if (
        hasPairWithin(
          actions["VENDOR_CREATE"],
          actions["PAYMENT_APPROVE"],
          7 * DAY,
        )
      )
        sodPairDerived++;
      // Journal entry create vs approve/post within 7 days
      const jeCreate = actions["JOURNAL_ENTRY_CREATE"];
      const jeApprove = actions["JOURNAL_ENTRY_APPROVE"];
      const jePost = actions["JOURNAL_ENTRY_POST"];
      if (
        hasPairWithin(jeCreate, jeApprove, 7 * DAY) ||
        hasPairWithin(jeCreate, jePost, 7 * DAY)
      )
        sodPairDerived++;
      // Payment approve vs process within 1 day (temporal SoD)
      if (
        hasPairWithin(
          actions["PAYMENT_APPROVE"],
          actions["PAYMENT_PROCESS"],
          1 * DAY,
        )
      )
        sodPairDerived++;
    }

    const derivedPotentialViolations = highValueDerived + sodPairDerived;

    // Calculate average resolution time
    const resolvedViolations = violationsLast30d.filter(
      (v: any) => v.status === "RESOLVED" && v.resolvedAt,
    );
    const avgResolutionTime =
      resolvedViolations.length > 0
        ? StatisticalAnalysisEngine.calculateMean(
            resolvedViolations.map((v: any) => {
              const detectedTime = new Date(v.detectedAt).getTime();
              const resolvedTime = new Date(v.resolvedAt!).getTime();
              return (resolvedTime - detectedTime) / (1000 * 60 * 60); // Hours
            }),
          )
        : 24.5;

    // Calculate compliance rate including derived potential violations
    const totalViolationsLastMonth =
      violationsLast30d.length + derivedPotentialViolations;
  const totalTransactionsLastMonth = await retry(() => prisma.transaction.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000),
        },
      },
  }));

    const complianceRate =
      totalTransactionsLastMonth > 0
        ? ((totalTransactionsLastMonth - totalViolationsLastMonth) /
            totalTransactionsLastMonth) *
          100
        : 95.0;

    // Determine risk trend
    const currentWeekViolations = violationsLast30d.filter(
  (v: any) =>
        new Date(v.detectedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).length;

  const previousWeekViolations = violationsLast30d.filter((v: any) => {
      const detectedTime = new Date(v.detectedAt).getTime();
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      return detectedTime <= weekAgo && detectedTime > twoWeeksAgo;
    }).length;

    let riskTrend: "UP" | "DOWN" | "STABLE" = "STABLE";
    if (currentWeekViolations > previousWeekViolations * 1.2) {
      riskTrend = "UP";
    } else if (currentWeekViolations < previousWeekViolations * 0.8) {
      riskTrend = "DOWN";
    }

    // Adjust control effectiveness subtly based on change in active violations
    const deltaActive = recalculatedActiveViolations - baseActiveViolations;
    const adjustedControlEffectiveness = Math.max(
      60,
      Math.min(
        100,
        controlEffectivenessScore -
          Math.sign(deltaActive) * Math.min(Math.abs(deltaActive) * 0.5, 10),
      ),
    );

    const dashboardStats = {
      totalEmployees,
      totalTransactions,
      activeViolations:
        recalculatedActiveViolations + derivedPotentialViolations,
      controlEffectivenessScore:
        Math.round(adjustedControlEffectiveness * 10) / 10,
      highRiskViolations:
        recalculatedHighRiskViolations + Math.round(highValueDerived),
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      complianceRate: Math.round(complianceRate * 10) / 10,
      riskTrend,
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 },
    );
  }
}
