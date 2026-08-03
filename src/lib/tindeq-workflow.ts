import {
  calculateAsymmetryPct,
  forceKgToNmPerKg,
  getWeakerSide,
  GRAVITY,
} from "./knee-metrics.js";
import type { TindeqSession } from "./tindeq-browser.js";
import { forceToKg } from "./tindeq-persistence.js";

export type ExerciseSide = "left" | "right";
export type ClientMatchMethod = "exact" | "manual";

export type AthleteNameRecord = {
  id: string;
  display_name: string;
};

export type NameMatchResult =
  | { kind: "missing"; candidate: null; matches: [] }
  | { kind: "none"; candidate: string; matches: [] }
  | { kind: "exact"; candidate: string; matches: [AthleteNameRecord] }
  | { kind: "ambiguous"; candidate: string; matches: AthleteNameRecord[] };

export type MaximumMeasurementInput = {
  bodyWeightKg: number;
  shinLengthCm: number;
  leftForceKg: number;
  rightForceKg: number;
};

export type MaximumMeasurementResult = {
  leftMomentNm: number;
  rightMomentNm: number;
  leftNmPerKg: number;
  rightNmPerKg: number;
  asymmetryPct: number;
  weakerSide: "left" | "right" | "none";
};

export type PrescriptionSnapshot = {
  id: string;
  referenceTestId: string;
  referenceTestDate: string;
  referenceForceKg: number;
  prescribedPct: number;
  targetForceKg: number;
};

export type PainSnapshot = {
  before: number | null;
  duringMax: number | null;
  after: number | null;
};

export type SideExerciseEvaluation = {
  repetitionCount: number;
  repetitionMeanForcesKg: number[];
  repetitionPeakForcesKg: Array<number | null>;
  meanForceKg: number | null;
  bestRepForceKg: number | null;
  weakestRepForceKg: number | null;
  meanPctReference: number | null;
  meanPctTarget: number | null;
  consistencyCvPct: number | null;
  firstToLastChangePctPoints: number | null;
  totalWorkSeconds: number | null;
};

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function round(value: number | null, digits = 4): number | null {
  if (value === null || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function mean(values: number[]): number | null {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return null;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function sampleStandardDeviation(values: number[]): number | null {
  const finite = values.filter(Number.isFinite);
  if (finite.length < 2) return finite.length === 1 ? 0 : null;
  const average = mean(finite);
  if (average === null) return null;
  const variance = finite.reduce((sum, value) => sum + (value - average) ** 2, 0) /
    (finite.length - 1);
  return Math.sqrt(variance);
}

export function normalizeClientName(value: string): string {
  return value
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("cs-CZ");
}

export function extractClientNameFromTindeqFilename(sourceName: string): string | null {
  const basename = sourceName.split(/[\\/]/).pop()?.trim() ?? "";
  const match = basename.match(
    /^repeaters_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{8}\s+(.+?)(?:\s+\d+)?\.zip$/iu,
  );
  const candidate = match?.[1]?.trim().replace(/\s+/g, " ") ?? "";
  return candidate || null;
}

export function getTindeqClientNameCandidate(session: TindeqSession): string | null {
  const fromFilename = extractClientNameFromTindeqFilename(session.sourceName);
  if (fromFilename) return fromFilename;
  const tag = session.metadata.tag.trim().replace(/\s+/g, " ");
  if (!tag || normalizeClientName(tag) === "bez tagu") return null;
  return tag;
}

export function matchAthletesByExactName(
  candidate: string | null,
  athletes: AthleteNameRecord[],
): NameMatchResult {
  if (!candidate) return { kind: "missing", candidate: null, matches: [] };
  const normalizedCandidate = normalizeClientName(candidate);
  const matches = athletes.filter(
    (athlete) => normalizeClientName(athlete.display_name) === normalizedCandidate,
  );
  if (matches.length === 0) return { kind: "none", candidate, matches: [] };
  if (matches.length === 1) {
    return { kind: "exact", candidate, matches: [matches[0]] };
  }
  return { kind: "ambiguous", candidate, matches };
}

export function calculateMaximumMeasurement(
  input: MaximumMeasurementInput,
): MaximumMeasurementResult {
  const { bodyWeightKg, shinLengthCm, leftForceKg, rightForceKg } = input;
  if (![bodyWeightKg, shinLengthCm, leftForceKg, rightForceKg].every(finitePositive)) {
    throw new Error("Hmotnost, délka bérce a maxima obou stran musí být kladná konečná čísla.");
  }
  const leverArmM = shinLengthCm / 100;
  const leftMomentNm = leftForceKg * GRAVITY * leverArmM;
  const rightMomentNm = rightForceKg * GRAVITY * leverArmM;
  const leftNmPerKg = forceKgToNmPerKg(leftForceKg, shinLengthCm, bodyWeightKg);
  const rightNmPerKg = forceKgToNmPerKg(rightForceKg, shinLengthCm, bodyWeightKg);
  if (leftNmPerKg === null || rightNmPerKg === null) {
    throw new Error("Relativní moment nelze vypočítat.");
  }
  return {
    leftMomentNm,
    rightMomentNm,
    leftNmPerKg,
    rightNmPerKg,
    asymmetryPct: calculateAsymmetryPct(rightForceKg, leftForceKg),
    weakerSide: getWeakerSide(rightForceKg, leftForceKg),
  };
}

export function calculateTargetForce(referenceForceKg: number, prescribedPct: number): number {
  if (!finitePositive(referenceForceKg)) {
    throw new Error("Referenční maximum musí být kladné konečné číslo.");
  }
  if (!finitePositive(prescribedPct)) {
    throw new Error("Předepsané procento musí být kladné konečné číslo.");
  }
  const target = (referenceForceKg * prescribedPct) / 100;
  if (!finitePositive(target)) throw new Error("Cílovou sílu nelze vypočítat.");
  return target;
}

export function parseOptionalPain(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 10) {
    throw new Error("Bolest musí být číslo od 0 do 10 nebo chybějící údaj.");
  }
  return parsed;
}

export function evaluateTindeqSessionSide(
  session: TindeqSession,
  side: ExerciseSide,
  referenceForceKg: number | null,
  prescribedPct: number | null,
): SideExerciseEvaluation {
  const sourceUnit = session.metadata.unit;
  const sourceTarget = session.analysis.targets[side];
  const repetitionMeanForcesKg = session.analysis.repetitions
    .map((repetition) => forceToKg(repetition[side].meanForce, sourceUnit))
    .filter((value): value is number => value !== null && finitePositive(value));
  const repetitionPeakForcesKg = session.analysis.repetitions.map((repetition) => {
    const peakPct = repetition[side].peakPctTarget;
    if (peakPct === null || sourceTarget === null || !Number.isFinite(peakPct)) return null;
    return round(forceToKg((peakPct * sourceTarget) / 100, sourceUnit));
  });
  const meanForceKg = mean(repetitionMeanForcesKg);
  const bestRepForceKg = repetitionMeanForcesKg.length
    ? Math.max(...repetitionMeanForcesKg)
    : null;
  const weakestRepForceKg = repetitionMeanForcesKg.length
    ? Math.min(...repetitionMeanForcesKg)
    : null;
  const targetForceKg =
    referenceForceKg !== null && prescribedPct !== null
      ? calculateTargetForce(referenceForceKg, prescribedPct)
      : null;
  const average = meanForceKg;
  const standardDeviation = sampleStandardDeviation(repetitionMeanForcesKg);
  const consistencyCvPct =
    average !== null && average > 0 && standardDeviation !== null
      ? (standardDeviation / average) * 100
      : null;
  const first = repetitionMeanForcesKg[0] ?? null;
  const last = repetitionMeanForcesKg.at(-1) ?? null;
  const firstToLastChangePctPoints =
    first !== null && last !== null && targetForceKg !== null
      ? ((last - first) / targetForceKg) * 100
      : null;
  const durations = session.analysis.repetitions
    .map((repetition) => repetition.durationSeconds)
    .filter((value) => Number.isFinite(value) && value >= 0);
  return {
    repetitionCount: repetitionMeanForcesKg.length,
    repetitionMeanForcesKg: repetitionMeanForcesKg.map((value) => round(value) ?? value),
    repetitionPeakForcesKg,
    meanForceKg: round(meanForceKg),
    bestRepForceKg: round(bestRepForceKg),
    weakestRepForceKg: round(weakestRepForceKg),
    meanPctReference:
      average !== null && referenceForceKg !== null && finitePositive(referenceForceKg)
        ? round((average / referenceForceKg) * 100)
        : null,
    meanPctTarget:
      average !== null && targetForceKg !== null
        ? round((average / targetForceKg) * 100)
        : null,
    consistencyCvPct: round(consistencyCvPct),
    firstToLastChangePctPoints: round(firstToLastChangePctPoints),
    totalWorkSeconds: round(durations.length ? durations.reduce((sum, value) => sum + value, 0) : null),
  };
}

export function stableImportFingerprintMaterial(
  session: TindeqSession,
  athleteId: string,
  side: ExerciseSide,
): string {
  const sourceTarget = session.analysis.targets[side];
  return JSON.stringify({
    athleteId,
    side,
    measuredAt: session.metadata.measuredAt,
    datasetName: session.datasetName,
    unit: session.metadata.unit.trim().toLocaleLowerCase("en-US"),
    protocol: session.metadata.type.trim().toLocaleLowerCase("en-US"),
    repetitions: session.analysis.repetitions.map((repetition, index) => {
      const peakPct = repetition[side].peakPctTarget;
      return {
        index: index + 1,
        meanForceKg: round(forceToKg(repetition[side].meanForce, session.metadata.unit)),
        peakForceKg:
          peakPct !== null && sourceTarget !== null && Number.isFinite(peakPct)
            ? round(forceToKg((peakPct * sourceTarget) / 100, session.metadata.unit))
            : null,
        durationSeconds: round(repetition.durationSeconds),
        incompleteEnd: Boolean(repetition.incompleteEnd),
      };
    }),
  });
}

export async function createImportFingerprint(
  session: TindeqSession,
  athleteId: string,
  side: ExerciseSide,
): Promise<string> {
  const material = stableImportFingerprintMaterial(session, athleteId, side);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(material));
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}
