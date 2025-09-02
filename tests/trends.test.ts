import { describe, it, expect } from "vitest";
import { TrendQuerySchema } from "@/lib/validation";

describe("TrendQuerySchema", () => {
  it("accepts valid defaults", () => {
    const parsed = TrendQuerySchema.safeParse({
      days: "30",
      metric: "violations",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid days", () => {
    const parsed = TrendQuerySchema.safeParse({
      days: "0",
      metric: "violations",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects unsupported metric", () => {
    const parsed = TrendQuerySchema.safeParse({
      days: "30",
      metric: "foo" as any,
    });
    expect(parsed.success).toBe(false);
  });
});
