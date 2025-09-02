import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    const [employees, transactions, violations, departments, roles, metrics] =
      await Promise.all([
        prisma.employee.count(), // might be plural depending on generated client
        prisma.transaction.count(),
        prisma.violation.count(),
        prisma.department.count(),
        prisma.role.count(),
        prisma.systemMetric.count(),
      ]);
    const latencyMs = Date.now() - start;
    return NextResponse.json({
      status: "ok",
      latencyMs,
      counts: {
        employees,
        transactions,
        violations,
        departments,
        roles,
        metrics,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const latencyMs = Date.now() - start;
    console.error("Health endpoint error:", error);
    return NextResponse.json(
      { status: "error", latencyMs, message: "Health check failed" },
      { status: 500 },
    );
  }
}
