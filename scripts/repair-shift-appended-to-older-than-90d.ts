import { PrismaClient } from "@prisma/client";

// This script retroactively fixes the 13k appended transactions window guarantee.
// It targets only appended rows (transactionId contains an underscore "_")
// whose timestamps are within the last 90 days, and re-times them uniformly
// into a safe window between (earliest + 90 days) and min(earliest + 365 days, now - 90 days).

const prisma = new PrismaClient();

const DAY_MS = 24 * 60 * 60 * 1000;

async function main() {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * DAY_MS);

  const earliestTx = await prisma.transaction.findFirst({
    orderBy: { timestamp: "asc" },
    select: { timestamp: true },
  });
  if (!earliestTx?.timestamp) {
    console.log("No transactions found. Nothing to repair.");
    return;
  }

  const earliest = new Date(earliestTx.timestamp);
  const windowStart = new Date(earliest.getTime() + 90 * DAY_MS);
  const maxWindowEnd = new Date(earliest.getTime() + 365 * DAY_MS);
  const windowEnd = new Date(
    Math.min(maxWindowEnd.getTime(), ninetyDaysAgo.getTime()),
  );

  if (windowEnd.getTime() <= windowStart.getTime()) {
    console.warn(
      "Safe window is empty or inverted; aborting to avoid corrupting data.",
      {
        earliest,
        windowStart,
        windowEnd,
        ninetyDaysAgo,
      },
    );
    return;
  }

  // Target only appended transactions: they use an underscore in transactionId (e.g., TXN202501_XXXX)
  const violating = await prisma.transaction.findMany({
    where: {
      transactionId: { contains: "_" },
      timestamp: { gt: ninetyDaysAgo },
    },
    select: { id: true },
  });

  const totalViolating = violating.length;
  if (totalViolating === 0) {
    console.log(
      "No appended transactions within the last 90 days. Nothing to shift.",
    );
    return;
  }

  console.log(
    `Found ${totalViolating.toLocaleString()} appended transactions newer than 90 days; shifting into ${windowStart.toISOString()} .. ${windowEnd.toISOString()}`,
  );

  const spanMs = windowEnd.getTime() - windowStart.getTime();
  const batchSize = 1000;
  for (let i = 0; i < totalViolating; i += batchSize) {
    const batch = violating.slice(i, i + batchSize);
    // Build updates with randomized timestamps inside the window
    const updates = batch.map((row) => {
      const rand = Math.random();
      const ts = new Date(windowStart.getTime() + Math.floor(rand * spanMs));
      return prisma.transaction.update({
        where: { id: row.id },
        data: { timestamp: ts },
      });
    });
    await prisma.$transaction(updates);
    console.log(
      `  ✓ Updated ${Math.min(i + batch.length, totalViolating)}/${totalViolating}`,
    );
  }

  // Report a quick summary after the fix
  const [newMax, last90CountAppended] = await Promise.all([
    prisma.transaction.findFirst({
      orderBy: { timestamp: "desc" },
      select: { timestamp: true },
    }),
    prisma.transaction.count({
      where: {
        transactionId: { contains: "_" },
        timestamp: { gt: ninetyDaysAgo },
      },
    }),
  ]);

  console.log("Repair complete.");
  console.log(
    "Latest transaction timestamp in DB:",
    newMax?.timestamp?.toISOString(),
  );
  console.log(
    "Appended still within last 90 days (should be 0):",
    last90CountAppended,
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
