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
    test.rightNmPerKg === null ||
    test.leftForceKg === null ||
    test.rightForceKg === null ||
    targetKg === null
  ) {
    return null;
  }

  const weakerNm = Math.min(test.leftNmPerKg, test.rightNmPerKg);
  const weakerForce = Math.min(test.leftForceKg, test.rightForceKg);
  const missingNm = Math.max(0, NORM_NM_PER_KG - weakerNm);

  return {
    missingKg: Math.max(0, targetKg - weakerForce),
    missingNm,
    missingPct: (missingNm / NORM_NM_PER_KG) * 100,
  };
}
