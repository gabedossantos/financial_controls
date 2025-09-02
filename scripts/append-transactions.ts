import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Keep action catalog in sync with seeding logic for variety and realistic risk weights
const transactionActions = [
  { action: "INVOICE_CREATE", category: "ACCOUNTS_PAYABLE", riskWeight: 2 },
  { action: "INVOICE_EDIT", category: "ACCOUNTS_PAYABLE", riskWeight: 2 },
  { action: "INVOICE_APPROVE", category: "ACCOUNTS_PAYABLE", riskWeight: 3 },
  { action: "VENDOR_CREATE", category: "VENDOR_MANAGEMENT", riskWeight: 4 },
  { action: "VENDOR_EDIT", category: "VENDOR_MANAGEMENT", riskWeight: 3 },
  { action: "VENDOR_DELETE", category: "VENDOR_MANAGEMENT", riskWeight: 5 },
  { action: "PAYMENT_APPROVE", category: "PAYMENT_PROCESSING", riskWeight: 5 },
  { action: "PAYMENT_PROCESS", category: "PAYMENT_PROCESSING", riskWeight: 4 },
  { action: "PAYMENT_CANCEL", category: "PAYMENT_PROCESSING", riskWeight: 3 },
  {
    action: "JOURNAL_ENTRY_CREATE",
    category: "JOURNAL_ENTRIES",
    riskWeight: 3,
  },
  { action: "JOURNAL_ENTRY_EDIT", category: "JOURNAL_ENTRIES", riskWeight: 3 },
  {
    action: "JOURNAL_ENTRY_APPROVE",
    category: "JOURNAL_ENTRIES",
    riskWeight: 4,
  },
  { action: "JOURNAL_ENTRY_POST", category: "JOURNAL_ENTRIES", riskWeight: 4 },
  { action: "CASH_MANAGEMENT", category: "CASH_MANAGEMENT", riskWeight: 4 },
  { action: "BANK_RECONCILIATION", category: "CASH_MANAGEMENT", riskWeight: 3 },
  { action: "CASH_TRANSFER", category: "CASH_MANAGEMENT", riskWeight: 4 },
  { action: "PURCHASE_ORDER_CREATE", category: "PROCUREMENT", riskWeight: 2 },
  { action: "PURCHASE_ORDER_APPROVE", category: "PROCUREMENT", riskWeight: 3 },
  { action: "PURCHASE_ORDER_MODIFY", category: "PROCUREMENT", riskWeight: 3 },
  { action: "USER_CREATE", category: "USER_MANAGEMENT", riskWeight: 4 },
  { action: "USER_EDIT", category: "USER_MANAGEMENT", riskWeight: 3 },
  { action: "USER_DELETE", category: "USER_MANAGEMENT", riskWeight: 5 },
  { action: "PERMISSION_ASSIGN", category: "USER_MANAGEMENT", riskWeight: 5 },
  { action: "ROLE_ASSIGN", category: "USER_MANAGEMENT", riskWeight: 4 },
  { action: "PAYROLL_PROCESS", category: "PAYROLL", riskWeight: 4 },
  { action: "PAYROLL_APPROVE", category: "PAYROLL", riskWeight: 4 },
  { action: "PAYROLL_MODIFY", category: "PAYROLL", riskWeight: 3 },
  { action: "SYSTEM_CONFIG", category: "SYSTEM_ADMIN", riskWeight: 5 },
  { action: "DATABASE_BACKUP", category: "SYSTEM_ADMIN", riskWeight: 3 },
  { action: "SECURITY_CONFIG", category: "SYSTEM_ADMIN", riskWeight: 5 },
  { action: "REPORT_GENERATE", category: "REPORTING", riskWeight: 1 },
  { action: "REPORT_EXPORT", category: "REPORTING", riskWeight: 2 },
  { action: "AUDIT_VIEW", category: "REPORTING", riskWeight: 2 },
];

const generateIP = () =>
  `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

function generateTransactionAmount(actionType: string): number | null {
  const rand = Math.random();

  if (
    [
      "PAYMENT_APPROVE",
      "PAYMENT_PROCESS",
      "CASH_MANAGEMENT",
      "CASH_TRANSFER",
    ].includes(actionType)
  ) {
    if (rand < 0.02) return 500000 + Math.random() * 2000000; // $500K - $2.5M
    if (rand < 0.08) return 100000 + Math.random() * 400000; // $100K - $500K
    if (rand < 0.2) return 25000 + Math.random() * 75000; // $25K - $100K
    if (rand < 0.4) return 5000 + Math.random() * 20000; // $5K - $25K
    if (rand < 0.7) return 1000 + Math.random() * 4000; // $1K - $5K
    if (rand < 0.9) return 300 + Math.random() * 700; // $300 - $1K
    return 50 + Math.random() * 250; // $50 - $300
  }

  if (["PAYROLL_PROCESS", "PAYROLL_APPROVE"].includes(actionType)) {
    if (rand < 0.05) return 200000 + Math.random() * 800000; // $200K - $1M
    if (rand < 0.2) return 80000 + Math.random() * 120000; // $80K - $200K
    return 40000 + Math.random() * 40000; // $40K - $80K
  }

  if (
    ["PURCHASE_ORDER_APPROVE", "PURCHASE_ORDER_CREATE"].includes(actionType)
  ) {
    if (rand < 0.05) return 50000 + Math.random() * 450000; // $50K - $500K
    if (rand < 0.15) return 10000 + Math.random() * 40000; // $10K - $50K
    if (rand < 0.4) return 2000 + Math.random() * 8000; // $2K - $10K
    if (rand < 0.75) return 500 + Math.random() * 1500; // $500 - $2K
    return 25 + Math.random() * 475; // $25 - $500
  }

  // Other administrative/reporting actions: mostly non-monetary
  if (rand < 0.1) return 100 + Math.random() * 2000;
  return null;
}

function parseCountArg(): number {
  const fromEnv = process.env.APPEND_TX_COUNT
    ? parseInt(process.env.APPEND_TX_COUNT, 10)
    : undefined;
  const fromArg = process.argv.find((a) => a.startsWith("--count="));
  const argVal = fromArg
    ? parseInt(fromArg.split("=")[1] || "0", 10)
    : undefined;
  const count =
    Number.isFinite(argVal) && (argVal ?? 0) > 0
      ? (argVal as number)
      : Number.isFinite(fromEnv) && (fromEnv ?? 0) > 0
        ? (fromEnv as number)
        : 5000;
  return count;
}

function parseWindowArgs() {
  // Defaults per request: start after +90 days from earliest date, span 275 days (cap within +365)
  const startOffsetArg = process.argv.find((a) =>
    a.startsWith("--startOffsetDays="),
  );
  const spanArg = process.argv.find((a) => a.startsWith("--spanDays="));
  const startOffsetDays = startOffsetArg
    ? parseInt(startOffsetArg.split("=")[1] || "90", 10)
    : 90;
  const spanDays = spanArg ? parseInt(spanArg.split("=")[1] || "275", 10) : 275;
  return { startOffsetDays, spanDays };
}

async function main() {
  const totalToCreate = parseCountArg();
  console.log(
    `➕ Appending ${totalToCreate.toLocaleString()} randomized transactions (no truncation)...`,
  );

  // Load employees and roles once
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
    include: { role: true },
  });
  if (employees.length === 0) {
    console.log("No employees found. Aborting.");
    return;
  }

  // Determine constrained window based on earliest existing transaction
  const earliestTx = await prisma.transaction.findFirst({
    orderBy: { timestamp: "asc" },
    select: { timestamp: true },
  });
  const earliest = earliestTx?.timestamp
    ? new Date(earliestTx.timestamp)
    : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
  const { startOffsetDays, spanDays } = parseWindowArgs();
  const windowStart = new Date(
    earliest.getTime() + startOffsetDays * 24 * 60 * 60 * 1000,
  );
  const maxWindowEnd = new Date(earliest.getTime() + 365 * 24 * 60 * 60 * 1000);
  const desiredWindowEnd = new Date(
    windowStart.getTime() + spanDays * 24 * 60 * 60 * 1000,
  );
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  // Cap at earliest+365, desired end, and now-90d to ensure all appended are older than 90 days from today
  const windowEnd = new Date(
    Math.min(
      maxWindowEnd.getTime(),
      desiredWindowEnd.getTime(),
      ninetyDaysAgo.getTime(),
    ),
  );
  const windowSpanMs = Math.max(1, windowEnd.getTime() - windowStart.getTime());

  const batchSize = 1000;
  const totalBatches = Math.ceil(totalToCreate / batchSize);

  for (let batch = 0; batch < totalBatches; batch++) {
    const batchData: any[] = [];
    const start = batch * batchSize;
    const end = Math.min(start + batchSize, totalToCreate);

    for (let i = start; i < end; i++) {
      const employee = employees[Math.floor(Math.random() * employees.length)];
      const rolePermissions = employee.role?.permissions ?? [];

      // Choose action: 80% from role permission family, 20% random
      let selectedAction = null as null | (typeof transactionActions)[number];
      if (Math.random() < 0.8 && rolePermissions.length > 0) {
        const matching = transactionActions.filter((ta) =>
          rolePermissions.some((perm) =>
            ta.action.includes((perm.split("_")[0] || "").toUpperCase()),
          ),
        );
        selectedAction =
          matching.length > 0
            ? matching[Math.floor(Math.random() * matching.length)]
            : transactionActions[
                Math.floor(Math.random() * transactionActions.length)
              ];
      } else {
        selectedAction =
          transactionActions[
            Math.floor(Math.random() * transactionActions.length)
          ];
      }

      const randomTime = windowStart.getTime() + Math.random() * windowSpanMs;
      const timestamp = new Date(randomTime);
      const amount = generateTransactionAmount(selectedAction.action);

      // Unique-ish, time-based, low collision probability ID
      const uniq =
        `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
      const transactionId = `TXN${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, "0")}_${uniq}`;

      batchData.push({
        transactionId,
        employeeId: employee.id,
        action: selectedAction.action,
        category: selectedAction.category,
        amount,
        description: `${selectedAction.action.replace(/_/g, " ").toLowerCase()} - ${employee.firstName} ${employee.lastName}`,
        systemId: `SYS${Math.floor(Math.random() * 999) + 1}`,
        ipAddress: generateIP(),
        timestamp,
        metadata: {
          userAgent: "Enterprise-App/1.0",
          sessionId: `sess_${Math.random().toString(36).slice(2, 12)}`,
          riskWeight: selectedAction.riskWeight,
          quarter: `Q${Math.ceil((timestamp.getMonth() + 1) / 3)}`,
          fiscalYear: timestamp.getFullYear(),
        },
      });
    }

    if (batchData.length > 0) {
      await prisma.transaction.createMany({
        data: batchData,
        skipDuplicates: true,
      });
      console.log(
        `   ✓ Batch ${batch + 1}/${totalBatches} inserted (${batchData.length})`,
      );
    }
  }

  const newCount = await prisma.transaction.count();
  console.log(
    `✅ Append complete. transactions count is now ${newCount.toLocaleString()}.`,
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
