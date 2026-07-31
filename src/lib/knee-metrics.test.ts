import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateAge,
  calculateAsymmetryPct,
  calculateMeasurementChange,
  compareMeasurementsChronologically,
  forceKgToNmPerKg,
  getAsymmetryValue,
  getMeasurementComparison,
  getNormGap,
  getWeakerSide,
  targetForceKg,
} from "./knee-metrics";
import type { MeasurementForComparison } from "./knee-metrics";

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

function measurement(
  id: string,
  testDate: string,
  leftForceKg: number | null,
  rightForceKg: number | null,
  options: Partial<
    Pick<
      MeasurementForComparison,
      "createdAt" | "sourceRow" | "archivedAt"
    >
  > = {},
): MeasurementForComparison {
  return {
    id,
    testDate,
    createdAt: options.createdAt ?? `${testDate}T08:00:00.000Z`,
    sourceRow: options.sourceRow ?? null,
    leftForceKg,
    rightForceKg,
    archivedAt: options.archivedAt ?? null,
  };
}

describe("measurement changes", () => {
  it("preserves a positive direction in kilograms", () => {
    const change = calculateMeasurementChange(44, 40);

    assert.equal(change.changeKg, 4);
    assert.equal(change.hasComparison, true);
  });

  it("preserves a negative direction in kilograms", () => {
    const change = calculateMeasurementChange(39.3, 40);

    assertClose(change.changeKg, -0.7);
  });

  it("returns a neutral zero change", () => {
    const change = calculateMeasurementChange(40, 40);

    assert.equal(change.changeKg, 0);
    assert.equal(change.changePct, 0);
  });

  it("calculates the percentage from the previous force", () => {
    const change = calculateMeasurementChange(44, 40);

    assert.equal(change.changePct, 10);
  });

  it("calculates left and right legs independently", () => {
    const measurements = [
      measurement("previous", "2026-07-14", 40, 44),
      measurement("current", "2026-07-21", 42.8, 43.3),
    ];
    const comparison = getMeasurementComparison(measurements, "current");

    assertClose(comparison.left.changeKg, 2.8);
    assertClose(comparison.left.changePct, 7);
    assertClose(comparison.right.changeKg, -0.7);
    assertClose(comparison.right.changePct, -1.5909090909090917);
  });

  it("returns no comparison for the first active measurement", () => {
    const comparison = getMeasurementComparison(
      [measurement("first", "2026-07-14", 40, 44)],
      "first",
    );

    assert.equal(comparison.hasComparison, false);
    assert.equal(comparison.previousMeasurementId, null);
  });

  it("does not calculate a leg with a missing current value", () => {
    const change = calculateMeasurementChange(null, 40);

    assert.deepEqual(change, {
      changeKg: null,
      changePct: null,
      hasComparison: false,
    });
  });

  it("does not calculate a leg with a missing previous value", () => {
    const change = calculateMeasurementChange(44, null);

    assert.deepEqual(change, {
      changeKg: null,
      changePct: null,
      hasComparison: false,
    });
  });

  it("keeps the kilogram change but omits percentage after a zero value", () => {
    const change = calculateMeasurementChange(4, 0);

    assert.equal(change.changeKg, 4);
    assert.equal(change.changePct, null);
    assert.equal(change.hasComparison, true);
  });

  it("never returns NaN or Infinity", () => {
    const invalidChanges = [
      calculateMeasurementChange(Number.NaN, 40),
      calculateMeasurementChange(44, Number.POSITIVE_INFINITY),
      calculateMeasurementChange(Number.NEGATIVE_INFINITY, 0),
      calculateMeasurementChange(4, 0),
    ];

    invalidChanges.forEach((change) => {
      assert.ok(change.changeKg === null || Number.isFinite(change.changeKg));
      assert.ok(change.changePct === null || Number.isFinite(change.changePct));
    });
  });

  it("selects the chronologically nearest older measurement", () => {
    const measurements = [
      measurement("oldest", "2026-07-01", 35, 36),
      measurement("nearest", "2026-07-14", 40, 41),
      measurement("current", "2026-07-21", 44, 45),
    ];
    const comparison = getMeasurementComparison(measurements, "current");

    assert.equal(comparison.previousMeasurementId, "nearest");
    assert.equal(comparison.previousMeasurementDate, "2026-07-14");
  });

  it("uses measurement chronology after a historical insertion", () => {
    const measurements = [
      measurement("oldest", "2026-07-01", 35, 36),
      measurement("current", "2026-07-21", 44, 45),
      measurement("inserted-later", "2026-07-14", 42, 43, {
        createdAt: "2026-07-30T12:00:00.000Z",
      }),
    ];
    const comparison = getMeasurementComparison(measurements, "current");

    assert.equal(comparison.previousMeasurementId, "inserted-later");
    assert.equal(comparison.left.changeKg, 2);
  });

  it("recalculates the following comparison after editing a historical value", () => {
    const measurements = [
      measurement("previous", "2026-07-14", 40, 41),
      measurement("current", "2026-07-21", 44, 45),
    ];
    const beforeEdit = getMeasurementComparison(measurements, "current");
    const editedMeasurements = measurements.map((item) =>
      item.id === "previous" ? { ...item, leftForceKg: 42 } : item,
    );
    const afterEdit = getMeasurementComparison(editedMeasurements, "current");

    assert.equal(beforeEdit.left.changeKg, 4);
    assert.equal(afterEdit.left.changeKg, 2);
  });

  it("uses created_at and source_row for multiple measurements on one day", () => {
    const measurements = [
      measurement("same-time-row-10", "2026-07-14", 40, 40, {
        createdAt: "2026-07-14T08:00:00.000Z",
        sourceRow: 10,
      }),
      measurement("same-time-row-11", "2026-07-14", 41, 41, {
        createdAt: "2026-07-14T08:00:00.000Z",
        sourceRow: 11,
      }),
      measurement("later-created", "2026-07-14", 42, 42, {
        createdAt: "2026-07-14T09:00:00.000Z",
        sourceRow: null,
      }),
    ];

    assert.ok(
      compareMeasurementsChronologically(measurements[0], measurements[1]) < 0,
    );
    const comparison = getMeasurementComparison(measurements, "later-created");
    assert.equal(comparison.previousMeasurementId, "same-time-row-11");
  });

  it("excludes archived measurements from the previous reference", () => {
    const measurements = [
      measurement("active-older", "2026-07-01", 40, 40),
      measurement("archived-nearer", "2026-07-14", 50, 50, {
        archivedAt: "2026-07-20T10:00:00.000Z",
      }),
      measurement("current", "2026-07-21", 60, 60),
    ];
    const comparison = getMeasurementComparison(measurements, "current");

    assert.equal(comparison.previousMeasurementId, "active-older");
    assert.equal(comparison.left.changeKg, 20);
  });
});
