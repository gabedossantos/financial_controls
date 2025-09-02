import { z } from "zod";

export const TrendQuerySchema = z.object({
  days: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .refine((v) => v > 0 && v <= 365, "days must be 1-365")
    .default("30"),
  metric: z
    .enum([
      "violations",
      "risk_scores",
      "control_effectiveness",
      "transactions",
    ])
    .default("violations"),
});

export type TrendQuery = z.infer<typeof TrendQuerySchema> & { days: number };

export const ErrorResponseSchema = z.object({ error: z.string() });

export function safeParseTrendParams(url: string) {
  const { searchParams } = new URL(url);
  const obj = {
    days: searchParams.get("days") ?? "30",
    metric: (searchParams.get("metric") as any) ?? "violations",
  };
  const parsed = TrendQuerySchema.safeParse(obj);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }
  // coerce days to number after validation
  return {
    success: true as const,
    data: { ...parsed.data, days: Number(parsed.data.days) },
  };
}

// Materiality params validation
export const MaterialitySchema = z.object({
  overallMateriality: z.coerce
    .number()
    .finite()
    .min(1)
    .max(10_000_000)
    .default(50_000),
  performanceMateriality: z.coerce
    .number()
    .finite()
    .min(1)
    .max(10_000_000)
    .default(37_500),
  trivialThreshold: z.coerce
    .number()
    .finite()
    .min(0)
    .max(1_000_000)
    .default(2_500),
  highRiskMultiplier: z.coerce.number().finite().min(0.1).max(1.0).default(0.5),
});

export type MaterialityParams = z.infer<typeof MaterialitySchema>;

export function safeParseMateriality(url: string) {
  const { searchParams } = new URL(url);
  const obj = {
    overallMateriality: searchParams.get("overallMateriality") ?? "50000",
    performanceMateriality:
      searchParams.get("performanceMateriality") ?? "37500",
    trivialThreshold: searchParams.get("trivialThreshold") ?? "2500",
    highRiskMultiplier: searchParams.get("highRiskMultiplier") ?? "0.5",
  };
  const parsed = MaterialitySchema.safeParse(obj);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.flatten().fieldErrors,
    };
  }
  return { success: true as const, data: parsed.data };
}
