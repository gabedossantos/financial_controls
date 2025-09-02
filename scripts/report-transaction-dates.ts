import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  const msDay = 24 * 60 * 60 * 1000;
  const last90 = new Date(now.getTime() - 90 * msDay);

  const [minTx, maxTx, total, last90Count] = await Promise.all([
    prisma.transaction.findFirst({
      orderBy: { timestamp: "asc" },
      select: { timestamp: true },
    }),
    prisma.transaction.findFirst({
      orderBy: { timestamp: "desc" },
      select: { timestamp: true },
    }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { timestamp: { gte: last90 } } }),
  ]);

  const earliest = minTx?.timestamp ?? null;
  const latest = maxTx?.timestamp ?? null;

  // Intended append window (earliest + 90 .. earliest + 90 + 275), clipped to earliest + 365 and now
  if (earliest) {
    const windowStart = new Date(earliest.getTime() + 90 * msDay);
    const windowEnd = new Date(
      Math.min(
        earliest.getTime() + 365 * msDay,
        windowStart.getTime() + 275 * msDay,
        now.getTime(),
      ),
    );
    const intendedWindowCount = await prisma.transaction.count({
      where: {
        timestamp: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
    });

    console.log(
      JSON.stringify(
        {
          total,
          earliest,
          latest,
          last90Days: { threshold: last90, count: last90Count },
          intendedAppendWindow: {
            start: windowStart,
            end: windowEnd,
            count: intendedWindowCount,
          },
        },
        null,
        2,
      ),
    );
  } else {
    console.log(
      JSON.stringify(
        {
          total,
          earliest,
          latest,
          last90Days: { threshold: last90, count: last90Count },
        },
        null,
        2,
      ),
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
