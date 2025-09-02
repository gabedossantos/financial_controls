import { PrismaClient, Prisma } from "@prisma/client";

// This script scans transactions older than May 23, 2025 and generates violations for high-value/materiality breaches and SoD conflicts.
const prisma = new PrismaClient();

const MATERIALITY = 10000; // Example threshold for materiality breach
const HIGH_RISK = 50000; // Example threshold for high risk
const SOD_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const SOD_ACTIONS = [
  ["VENDOR_CREATE", "PAYMENT_APPROVE"],
  ["JOURNAL_ENTRY_CREATE", "JOURNAL_ENTRY_APPROVE"],
  ["JOURNAL_ENTRY_CREATE", "JOURNAL_ENTRY_POST"],
  ["PAYMENT_APPROVE", "PAYMENT_PROCESS"],
];

const VIOLATION_TYPES = {
  MATERIALITY_BREACH: {
    type: "MATERIALITY_BREACH",
    severity: "HIGH",
    description: "Transaction amount exceeds materiality threshold.",
  },
  SOD_TEMPORAL: {
    type: "SOD_TEMPORAL",
    severity: "HIGH",
    description: "Conflicting duties performed within 7 days.",
  },
};

async function main() {
  // Only scan transactions older than May 23, 2025
  const cutoff = new Date("2025-05-23T00:00:00.000Z");
  const transactions = await prisma.transaction.findMany({
    where: { timestamp: { lt: cutoff } },
    select: {
      id: true,
      transactionId: true,
      employeeId: true,
      action: true,
      amount: true,
      timestamp: true,
    },
  });

  // 1. Materiality breaches
  const materialityViolations = transactions
    .filter((t) => (t.amount ?? 0) >= MATERIALITY)
    .map((t) => ({
      violationId: `VIO${t.transactionId}`,
      employeeId: t.employeeId,
      violationType: VIOLATION_TYPES.MATERIALITY_BREACH.type,
      severity: VIOLATION_TYPES.MATERIALITY_BREACH.severity,
      riskScore: Math.min(10, Math.max(6, ((t.amount ?? 0) / HIGH_RISK) * 10)),
      description: VIOLATION_TYPES.MATERIALITY_BREACH.description,
      detectionMethod: "BACKFILL_SCRIPT",
      status: "RESOLVED",
      detectedAt: t.timestamp,
      resolvedAt: t.timestamp,
      resolutionNotes: "Backfilled for trend completeness.",
      relatedTransactions: [t.transactionId],
    }));

  // 2. SoD temporal conflicts
  // Build per-employee action map
  const perEmployee: Record<
    string,
    Record<
      string,
      Array<{ id: string; timestamp: Date; transactionId: string }>
    >
  > = {};
  for (const t of transactions) {
    if (!perEmployee[t.employeeId]) perEmployee[t.employeeId] = {};
    if (!perEmployee[t.employeeId][t.action])
      perEmployee[t.employeeId][t.action] = [];
    perEmployee[t.employeeId][t.action].push({
      id: t.id,
      timestamp: t.timestamp,
      transactionId: t.transactionId,
    });
  }

  const sodViolations: Array<any> = [];
  for (const [a, b] of SOD_ACTIONS) {
    for (const empId in perEmployee) {
      const aTxs = perEmployee[empId][a] || [];
      const bTxs = perEmployee[empId][b] || [];
      for (const ta of aTxs) {
        for (const tb of bTxs) {
          if (
            Math.abs(ta.timestamp.getTime() - tb.timestamp.getTime()) <=
            SOD_WINDOW_MS
          ) {
            // Only one violation per pair
            sodViolations.push({
              violationId: `VIO${ta.transactionId}_${tb.transactionId}`,
              employeeId: empId,
              violationType: VIOLATION_TYPES.SOD_TEMPORAL.type,
              severity: VIOLATION_TYPES.SOD_TEMPORAL.severity,
              riskScore: 8,
              description: VIOLATION_TYPES.SOD_TEMPORAL.description,
              detectionMethod: "BACKFILL_SCRIPT",
              status: "RESOLVED",
              detectedAt:
                ta.timestamp < tb.timestamp ? ta.timestamp : tb.timestamp,
              resolvedAt:
                ta.timestamp < tb.timestamp ? ta.timestamp : tb.timestamp,
              resolutionNotes: "Backfilled for trend completeness.",
              relatedTransactions: [ta.transactionId, tb.transactionId],
            });
          }
        }
      }
    }
  }

  // Combine and deduplicate by violationId
  const allViolations = [...materialityViolations, ...sodViolations];
  const uniqueViolations = Object.values(
    allViolations.reduce((acc, v) => {
      acc[v.violationId] = v;
      return acc;
    }, {}),
  );

  if (uniqueViolations.length === 0) {
    console.log("No violations to backfill.");
    return;
  }

  // Insert in batches
  const batchSize = 1000;
  for (let i = 0; i < uniqueViolations.length; i += batchSize) {
    const batch = uniqueViolations.slice(
      i,
      i + batchSize,
    ) as Prisma.ViolationCreateManyInput[];
    await prisma.violation.createMany({ data: batch, skipDuplicates: true });
    console.log(
      `  ✓ Backfilled ${Math.min(i + batch.length, uniqueViolations.length)}/${uniqueViolations.length}`,
    );
  }

  console.log(
    `✅ Backfill complete. Inserted ${uniqueViolations.length} violations.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
