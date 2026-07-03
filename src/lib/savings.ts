// Pure savings-projection math. No DB or React here so it stays easy to reason
// about (and test): given a current balance and a monthly pace, work out where
// the household lands by a future date.
import { differenceInCalendarMonths, endOfYear, startOfMonth } from "date-fns";

/** Whole months left to contribute between now and `target` (never negative). */
export function monthsUntil(target: Date, now = new Date()): number {
  return Math.max(
    0,
    differenceInCalendarMonths(startOfMonth(target), startOfMonth(now))
  );
}

/**
 * Project a balance forward: current savings plus the monthly pace applied to
 * each remaining whole month. The current (partial) month isn't added again —
 * its contributions are already reflected in `currentCents`.
 */
export function projectBalance(
  currentCents: number,
  monthlyAvgCents: number,
  target: Date,
  now = new Date()
): number {
  return currentCents + monthlyAvgCents * monthsUntil(target, now);
}

export interface SavingsProjection {
  currentCents: number;
  monthlyAvgCents: number;
  /** Projected balance on 31 Dec of the current year. */
  yearEndCents: number;
  monthsToYearEnd: number;
  goal?: {
    /** What the household chose to set aside each month. */
    monthlyTargetCents: number;
    /** Contributing months from now until the deadline (always >= 1). */
    months: number;
    /** Total to reach by the deadline, derived as monthlyTarget × months. */
    targetCents: number;
    deadline: Date;
    /**
     * Amount saved *since the goal was set* (currentCents − baseline, never
     * negative). This — not the whole savings balance — is what counts toward
     * the goal, so money set aside beforehand doesn't pre-fill the bar.
     */
    savedCents: number;
    /** Projected saved-toward-goal amount on the deadline at the current pace. */
    projectedCents: number;
    /** savedCents / targetCents, clamped to [0, 1] for the progress bar. */
    progress: number;
    /** Still-needed amount (0 once the goal is met). */
    remainingCents: number;
    /** True while the actual pace meets (or beats) the monthly target. */
    onTrack: boolean;
    /** How far the monthly pace falls short of the target (0 when on track). */
    shortfallCents: number;
  };
}

export function buildSavingsProjection(opts: {
  currentCents: number;
  monthlyAvgCents: number;
  /** The amount the household wants to save each month (drives the goal). */
  monthlyTargetCents?: number | null;
  goalDeadline?: Date | null;
  /**
   * Savings balance when the goal was set. Only what's saved beyond this counts
   * toward the goal. Null/undefined (e.g. legacy goals) counts from zero.
   */
  goalBaselineCents?: number | null;
  now?: Date;
}): SavingsProjection {
  const now = opts.now ?? new Date();
  const yearEnd = endOfYear(now);

  const projection: SavingsProjection = {
    currentCents: opts.currentCents,
    monthlyAvgCents: opts.monthlyAvgCents,
    yearEndCents: projectBalance(opts.currentCents, opts.monthlyAvgCents, yearEnd, now),
    monthsToYearEnd: monthsUntil(yearEnd, now),
  };

  if (opts.monthlyTargetCents && opts.monthlyTargetCents > 0) {
    // No explicit deadline → measure against the end of the year.
    const deadline = opts.goalDeadline ?? yearEnd;
    // Include the current month, so a goal ending this month still expects
    // one contribution.
    const months = monthsUntil(deadline, now) + 1;
    const targetCents = opts.monthlyTargetCents * months;
    // Count only what's been saved since the goal was set — money already in
    // the account at that moment (the baseline) doesn't count toward it.
    const savedCents = Math.max(
      0,
      opts.currentCents - (opts.goalBaselineCents ?? 0)
    );
    // Project the saved-toward-goal amount forward at the current pace.
    const projectedCents = projectBalance(
      savedCents,
      opts.monthlyAvgCents,
      deadline,
      now
    );
    projection.goal = {
      monthlyTargetCents: opts.monthlyTargetCents,
      months,
      targetCents,
      deadline,
      savedCents,
      projectedCents,
      progress: Math.min(1, Math.max(0, savedCents / targetCents)),
      remainingCents: Math.max(0, targetCents - savedCents),
      onTrack: opts.monthlyAvgCents >= opts.monthlyTargetCents,
      shortfallCents: Math.max(0, opts.monthlyTargetCents - opts.monthlyAvgCents),
    };
  }

  return projection;
}
