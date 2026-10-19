import { describe, expect, it } from "vitest";
import { calculateSessionFee } from "./fee.calculator.js";

describe("calculateSessionFee", () => {
  it("returns grace fee for short stays", () => {
    const entryAt = new Date("2026-10-18T08:00:00.000Z");
    const exitAt = new Date("2026-10-18T08:10:00.000Z");
    const fee = calculateSessionFee({ entryAt, exitAt });
    expect(fee.amount).toBe(0);
    expect(fee.labelledSample).toBe(true);
    expect(fee.feeType).toContain("GRACE");
  });

  it("returns sample daily fee after grace", () => {
    const entryAt = new Date("2026-10-18T08:00:00.000Z");
    const exitAt = new Date("2026-10-18T10:00:00.000Z");
    const fee = calculateSessionFee({ entryAt, exitAt });
    expect(fee.amount).toBeGreaterThan(0);
    expect(fee.labelledSample).toBe(true);
  });

  it("waives when monthly pass sample flag set", () => {
    const entryAt = new Date("2026-10-18T08:00:00.000Z");
    const exitAt = new Date("2026-10-18T18:00:00.000Z");
    const fee = calculateSessionFee({
      entryAt,
      exitAt,
      hasActiveMonthlyPass: true,
    });
    expect(fee.amount).toBe(0);
  });
});
