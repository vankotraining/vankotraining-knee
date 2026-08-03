import assert from "node:assert/strict";
import test from "node:test";
import type { TindeqSession } from "./tindeq-browser.js";
import {
  calculateMaximumMeasurement,
  calculateTargetForce,
  createImportFingerprint,
  evaluateTindeqSessionSide,
  extractClientNameFromTindeqFilename,
  getTindeqClientNameCandidate,
  matchAthletesByExactName,
  normalizeClientName,
  parseOptionalPain,
  stableImportFingerprintMaterial,
} from "./tindeq-workflow.js";

function sideMetrics(meanForce: number, peakPctTarget: number) {
  return {
    meanForce,
    meanPctTarget: null,
    cvPct: 3,
    meanAbsErrorPctPoints: 2,
    timeIn5Pct: 80,
    timeIn10Pct: 95,
    peakPctTarget,
    overshootPctPoints: 4,
    driftPctTargetPerSecond: -0.1,
    timeTo95Seconds: 0.4,
  };
}

function summary() {
  return {
    meanPctTarget: 100,
    betweenRepCvPct: 4,
    medianWithinRepCvPct: 3,
    meanTimeIn5Pct: 80,
    meanTimeIn10Pct: 95,
    meanAbsErrorPctPoints: 2,
    trendPctTargetPerRep: -1,
    firstToLastChangePctPoints: -5,
  };
}

function fixture(overrides: Partial<TindeqSession> = {}): TindeqSession {
  const session: TindeqSession = {
    id: "session-one",
    sourceName: "repeaters_2026_31_07_11_34_20260731 Kominak Norbert 2.zip",
    datasetName: "data_set_1.csv",
    metadata: {
      measuredAt: "2026-07-31T11:34:00",
      tag: "Kominak Norbert",
      tagKey: "kominak norbert",
      comment: "",
      unit: "kg",
      repetitions: 3,
      workDurationSeconds: 5,
      pauseBetweenRepetitionsSeconds: 2,
      sets: 1,
      pauseBetweenSetsSeconds: 0,
      type: "Repeaters",
      mvcLeft: 50,
      mvcRight: 55,
      workLevelPct: 70,
      restLevelPct: 0,
    },
    analysis: {
      samplingHz: 20,
      targets: { left: 35, right: 38.5 },
      restTargets: { left: 0, right: 0 },
      detectedRepetitions: 3,
      expectedRepetitions: 3,
      repetitions: [
        {
          repetition: 1,
          onsetSeconds: 1,
          endSeconds: 6,
          durationSeconds: 5,
          incompleteEnd: false,
          releaseRecorded: true,
          rightMinusLeftOnsetSeconds: 0,
          left: sideMetrics(34, 105),
          right: sideMetrics(38, 104),
          flags: [],
          curveLeftPct: [95, 100, 98],
          curveRightPct: [96, 101, 99],
        },
        {
          repetition: 2,
          onsetSeconds: 8,
          endSeconds: 13,
          durationSeconds: 5,
          incompleteEnd: false,
          releaseRecorded: true,
          rightMinusLeftOnsetSeconds: 0.02,
          left: sideMetrics(35, 103),
          right: sideMetrics(39, 106),
          flags: [],
          curveLeftPct: [98, 101, 100],
          curveRightPct: [97, 102, 101],
        },
        {
          repetition: 3,
          onsetSeconds: 15,
          endSeconds: 20,
          durationSeconds: 5,
          incompleteEnd: false,
          releaseRecorded: true,
          rightMinusLeftOnsetSeconds: -0.01,
          left: sideMetrics(32, 99),
          right: sideMetrics(37, 101),
          flags: [],
          curveLeftPct: [92, 96, 94],
          curveRightPct: [94, 98, 96],
        },
      ],
      summary: {
        left: summary(),
        right: summary(),
        meanAbsOnsetDifferenceSeconds: 0.01,
        meanSignedOnsetDifferenceSeconds: 0,
        domains: {
          accuracy: "Dobrá",
          control: "Stabilní",
          maintenance: "Mírný pokles",
        },
      },
      warnings: [],
    },
  };
  return { ...session, ...overrides };
}

const athletes = [
  { id: "1", display_name: "Kominak Norbert" },
  { id: "2", display_name: "Novák Jan" },
];

test("maximum calculates Nm, Nm/kg, asymmetry and weaker side", () => {
  const result = calculateMaximumMeasurement({
    bodyWeightKg: 80,
    shinLengthCm: 40,
    leftForceKg: 50,
    rightForceKg: 60,
  });
  assert.ok(Math.abs(result.leftMomentNm - 196.133) < 0.001);
  assert.ok(Math.abs(result.rightMomentNm - 235.3596) < 0.001);
  assert.ok(Math.abs(result.leftNmPerKg - 2.4516625) < 0.00001);
  assert.ok(Math.abs(result.rightNmPerKg - 2.941995) < 0.00001);
  assert.ok(Math.abs(result.asymmetryPct - 16.6666667) < 0.0001);
  assert.equal(result.weakerSide, "left");
});

for (const invalid of [
  { bodyWeightKg: 0, shinLengthCm: 40, leftForceKg: 50, rightForceKg: 60 },
  { bodyWeightKg: 80, shinLengthCm: 0, leftForceKg: 50, rightForceKg: 60 },
  { bodyWeightKg: 80, shinLengthCm: 40, leftForceKg: Number.NaN, rightForceKg: 60 },
  { bodyWeightKg: 80, shinLengthCm: 40, leftForceKg: 50, rightForceKg: -1 },
]) {
  test(`maximum rejects invalid values ${JSON.stringify(invalid)}`, () => {
    assert.throws(() => calculateMaximumMeasurement(invalid));
  });
}

test("target force is reference multiplied by prescribed percentage", () => {
  assert.equal(calculateTargetForce(50, 70), 35);
  assert.throws(() => calculateTargetForce(0, 70));
  assert.throws(() => calculateTargetForce(50, Number.NaN));
});

test("filename extraction follows the actual repeaters filename shape", () => {
  assert.equal(
    extractClientNameFromTindeqFilename(
      "repeaters_2026_31_07_11_34_20260731 Kominak Norbert 2.zip",
    ),
    "Kominak Norbert",
  );
  assert.equal(extractClientNameFromTindeqFilename("other.zip"), null);
  assert.equal(getTindeqClientNameCandidate(fixture()), "Kominak Norbert");
});

test("normalization ignores case and repeated surrounding whitespace only", () => {
  assert.equal(normalizeClientName("  KOMINAK   Norbert "), "kominak norbert");
});

test("one exact normalized match is selected", () => {
  const result = matchAthletesByExactName("  KOMINAK  NORBERT ", athletes);
  assert.equal(result.kind, "exact");
  if (result.kind !== "exact") throw new Error("Expected exact match");
  assert.equal(result.matches[0].id, "1");
});

test("no exact match remains unassigned", () => {
  const result = matchAthletesByExactName("Kominák Norbert", athletes);
  assert.equal(result.kind, "none");
  assert.equal(result.matches.length, 0);
});

test("two exact display names require manual confirmation", () => {
  const result = matchAthletesByExactName("Jan Novak", [
    { id: "1", display_name: "Jan Novak" },
    { id: "2", display_name: "JAN NOVAK" },
  ]);
  assert.equal(result.kind, "ambiguous");
  assert.equal(result.matches.length, 2);
});

test("missing export name requires manual selection", () => {
  assert.equal(matchAthletesByExactName(null, athletes).kind, "missing");
});

test("similar but non-identical name is never fuzzy matched", () => {
  assert.equal(matchAthletesByExactName("Kominak Norber", athletes).kind, "none");
});

test("pain preserves missing value and actual zero", () => {
  assert.equal(parseOptionalPain(""), null);
  assert.equal(parseOptionalPain(null), null);
  assert.equal(parseOptionalPain("0"), 0);
  assert.equal(parseOptionalPain("2,5"), 2.5);
  assert.throws(() => parseOptionalPain("11"));
  assert.throws(() => parseOptionalPain("abc"));
});

test("exercise evaluation uses selected side and reference snapshot", () => {
  const result = evaluateTindeqSessionSide(fixture(), "left", 50, 70);
  assert.equal(result.repetitionCount, 3);
  assert.deepEqual(result.repetitionMeanForcesKg, [34, 35, 32]);
  assert.equal(result.meanForceKg, 33.6667);
  assert.equal(result.bestRepForceKg, 35);
  assert.equal(result.weakestRepForceKg, 32);
  assert.equal(result.meanPctReference, 67.3333);
  assert.equal(result.meanPctTarget, 96.1905);
  assert.equal(result.firstToLastChangePctPoints, -5.7143);
  assert.equal(result.totalWorkSeconds, 15);
  for (const value of Object.values(result)) {
    if (typeof value === "number") assert.ok(Number.isFinite(value));
  }
});

test("missing reference leaves reference-dependent metrics null without guessing", () => {
  const result = evaluateTindeqSessionSide(fixture(), "right", null, null);
  assert.equal(result.meanPctReference, null);
  assert.equal(result.meanPctTarget, null);
  assert.equal(result.firstToLastChangePctPoints, null);
});

test("historical evaluation is reproduced from its snapshot after a later maximum exists", () => {
  const stored = evaluateTindeqSessionSide(fixture(), "left", 50, 70);
  const laterMaximumEvaluation = evaluateTindeqSessionSide(fixture(), "left", 60, 70);
  assert.equal(stored.meanPctReference, 67.3333);
  assert.notEqual(laterMaximumEvaluation.meanPctReference, stored.meanPctReference);
  assert.equal(stored.meanPctTarget, 96.1905);
});

test("fingerprint material does not include source filename, pain or prescription", () => {
  const first = stableImportFingerprintMaterial(fixture(), "athlete", "left");
  const renamed = fixture({ sourceName: "renamed.zip" });
  assert.equal(stableImportFingerprintMaterial(renamed, "athlete", "left"), first);
  assert.notEqual(stableImportFingerprintMaterial(fixture(), "athlete", "right"), first);
  assert.notEqual(stableImportFingerprintMaterial(fixture(), "other-athlete", "left"), first);
});

test("SHA-256 import fingerprint is stable and changes with normalized result", async () => {
  const first = await createImportFingerprint(fixture(), "athlete", "left");
  const second = await createImportFingerprint(fixture(), "athlete", "left");
  assert.equal(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);

  const changed = fixture();
  changed.analysis.repetitions[0].left.meanForce = 30;
  assert.notEqual(await createImportFingerprint(changed, "athlete", "left"), first);
});
