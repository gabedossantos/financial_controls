import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const severity = searchParams.get("severity");
    const status = searchParams.get("status");
    const employeeId = searchParams.get("employeeId");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (severity && severity !== "ALL") {
      where.severity = severity;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (employeeId) {
      where.employeeId = employeeId;
    }

    const [violations, totalCount] = await Promise.all([
      prisma.violation.findMany({
        where,
        include: {
          employee: {
            include: {
              department: true,
              role: true,
            },
          },
        },
        orderBy: { detectedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.violation.count({ where }),
    ]);

    return NextResponse.json({
      violations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Violations API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch violations" },
      { status: 500 },
    );
  }
}
