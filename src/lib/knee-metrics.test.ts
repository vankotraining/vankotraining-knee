import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateAge,
  calculateAsymmetryPct,
  forceKgToNmPerKg,
  getAsymmetryValue,
  getNormGap,
  getWeakerSide,
  targetForceKg,
} from "./knee-metrics";

function assertClose(actual: number | null, expected: number, tolerance = 0.000001) {
  if (actual === null) assert.fail("Expected a number, got null");

  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} !== ${expected}`);
}

describe("knee metrics", () => {
  it("converts measured force to Nm/kg", () => {
    assertClose(forceKgToNmPerKg(35, 33, 82), 1.3813025304878046);
    assertClose(forceKgToNmPerKg(42, 33, 82), 1.657563036585366);
  });

  it("returns null for invalid Nm/kg inputs", () => {
    assert.equal(forceKgToNmPerKg(0, 33, 82), null);
    assert.equal(forceKgToNmPerKg(35, 0, 82), null);
    assert.equal(forceKgToNmPerKg(35, 33, 0), null);
  });

  it("calculates target force against the 3.0 Nm/kg norm", () => {
    assertClose(targetForceKg(33, 82), 76.0152086038092);
  });

  it("calculates asymmetry and weaker side from measured force", () => {
    assertClose(calculateAsymmetryPct(42, 35), 16.666666666666664);
    assert.equal(getWeakerSide(42, 35), "left");
    assert.equal(getWeakerSide(35, 42), "right");
    assert.equal(getWeakerSide(35, 35.005), "none");
  });

  it("normalizes stored asymmetry values for display", () => {
    assert.equal(getAsymmetryValue(0.12), 12);
    assert.equal(getAsymmetryValue(12), 12);
    assert.equal(getAsymmetryValue(null), null);
  });

  it("calculates the weaker-side norm gap", () => {
    const gap = getNormGap({
      leftForceKg: 35,
      rightForceKg: 42,
      leftNmPerKg: forceKgToNmPerKg(35, 33, 82),
      rightNmPerKg: forceKgToNmPerKg(42, 33, 82),
      shinLengthCm: 33,
      bodyWeightKg: 82,
    });

    assertClose(gap?.missingKg ?? null, 41.0152086038092);
    assertClose(gap?.missingNm ?? null, 1.6186974695121954);
    assertClose(gap?.missingPct ?? null, 53.95658231707318);
  });

  it("calculates age at the test date", () => {
    assertClose(calculateAge("1990-07-10", "2026-07-06"), 35.98904859685147);
    assert.equal(calculateAge(null, "2026-07-06"), null);
    assert.equal(calculateAge("not-a-date", "2026-07-06"), null);
  });
});
