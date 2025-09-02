import { Transaction, Employee, Violation } from "./types";

export class StatisticalAnalysisEngine {
  /**
   * Calculate Z-score for a given value in a dataset
   */
  static calculateZScore(value: number, dataset: number[]): number {
    const mean = this.calculateMean(dataset);
    const stdDev = this.calculateStandardDeviation(dataset, mean);

    if (stdDev === 0) return 0;
    return (value - mean) / stdDev;
  }

  /**
   * Calculate mean of a dataset
   */
  static calculateMean(dataset: number[]): number {
    if (dataset.length === 0) return 0;
    return dataset.reduce((sum, value) => sum + value, 0) / dataset.length;
  }

  /**
   * Calculate standard deviation
   */
  static calculateStandardDeviation(dataset: number[], mean?: number): number {
    if (dataset.length === 0) return 0;
    const avg = mean ?? this.calculateMean(dataset);
    const variance =
      dataset.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) /
      dataset.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate percentile rank of a value in dataset
   */
  static calculatePercentile(value: number, dataset: number[]): number {
    const sorted = [...dataset].sort((a, b) => a - b);
    const index = sorted.findIndex((v) => v >= value);
    if (index === -1) return 100;
    return (index / sorted.length) * 100;
  }

  /**
   * Detect outliers using IQR method
   */
  static detectOutliers(dataset: number[]): {
    outliers: number[];
    threshold: { lower: number; upper: number };
  } {
    if (dataset.length < 4)
      return { outliers: [], threshold: { lower: 0, upper: 0 } };

    const sorted = [...dataset].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);

    const q1 = sorted[q1Index] ?? 0;
    const q3 = sorted[q3Index] ?? 0;
    const iqr = q3 - q1;

    const lowerThreshold = q1 - 1.5 * iqr;
    const upperThreshold = q3 + 1.5 * iqr;

    const outliers = dataset.filter(
      (value) => value < lowerThreshold || value > upperThreshold,
    );

    return {
      outliers,
      threshold: {
        lower: lowerThreshold,
        upper: upperThreshold,
      },
    };
  }

  /**
   * Calculate risk score based on multiple factors
   */
  static calculateRiskScore(factors: {
    transactionVolume?: number;
    roleConflicts?: number;
    anomalyScore?: number;
    temporalViolations?: number;
    previousViolations?: number;
  }): number {
    const {
      transactionVolume = 0,
      roleConflicts = 0,
      anomalyScore = 0,
      temporalViolations = 0,
      previousViolations = 0,
    } = factors;

    // Weighted scoring algorithm
    const weights = {
      volume: 0.15,
      conflicts: 0.25,
      anomaly: 0.3,
      temporal: 0.2,
      previous: 0.1,
    };

    const normalizedVolume = Math.min(transactionVolume / 100, 10); // Normalize to 0-10
    const normalizedConflicts = Math.min(roleConflicts * 2, 10);
    const normalizedAnomaly = Math.min(anomalyScore, 10);
    const normalizedTemporal = Math.min(temporalViolations * 1.5, 10);
    const normalizedPrevious = Math.min(previousViolations * 0.5, 10);

    const riskScore =
      normalizedVolume * weights.volume +
      normalizedConflicts * weights.conflicts +
      normalizedAnomaly * weights.anomaly +
      normalizedTemporal * weights.temporal +
      normalizedPrevious * weights.previous;

    return Math.min(Math.max(riskScore, 1), 10); // Ensure 1-10 range
  }

  /**
   * Analyze transaction patterns for temporal SoD violations
   */
  static detectTemporalViolations(
    transactions: Transaction[],
    employees: Employee[],
    timeWindowHours: number = 72,
  ): Violation[] {
    const violations: Violation[] = [];
    const conflictingActions = this.getConflictingActionPairs();

    // Group transactions by employee
    const employeeTransactions = transactions.reduce(
      (acc, transaction) => {
        if (!acc[transaction.employeeId]) {
          acc[transaction.employeeId] = [];
        }
        acc[transaction.employeeId]?.push(transaction);
        return acc;
      },
      {} as Record<string, Transaction[]>,
    );

    Object.entries(employeeTransactions).forEach(
      ([employeeId, empTransactions]) => {
        const employee = employees.find((e) => e.id === employeeId);
        if (!employee) return;

        // Sort transactions by timestamp
        const sortedTransactions = empTransactions.sort(
          (a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
        );

        // Check for conflicting actions within time window
        for (let i = 0; i < sortedTransactions.length; i++) {
          const currentTransaction = sortedTransactions[i];
          if (!currentTransaction) continue;

          const timeWindow = timeWindowHours * 60 * 60 * 1000; // Convert to milliseconds
          const windowEnd =
            new Date(currentTransaction.timestamp).getTime() + timeWindow;

          // Check subsequent transactions within time window
          for (let j = i + 1; j < sortedTransactions.length; j++) {
            const laterTransaction = sortedTransactions[j];
            if (!laterTransaction) continue;

            const laterTime = new Date(laterTransaction.timestamp).getTime();
            if (laterTime > windowEnd) break;

            // Check if actions are conflicting
            const isConflicting = conflictingActions.some(
              (pair) =>
                (pair.action1 === currentTransaction.action &&
                  pair.action2 === laterTransaction.action) ||
                (pair.action2 === currentTransaction.action &&
                  pair.action1 === laterTransaction.action),
            );

            if (isConflicting) {
              violations.push({
                id: `temp_${Date.now()}_${Math.random()}`,
                violationId: `VIO-${Date.now()}-${employeeId.slice(-4)}`,
                employeeId,
                violationType: "SOD_TEMPORAL",
                severity: this.calculateViolationSeverity(
                  currentTransaction,
                  laterTransaction,
                ),
                riskScore: this.calculateRiskScore({
                  temporalViolations: 1,
                  anomalyScore: 5,
                }),
                description: `Employee performed conflicting actions: ${currentTransaction.action} and ${laterTransaction.action} within ${timeWindowHours} hours`,
                detectionMethod: "TEMPORAL_ANALYSIS",
                status: "OPEN",
                detectedAt: new Date(),
                relatedTransactions: [
                  currentTransaction.id,
                  laterTransaction.id,
                ],
              });
            }
          }
        }
      },
    );

    return violations;
  }

  /**
   * Get conflicting action pairs for SoD analysis
   */
  private static getConflictingActionPairs(): Array<{
    action1: string;
    action2: string;
    severity: string;
  }> {
    return [
      {
        action1: "VENDOR_CREATE",
        action2: "PAYMENT_APPROVE",
        severity: "HIGH",
      },
      {
        action1: "VENDOR_CREATE",
        action2: "PAYMENT_PROCESS",
        severity: "CRITICAL",
      },
      {
        action1: "INVOICE_CREATE",
        action2: "PAYMENT_APPROVE",
        severity: "HIGH",
      },
      {
        action1: "PURCHASE_ORDER_CREATE",
        action2: "PURCHASE_ORDER_APPROVE",
        severity: "MEDIUM",
      },
      {
        action1: "JOURNAL_ENTRY_CREATE",
        action2: "JOURNAL_ENTRY_APPROVE",
        severity: "HIGH",
      },
      {
        action1: "USER_CREATE",
        action2: "PERMISSION_ASSIGN",
        severity: "CRITICAL",
      },
      {
        action1: "BANK_RECONCILIATION",
        action2: "CASH_MANAGEMENT",
        severity: "MEDIUM",
      },
      {
        action1: "PAYROLL_PROCESS",
        action2: "PAYROLL_APPROVE",
        severity: "HIGH",
      },
    ];
  }

  /**
   * Calculate violation severity based on transaction context
   */
  private static calculateViolationSeverity(
    transaction1: Transaction,
    transaction2: Transaction,
  ): "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" {
    const maxAmount = Math.max(
      transaction1.amount ?? 0,
      transaction2.amount ?? 0,
    );
    const conflictPairs = this.getConflictingActionPairs();

    const relevantPair = conflictPairs.find(
      (pair) =>
        (pair.action1 === transaction1.action &&
          pair.action2 === transaction2.action) ||
        (pair.action2 === transaction1.action &&
          pair.action1 === transaction2.action),
    );

    // Base severity from action conflict
    let baseSeverity = relevantPair?.severity ?? "MEDIUM";

    // Adjust based on financial materiality
    if (maxAmount > 100000) {
      baseSeverity = "CRITICAL";
    } else if (maxAmount > 50000 && baseSeverity === "MEDIUM") {
      baseSeverity = "HIGH";
    } else if (maxAmount > 10000 && baseSeverity === "LOW") {
      baseSeverity = "MEDIUM";
    }

    return baseSeverity as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }

  /**
   * Analyze user behavior patterns for anomaly detection
   */
  static analyzeUserBehavior(employeeTransactions: Transaction[]): {
    baselineProfile: any;
    anomalies: any[];
    riskIndicators: string[];
  } {
    if (!employeeTransactions || employeeTransactions.length === 0) {
      return { baselineProfile: {}, anomalies: [], riskIndicators: [] };
    }

    const actionCounts = employeeTransactions.reduce(
      (acc, transaction) => {
        acc[transaction.action] = (acc[transaction.action] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const amounts = employeeTransactions
      .map((t) => t.amount ?? 0)
      .filter((amount) => amount > 0);

    const timestamps = employeeTransactions.map((t) =>
      new Date(t.timestamp).getHours(),
    );

    // Calculate baseline metrics
    const avgTransactionsPerDay = employeeTransactions.length / 30; // Assume 30 day period
    const avgAmount = amounts.length > 0 ? this.calculateMean(amounts) : 0;
    const mostCommonHour = this.getMostFrequent(timestamps);
    const mostCommonAction = this.getMostFrequent(Object.keys(actionCounts));

    const baselineProfile = {
      avgTransactionsPerDay,
      avgAmount,
      mostCommonHour,
      mostCommonAction,
      actionDistribution: actionCounts,
    };

    // Detect anomalies
    const anomalies = [];
    const riskIndicators = [];

    // Check for unusual transaction volume
    const volumeZScore =
      amounts.length > 3
        ? this.calculateZScore(employeeTransactions.length, [
            avgTransactionsPerDay * 30,
          ])
        : 0;

    if (Math.abs(volumeZScore) > 2) {
      anomalies.push({
        type: "VOLUME_ANOMALY",
        description: "Unusual transaction volume detected",
        severity: Math.abs(volumeZScore) > 3 ? "HIGH" : "MEDIUM",
        zScore: volumeZScore,
      });
      riskIndicators.push("Abnormal transaction volume pattern");
    }

    // Check for unusual amounts
    if (amounts.length > 3) {
      const amountOutliers = this.detectOutliers(amounts);
      if (amountOutliers.outliers.length > 0) {
        anomalies.push({
          type: "AMOUNT_ANOMALY",
          description: "Unusual transaction amounts detected",
          severity: "MEDIUM",
          outliers: amountOutliers.outliers,
        });
        riskIndicators.push("Atypical transaction amounts");
      }
    }

    return {
      baselineProfile,
      anomalies,
      riskIndicators,
    };
  }

  /**
   * Helper method to find most frequent value in array
   */
  private static getMostFrequent<T>(arr: T[]): T | undefined {
    const frequency = arr.reduce(
      (acc, item) => {
        acc[item as any] = (acc[item as any] ?? 0) + 1;
        return acc;
      },
      {} as Record<any, number>,
    );

    return Object.entries(frequency).reduce((a, b) =>
      frequency[a[0]] > frequency[b[0]] ? a : b,
    )[0] as T;
  }
}
