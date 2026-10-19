import { env } from "../config/env.js";

/**
 * Sample fee calculator — rates are labelled SAMPLE/DEMO, not official VNUK policy.
 */
export function calculateSessionFee(input: {
  entryAt: Date;
  exitAt: Date;
  hasActiveMonthlyPass?: boolean;
}): { amount: number; feeType: string; labelledSample: true } {
  if (input.hasActiveMonthlyPass) {
    return { amount: 0, feeType: "MONTHLY_PASS_INCLUDED_SAMPLE", labelledSample: true };
  }

  const ms = Math.max(0, input.exitAt.getTime() - input.entryAt.getTime());
  const hours = ms / (60 * 60 * 1000);
  // Sample: one daily fee if parked any time that day window; grace 15 minutes
  if (hours <= 0.25) {
    return { amount: 0, feeType: "GRACE_PERIOD_SAMPLE", labelledSample: true };
  }

  return {
    amount: env.SAMPLE_DAILY_FEE_VND,
    feeType: "DAILY_SAMPLE",
    labelledSample: true,
  };
}
