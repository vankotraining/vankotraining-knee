export const GRAVITY = 9.80665;
export const NORM_NM_PER_KG = 3;

export type WeakerSide = "right" | "left" | "none";

type NormGapInput = {
  leftForceKg: number | null;
  rightForceKg: number | null;
  leftNmPerKg: number | null;
  rightNmPerKg: number | null;
  shinLengthCm: number | null;
  bodyWeightKg: number | null;
};

export function calculateAge(birthDate: string | null | undefined, testDate: string) {
  if (!birthDate) return null;

  const birth = new Date(`${birthDate}T00:00:00`);
  const test = new Date(`${testDate}T00:00:00`);

  if (Number.isNaN(birth.getTime()) || Number.isNaN(test.getTime())) return null;

  return (test.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

export function forceKgToNmPerKg(
  forceKg: number,
  shinLengthCm: number,
  bodyWeightKg: number,
) {
  if (forceKg <= 0 || shinLengthCm <= 0 || bodyWeightKg <= 0) return null;

  return (forceKg * GRAVITY * (shinLengthCm / 100)) / bodyWeightKg;
}

export function targetForceKg(
  shinLengthCm: number | null,
  bodyWeightKg: number | null,
) {
  if (!shinLengthCm || !bodyWeightKg || shinLengthCm <= 0 || bodyWeightKg <= 0) {
    return null;
  }

  return (NORM_NM_PER_KG * bodyWeightKg) / (GRAVITY * (shinLengthCm / 100));
}

export function calculateAsymmetryPct(rightForceKg: number, leftForceKg: number) {
  const strongerForce = Math.max(rightForceKg, leftForceKg);

  return strongerForce > 0
    ? (Math.abs(rightForceKg - leftForceKg) / strongerForce) * 100
    : 0;
}

export function getWeakerSide(rightForceKg: number, leftForceKg: number): WeakerSide {
  if (Math.abs(rightForceKg - leftForceKg) < 0.01) return "none";

  return rightForceKg < leftForceKg ? "right" : "left";
}

export function getAsymmetryValue(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;

  return Math.abs(value) <= 1 ? Math.abs(value) * 100 : Math.abs(value);
}

export function getNormGap(test: NormGapInput | null | undefined) {
  if (!test) return null;

  const targetKg = targetForceKg(test.shinLengthCm, test.bodyWeightKg);

  if (
    test.leftNmPerKg === null ||
    !Number.isFinite(test.leftNmPerKg) ||
    test.leftNmPerKg <= 0 ||
    test.rightNmPerKg === null ||
    !Number.isFinite(test.rightNmPerKg) ||
    test.rightNmPerKg <= 0 ||
    test.leftForceKg === null ||
    !Number.isFinite(test.leftForceKg) ||
    test.leftForceKg <= 0 ||
    test.rightForceKg === null ||
    !Number.isFinite(test.rightForceKg) ||
    test.rightForceKg <= 0 ||
    targetKg === null ||
    !Number.isFinite(targetKg) ||
    targetKg <= 0 ||
    !Number.isFinite(NORM_NM_PER_KG) ||
    NORM_NM_PER_KG <= 0
  ) {
    return null;
  }

  const weakerIsLeft = test.leftNmPerKg <= test.rightNmPerKg;
  const weakerNmPerKg = weakerIsLeft ? test.leftNmPerKg : test.rightNmPerKg;
  const weakerForceKg = weakerIsLeft ? test.leftForceKg : test.rightForceKg;
  const weakerSide: WeakerSide =
    test.leftNmPerKg === test.rightNmPerKg
      ? "none"
      : weakerIsLeft
        ? "left"
        : "right";
  const completionPct = (weakerNmPerKg / NORM_NM_PER_KG) * 100;

  if (!Number.isFinite(completionPct)) return null;

  return {
    weakerSide,
    weakerForceKg,
    weakerNmPerKg,
    missingKg: Math.max(0, targetKg - weakerForceKg),
    missingNm: Math.max(0, NORM_NM_PER_KG - weakerNmPerKg),
    completionPct,
  };
}

export type MeasurementForComparison = {
  id: string;
  testDate: string;
  createdAt: string | null;
  sourceRow: number | null;
  leftForceKg: number | null;
  rightForceKg: number | null;
  archivedAt: string | null;
};

export type MeasurementChange = {
  changeKg: number | null;
  changePct: number | null;
  hasComparison: boolean;
};

export type MeasurementComparison = {
  previousMeasurementId: string | null;
  previousMeasurementDate: string | null;
  left: MeasurementChange;
  right: MeasurementChange;
  hasComparison: boolean;
};

function comparePrimitive(left: number | string, right: number | string) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function timestampForOrdering(value: string | null | undefined) {
  if (!value) return Number.NEGATIVE_INFINITY;

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function sourceRowForOrdering(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : Number.NEGATIVE_INFINITY;
}

function isValidForce(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function compareMeasurementsChronologically(
  left: MeasurementForComparison,
  right: MeasurementForComparison,
) {
  const dateComparison = comparePrimitive(
    timestampForOrdering(left.testDate),
    timestampForOrdering(right.testDate),
  );
  if (dateComparison !== 0) return dateComparison;

  const createdAtComparison = comparePrimitive(
    timestampForOrdering(left.createdAt),
    timestampForOrdering(right.createdAt),
  );
  if (createdAtComparison !== 0) return createdAtComparison;

  const sourceRowComparison = comparePrimitive(
    sourceRowForOrdering(left.sourceRow),
    sourceRowForOrdering(right.sourceRow),
  );
  if (sourceRowComparison !== 0) return sourceRowComparison;

  return comparePrimitive(left.id, right.id);
}

export function calculateMeasurementChange(
  currentForceKg: number | null | undefined,
  previousForceKg: number | null | undefined,
): MeasurementChange {
  if (!isValidForce(currentForceKg) || !isValidForce(previousForceKg)) {
    return { changeKg: null, changePct: null, hasComparison: false };
  }

  const changeKg = currentForceKg - previousForceKg;
  const changePct =
    previousForceKg > 0 ? (changeKg / previousForceKg) * 100 : null;

  return {
    changeKg: Number.isFinite(changeKg) ? changeKg : null,
    changePct:
      changePct !== null && Number.isFinite(changePct) ? changePct : null,
    hasComparison: Number.isFinite(changeKg),
  };
}

export function getMeasurementComparison(
  measurements: MeasurementForComparison[],
  currentMeasurementId: string,
): MeasurementComparison {
  const activeMeasurements = measurements
    .filter((measurement) => measurement.archivedAt === null)
    .slice()
    .sort(compareMeasurementsChronologically);
  const currentIndex = activeMeasurements.findIndex(
    (measurement) => measurement.id === currentMeasurementId,
  );

  if (currentIndex <= 0) {
    return {
      previousMeasurementId: null,
      previousMeasurementDate: null,
      left: { changeKg: null, changePct: null, hasComparison: false },
      right: { changeKg: null, changePct: null, hasComparison: false },
      hasComparison: false,
    };
  }

  const current = activeMeasurements[currentIndex];
  const previous = activeMeasurements[currentIndex - 1];

  return {
    previousMeasurementId: previous.id,
    previousMeasurementDate: previous.testDate,
    left: calculateMeasurementChange(current.leftForceKg, previous.leftForceKg),
    right: calculateMeasurementChange(current.rightForceKg, previous.rightForceKg),
    hasComparison: true,
  };
}
