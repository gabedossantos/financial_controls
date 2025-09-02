import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma default export
vi.mock("@/lib/db", () => {
  const counts = {
    employee: 5,
    transaction: 42,
    violation: 3,
    department: 2,
    role: 4,
    systemMetric: 6,
  };
  const prisma = {
    employee: {
      count: vi.fn().mockResolvedValue(counts.employee),
      findMany: vi.fn().mockResolvedValue([]),
    },
    transaction: { count: vi.fn().mockResolvedValue(counts.transaction) },
    violation: {
      count: vi.fn().mockResolvedValue(counts.violation),
      findMany: vi.fn().mockResolvedValue([]),
    },
    department: {
      count: vi.fn().mockResolvedValue(counts.department),
      findMany: vi.fn().mockResolvedValue([]),
    },
    role: { count: vi.fn().mockResolvedValue(counts.role) },
    systemMetric: {
      count: vi.fn().mockResolvedValue(counts.systemMetric),
      findMany: vi.fn().mockResolvedValue([]),
    },
  };
  return { __esModule: true, default: prisma, prisma };
});

import * as Health from "@/app/api/health/route";
import * as Dashboard from "@/app/api/dashboard/stats/route";
import * as Trends from "@/app/api/analytics/trends/route";
import { NextRequest } from "next/server";

// Simplistic Request helper
const mkReq = (url: string) => new Request(url);
const mkNextReq = (url: string) => ({ url } as unknown as NextRequest);

describe("API handlers", () => {
  it("health returns ok status", async () => {
    const res = await Health.GET();
    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.counts.employees).toBe(5);
  });

  it("dashboard stats returns expected shape", async () => {
    const res = await Dashboard.GET(
      mkNextReq("https://example.com/api/dashboard/stats"),
    );
    const json = await res.json();
    expect(json).toHaveProperty("totalEmployees");
    expect(json).toHaveProperty("riskTrend");
  });

  it("trends validates query (invalid days -> 400)", async () => {
    const res = await Trends.GET(
      mkNextReq("https://example.com/api/analytics/trends?days=0"),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });
});
