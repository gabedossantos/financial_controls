import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
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

    let intended: any = null;
    if (earliest) {
      const windowStart = new Date(earliest.getTime() + 90 * msDay);
      const windowEnd = new Date(
        Math.min(
          earliest.getTime() + 365 * msDay,
          windowStart.getTime() + 275 * msDay,
          now.getTime(),
        ),
      );
      const intendedCount = await prisma.transaction.count({
        where: { timestamp: { gte: windowStart, lte: windowEnd } },
      });
      intended = { start: windowStart, end: windowEnd, count: intendedCount };
    }

    return NextResponse.json({
      total,
      earliest,
      latest,
      last90Days: { threshold: last90, count: last90Count },
      intendedAppendWindow: intended,
    });
  } catch (e) {
    console.error("tx-dates debug error", e);
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
