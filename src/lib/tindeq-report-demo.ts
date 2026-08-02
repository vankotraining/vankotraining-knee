import type {
  StoredRepetitionResult,
  StoredSideMetrics,
  StoredTindeqSession,
} from "./tindeq-persistence.js";
import type { TindeqReportClinicalContext } from "./tindeq-report.js";

export const TINDEQ_DEMO_ATHLETE_NAME = "Ukázkový klient";

export const TINDEQ_DEMO_CONTEXT = {
  kneeAngleDegrees: 60,
  painBefore: 1,
  painDuring: 2,
  painAfter: 1,
} satisfies TindeqReportClinicalContext;

const LEFT_TARGET_KG = 36;
const RIGHT_TARGET_KG = 38.4;
const LEFT_PERCENTAGES = [101, 100.5, 100, 99, 97.5];
const RIGHT_PERCENTAGES = [100.5, 100, 99.5, 98.5, 97];
const LEFT_TIME_IN_TARGET = [82, 80, 78, 76, 74];
const RIGHT_TIME_IN_TARGET = [78, 76, 74, 72, 68];

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function sideMetrics(
  targetKg: number,
  targetPercentage: number,
  timeInTargetPercentage: number,
  cvPercentage: number,
  timeTo95Seconds: number,
): StoredSideMetrics {
  const peakPercentage = targetPercentage + 2.5;
  return {
    meanForceKg: round(targetKg * targetPercentage / 100),
    meanPctTarget: targetPercentage,
    cvPct: cvPercentage,
    meanAbsErrorPctPoints: round(Math.abs(targetPercentage - 100), 1),
    timeIn5Pct: timeInTargetPercentage,
    timeIn10Pct: Math.min(100, timeInTargetPercentage + 14),
    peakPctTarget: peakPercentage,
    overshootPctPoints: round(Math.max(0, peakPercentage - 100), 1),
    driftPctTargetPerSecond: -0.1,
    timeTo95Seconds,
  };
}

function repetition(index: number): StoredRepetitionResult {
  const zeroBasedIndex = index - 1;
  const onsetSeconds = zeroBasedIndex * 10;
  const leftPercentage = LEFT_PERCENTAGES[zeroBasedIndex];
  const rightPercentage = RIGHT_PERCENTAGES[zeroBasedIndex];

  return {
    repetition: index,
    onsetSeconds,
    endSeconds: onsetSeconds + 5,
    durationSeconds: 5,
    incompleteEnd: false,
    releaseRecorded: true,
    rightMinusLeftOnsetSeconds: 0.08,
    left: sideMetrics(
      LEFT_TARGET_KG,
      leftPercentage,
      LEFT_TIME_IN_TARGET[zeroBasedIndex],
      3.1 + zeroBasedIndex * 0.2,
      0.42 + zeroBasedIndex * 0.02,
    ),
    right: sideMetrics(
      RIGHT_TARGET_KG,
      rightPercentage,
      RIGHT_TIME_IN_TARGET[zeroBasedIndex],
      3.4 + zeroBasedIndex * 0.2,
      0.45 + zeroBasedIndex * 0.02,
    ),
    flags: [],
    curveLeftPct: [95, leftPercentage, leftPercentage + 1, leftPercentage],
    curveRightPct: [95, rightPercentage, rightPercentage + 1, rightPercentage],
  };
}

export const TINDEQ_DEMO_SESSION = {
  id: "demo-tindeq-report-session",
  athlete_id: "demo-athlete",
  measured_at: "2026-08-01T14:30:00.000Z",
  imported_at: "2026-08-01T14:35:00.000Z",
  source_filename: "anonymni-ukazka.zip",
  source_dataset_name: "repeaters_demo.csv",
  source_tag: "Ukázkový klient",
  protocol_name: "Izometrická extenze kolene – repeaters",
  target_force_left_kg: LEFT_TARGET_KG,
  target_force_right_kg: RIGHT_TARGET_KG,
  sampling_rate_hz: 80,
  detected_repetitions: 5,
  expected_repetitions: 5,
  left_summary: {
    meanPctTarget: 99.6,
    betweenRepCvPct: 5.2,
    medianWithinRepCvPct: 3.5,
    meanTimeIn5Pct: 78,
    meanTimeIn10Pct: 92,
    meanAbsErrorPctPoints: 1.0,
    trendPctTargetPerRep: -0.48,
    firstToLastChangePctPoints: -3.5,
  },
  right_summary: {
    meanPctTarget: 99.1,
    betweenRepCvPct: 5.8,
    medianWithinRepCvPct: 3.8,
    meanTimeIn5Pct: 74,
    meanTimeIn10Pct: 88,
    meanAbsErrorPctPoints: 1.1,
    trendPctTargetPerRep: -0.65,
    firstToLastChangePctPoints: -3.5,
  },
  overall_summary: {
    domains: {
      accuracy: "Cíl splněn na obou stranách",
      control: "Stabilní průběh",
      maintenance: "Bez významného poklesu",
    },
    meanAbsOnsetDifferenceSeconds: 0.08,
    meanSignedOnsetDifferenceSeconds: 0.04,
    restTargetLeftKg: 2.25,
    restTargetRightKg: 2.4,
    sourceForceUnit: "kg",
    storedForceUnit: "kg",
  },
  repetitions: Array.from({ length: 5 }, (_, index) => repetition(index + 1)),
  warnings: [],
  analysis_version: "tindeq-repeaters-v1",
  raw_metadata: {
    tindeqSessionId: "demo-session",
    tagKey: "ukazkovy klient",
    comment: "Anonymní demonstrační data bez vazby na skutečného klienta.",
    sourceForceUnit: "kg",
    repetitions: 5,
    workDurationSeconds: 5,
    pauseBetweenRepetitionsSeconds: 5,
    sets: 1,
    pauseBetweenSetsSeconds: 0,
    mvcLeftKg: 45,
    mvcRightKg: 48,
    workLevelPct: 80,
    restLevelPct: 5,
  },
  created_at: "2026-08-01T14:35:00.000Z",
} satisfies StoredTindeqSession;
