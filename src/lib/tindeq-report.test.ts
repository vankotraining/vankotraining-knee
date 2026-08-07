import assert from "node:assert/strict";
import test from "node:test";
import type { RepetitionResult, SideMetrics, SideSummary, TindeqSession } from "./tindeq-browser.js";
import { buildTindeqReportFromSession, buildTindeqReportFromStoredSession } from "./tindeq-report.js";
import type { StoredTindeqSession } from "./tindeq-persistence.js";

function sideMetrics(meanPctTarget = 100, timeIn5Pct = 80, cvPct = 3): SideMetrics {
  return {
    meanForce: 40 * meanPctTarget / 100,
    meanPctTarget,
    cvPct,
    meanAbsErrorPctPoints: Math.abs(meanPctTarget - 100),
    timeIn5Pct,
    timeIn10Pct: Math.min(100, timeIn5Pct + 10),
    peakPctTarget: meanPctTarget + 3,
    overshootPctPoints: Math.max(0, meanPctTarget - 100),
    driftPctTargetPerSecond: -0.1,
    timeTo95Seconds: meanPctTarget >= 95 ? 0.5 : null,
  };
}

function summary(overrides: Partial<SideSummary> = {}): SideSummary {
  return {
    meanPctTarget: 100,
    betweenRepCvPct: 4,
    medianWithinRepCvPct: 3,
    meanTimeIn5Pct: 80,
    meanTimeIn10Pct: 90,
    meanAbsErrorPctPoints: 2,
    trendPctTargetPerRep: -0.2,
    firstToLastChangePctPoints: -2,
    ...overrides,
  };
}

function repetition(index: number, options: {
  leftPct?: number;
  rightPct?: number;
  leftTime?: number;
  rightTime?: number;
  leftCv?: number;
  rightCv?: number;
  flags?: string[];
  incompleteEnd?: boolean;
} = {}): RepetitionResult {
  return {
    repetition: index,
    onsetSeconds: index * 10,
    endSeconds: index * 10 + 5,
    durationSeconds: 5,
    incompleteEnd: options.incompleteEnd ?? false,
    releaseRecorded: !(options.incompleteEnd ?? false),
    rightMinusLeftOnsetSeconds: 0.1,
    left: sideMetrics(options.leftPct ?? 100, options.leftTime ?? 80, options.leftCv ?? 3),
    right: sideMetrics(options.rightPct ?? 100, options.rightTime ?? 80, options.rightCv ?? 3),
    flags: options.flags ?? [],
    curveLeftPct: [95, 100, 101],
    curveRightPct: [96, 100, 102],
  };
}

function fixture(options: {
  expected?: number;
  detected?: number;
  repetitions?: RepetitionResult[];
  leftSummary?: Partial<SideSummary>;
  rightSummary?: Partial<SideSummary>;
} = {}): TindeqSession {
  const reps = options.repetitions ?? Array.from({ length: 5 }, (_, index) => repetition(index + 1));
  return {
    id: "session-1",
    sourceName: "fixture.zip",
    datasetName: "data_set_1.csv",
    metadata: {
      measuredAt: "2026-08-02T12:00:00",
      tag: "Testovací klient",
      tagKey: "testovaci klient",
      comment: "",
      unit: "kg",
      repetitions: options.expected ?? 5,
      workDurationSeconds: 5,
      pauseBetweenRepetitionsSeconds: 5,
      sets: 1,
      pauseBetweenSetsSeconds: 0,
      type: "Repeaters",
      mvcLeft: 50,
      mvcRight: 52,
      workLevelPct: 80,
      restLevelPct: 5,
    },
    analysis: {
      samplingHz: 80,
      targets: { left: 40, right: 41.6 },
      restTargets: { left: 2.5, right: 2.6 },
      detectedRepetitions: options.detected ?? reps.length,
      expectedRepetitions: options.expected ?? 5,
      repetitions: reps,
      summary: {
        left: summary(options.leftSummary),
        right: summary(options.rightSummary),
        meanAbsOnsetDifferenceSeconds: 0.1,
        meanSignedOnsetDifferenceSeconds: 0.05,
        domains: { accuracy: "Dobrá", control: "Stabilní", maintenance: "Bez poklesu" },
      },
      warnings: [],
    },
  };
}

test("splněná série s přijatelnou bolestí doporučí progresi", () => {
  const report = buildTindeqReportFromSession(fixture(), {
    athleteName: "Testovací klient",
    clinicalContext: { kneeAngleDegrees: 60, painBefore: 1, painDuring: 2, painAfter: 1 },
  });
  assert.equal(report.interpretation.status, "splněno");
  assert.equal(report.recommendation.action, "progrese");
  assert.equal(report.context.kneeAngleDegrees, 60);
  assert.equal(report.performance.left.successRatePct, 100);
});

test("bez bolesti dobrý výkon nevede automaticky k progresi", () => {
  const report = buildTindeqReportFromSession(fixture(), { athleteName: "Testovací klient" });
  assert.equal(report.interpretation.status, "splněno");
  assert.equal(report.recommendation.action, "doplnění údajů před rozhodnutím");
  assert.ok(report.context.missingData.includes("bolest před, během a po cvičení"));
});

test("mírný konzistentní pokles je označen jako běžná únava", () => {
  const report = buildTindeqReportFromSession(
    fixture({
      leftSummary: { trendPctTargetPerRep: -1, firstToLastChangePctPoints: -10 },
      rightSummary: { trendPctTargetPerRep: -0.8, firstToLastChangePctPoints: -8 },
    }),
    { clinicalContext: { painBefore: 1, painDuring: 2, painAfter: 1 } },
  );
  assert.equal(report.fatigue.pattern, "výkonový průběh odpovídá běžné únavě");
  assert.equal(report.interpretation.status, "hraniční");
  assert.equal(report.recommendation.action, "zachování");
});

test("neúplný záznam doporučí opakování měření", () => {
  const reps = [repetition(1, { incompleteEnd: true }), repetition(2, { incompleteEnd: true })];
  const report = buildTindeqReportFromSession(
    fixture({ expected: 5, detected: 2, repetitions: reps }),
    { clinicalContext: { painBefore: 0, painDuring: 0, painAfter: 0 } },
  );
  assert.equal(report.interpretation.status, "technicky nehodnotitelné");
  assert.equal(report.recommendation.action, "opakování měření");
});

test("vysoká variabilita vede k technické úpravě místo automatické regrese", () => {
  const flagged = Array.from({ length: 5 }, (_, index) =>
    repetition(index + 1, { leftCv: 10, rightCv: 9, flags: ["Levá: nestabilní"] }),
  );
  const report = buildTindeqReportFromSession(
    fixture({
      repetitions: flagged,
      leftSummary: { medianWithinRepCvPct: 10, betweenRepCvPct: 14 },
      rightSummary: { medianWithinRepCvPct: 9, betweenRepCvPct: 13 },
    }),
    { clinicalContext: { painBefore: 1, painDuring: 2, painAfter: 1 } },
  );
  assert.equal(report.control.finding.status, "nesplněno");
  assert.equal(report.recommendation.action, "technická úprava provedení");
  assert.equal(report.fatigue.pattern, "nekonzistentní nebo technický průběh");
});

test("hraniční bolestivá reakce zachová zatížení", () => {
  const report = buildTindeqReportFromSession(fixture(), {
    clinicalContext: { painBefore: 1, painDuring: 4, painAfter: 2 },
  });
  assert.equal(report.reaction.finding.status, "hraniční");
  assert.equal(report.interpretation.status, "hraniční");
  assert.equal(report.recommendation.action, "zachování");
});

test("výrazná bolestivá reakce doporučí regresi", () => {
  const report = buildTindeqReportFromSession(fixture(), {
    clinicalContext: { painBefore: 1, painDuring: 6, painAfter: 4 },
  });
  assert.equal(report.interpretation.status, "nesplněno");
  assert.equal(report.recommendation.action, "regrese");
});

test("uložený normalizovaný záznam vytváří stejný rozhodovací výstup", () => {
  const current = fixture();
  const stored: StoredTindeqSession = {
    id: "00000000-0000-4000-8000-000000000001",
    athlete_id: "00000000-0000-4000-8000-000000000002",
    measured_at: new Date(current.metadata.measuredAt).toISOString(),
    imported_at: "2026-08-02T12:05:00.000Z",
    source_filename: current.sourceName,
    source_dataset_name: current.datasetName,
    source_tag: current.metadata.tag,
    protocol_name: current.metadata.type,
    target_force_left_kg: 40,
    target_force_right_kg: 41.6,
    sampling_rate_hz: 80,
    detected_repetitions: 5,
    expected_repetitions: 5,
    left_summary: current.analysis.summary.left,
    right_summary: current.analysis.summary.right,
    overall_summary: {
      domains: current.analysis.summary.domains,
      meanAbsOnsetDifferenceSeconds: 0.1,
      meanSignedOnsetDifferenceSeconds: 0.05,
      restTargetLeftKg: 2.5,
      restTargetRightKg: 2.6,
      sourceForceUnit: "kg",
      storedForceUnit: "kg",
    },
    repetitions: current.analysis.repetitions.map((rep) => {
      const { meanForce: leftMeanForce, ...left } = rep.left;
      const { meanForce: rightMeanForce, ...right } = rep.right;
      return {
        ...rep,
        left: { ...left, meanForceKg: leftMeanForce },
        right: { ...right, meanForceKg: rightMeanForce },
      };
    }),
    warnings: [],
    analysis_version: "tindeq-repeaters-v1",
    raw_metadata: {
      tindeqSessionId: current.id,
      tagKey: current.metadata.tagKey,
      comment: "",
      sourceForceUnit: "kg",
      repetitions: 5,
      workDurationSeconds: 5,
      pauseBetweenRepetitionsSeconds: 5,
      sets: 1,
      pauseBetweenSetsSeconds: 0,
      mvcLeftKg: 50,
      mvcRightKg: 52,
      workLevelPct: 80,
      restLevelPct: 5,
    },
    created_at: "2026-08-02T12:05:00.000Z",
  };
  const report = buildTindeqReportFromStoredSession(stored, {
    athleteName: "Testovací klient",
    clinicalContext: { kneeAngleDegrees: 60, painBefore: 1, painDuring: 2, painAfter: 1 },
  });
  assert.equal(report.interpretation.status, "splněno");
  assert.equal(report.recommendation.action, "progrese");
  assert.equal(report.context.previousMaxRightKg, 52);
});
