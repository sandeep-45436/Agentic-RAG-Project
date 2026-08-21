/**
 * StageTimer — lightweight synchronous instrumentation utility.
 *
 * Requirements: 7.1–7.9, 8.2, 8.3
 *
 * Design constraints:
 *  - No async, no I/O beyond console.log
 *  - Overhead target: ≤1ms per stage (p99 over 100 iterations)
 *  - durationMs = Date.now() - stageStart, no rounding
 */

import { latencyBudgets } from "@/ai/config/latency-budgets";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface StageTimingLog {
  stageName: string;
  durationMs: number;
  organizationId: string;
  userId: string;
  cacheHit: boolean;
  budgetExceeded: boolean;
  error?: true;
}

// ---------------------------------------------------------------------------
// StageTimer
// ---------------------------------------------------------------------------

export class StageTimer {
  /**
   * Capture the stage start timestamp.
   * MUST be the first operation called inside each node function.
   *
   * @param stageName  Identifies the pipeline stage (used for budget lookup).
   * @returns          `Date.now()` value at the moment of the call.
   */
  static start(stageName: string): number {
    void stageName; // parameter reserved for future use / symmetry with end()
    return Date.now();
  }

  /**
   * Compute elapsed time, emit a structured timing log, and optionally emit
   * a LATENCY_BUDGET_EXCEEDED event.
   *
   * @param stageName      The same stage name passed to `start`.
   * @param stageStart     The value returned by `start`.
   * @param meta           Per-request context forwarded into the log.
   * @param errorOccurred  Pass `true` when the stage threw or returned an error.
   * @returns              `{ durationMs, log }` for the caller to store in GraphState.timings.
   */
  static end(
    stageName: string,
    stageStart: number,
    meta: { organizationId: string; userId: string; cacheHit: boolean },
    errorOccurred?: boolean
  ): { durationMs: number; log: StageTimingLog } {
    const durationMs = Date.now() - stageStart;

    const budgetMs: number | undefined = latencyBudgets[stageName];
    const budgetExceeded = budgetMs !== undefined && durationMs > budgetMs;

    // Build the primary timing log
    const log: StageTimingLog = {
      stageName,
      durationMs,
      organizationId: meta.organizationId,
      userId: meta.userId,
      cacheHit: meta.cacheHit,
      budgetExceeded,
    };

    if (errorOccurred === true) {
      log.error = true;
    }

    // Emit single-line JSON timing entry to stdout
    console.log(JSON.stringify(log));

    // Emit budget-exceeded event (at most once per call)
    if (budgetExceeded && budgetMs !== undefined) {
      const budgetEvent = {
        event: "LATENCY_BUDGET_EXCEEDED",
        stageName,
        durationMs,
        budgetMs,
        excessMs: durationMs - budgetMs,
        organizationId: meta.organizationId,
        userId: meta.userId,
        timestamp: new Date().toISOString(),
      };
      console.log(JSON.stringify(budgetEvent));
    }

    return { durationMs, log };
  }
}
