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

  it("calculates norm completion below 100% from the weaker leg", () => {
    const gap = getNormGap({
      leftForceKg: 40,
      rightForceKg: 45,
      leftNmPerKg: 2.4,
      rightNmPerKg: 2.7,
      shinLengthCm: 33,
      bodyWeightKg: 82,
    });

    assert.equal(gap?.weakerSide, "left");
    assertClose(gap?.weakerNmPerKg ?? null, 2.4);
    assertClose(gap?.completionPct ?? null, 80);
  });

  it("calculates exactly 100% norm completion", () => {
    const gap = getNormGap({
      leftForceKg: 50,
      rightForceKg: 55,
      leftNmPerKg: 3,
      rightNmPerKg: 3.2,
      shinLengthCm: 33,
      bodyWeightKg: 82,
    });

    assertClose(gap?.completionPct ?? null, 100);
  });

  it("keeps norm completion above 100% uncapped", () => {
    const gap = getNormGap({
      leftForceKg: 82.4,
      rightForceKg: 86,
      leftNmPerKg: 3.252,
      rightNmPerKg: 3.4,
      shinLengthCm: 33,
      bodyWeightKg: 82,
    });

    assertClose(gap?.completionPct ?? null, 108.4);
    assert.ok((gap?.completionPct ?? 0) > 100);
  });

  it("uses the force belonging to the genuinely weaker Nm/kg leg", () => {
    const gap = getNormGap({
      leftForceKg: 60,
      rightForceKg: 40,
      leftNmPerKg: 2.1,
      rightNmPerKg: 2.7,
      shinLengthCm: 33,
      bodyWeightKg: 82,
    });

    assert.equal(gap?.weakerSide, "left");
    assertClose(gap?.weakerForceKg ?? null, 60);
    assertClose(gap?.completionPct ?? null, 70);
    assertClose(gap?.missingKg ?? null, 16.0152086038092);
  });

  it("returns null for missing, non-finite, zero, or negative norm inputs", () => {
    const validInput = {
      leftForceKg: 40,
      rightForceKg: 45,
      leftNmPerKg: 2.4,
      rightNmPerKg: 2.7,
      shinLengthCm: 33,
      bodyWeightKg: 82,
    };

    assert.equal(getNormGap(null), null);
    assert.equal(getNormGap(undefined), null);
    assert.equal(getNormGap({ ...validInput, leftNmPerKg: null }), null);
    assert.equal(getNormGap({ ...validInput, leftNmPerKg: Number.NaN }), null);
    assert.equal(getNormGap({ ...validInput, rightForceKg: Number.POSITIVE_INFINITY }), null);
    assert.equal(getNormGap({ ...validInput, leftForceKg: 0 }), null);
    assert.equal(getNormGap({ ...validInput, rightNmPerKg: -1 }), null);
    assert.equal(getNormGap({ ...validInput, shinLengthCm: 0 }), null);
    assert.equal(getNormGap({ ...validInput, bodyWeightKg: -82 }), null);
  });

  it("calculates age at the test date", () => {
    assertClose(calculateAge("1990-07-10", "2026-07-06"), 35.98904859685147);
    assert.equal(calculateAge(null, "2026-07-06"), null);
    assert.equal(calculateAge("not-a-date", "2026-07-06"), null);
  });
});
