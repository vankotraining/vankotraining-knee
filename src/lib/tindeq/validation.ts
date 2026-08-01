export function validateClinicalScale(value: unknown, field: "pain" | "rpe") {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10) {
    throw new Error(`${field} must be an integer from 0 to 10 or null`);
  }
  return parsed;
}

export function isReadableTag(value: string | null) {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length >= 2 && /[\p{L}\p{N}]/u.test(trimmed);
}
