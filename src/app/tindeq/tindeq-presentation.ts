import type { TindeqPresentationTone } from "@/lib/tindeq-client-view";
import styles from "./tindeq.module.css";

const TONE_CLASSES: Record<TindeqPresentationTone, string> = {
  good: styles.good,
  warning: styles.warning,
  problem: styles.problem,
  neutral: styles.neutral,
};

export function formatTindeqNumber(
  value: number | null | undefined,
  decimals = 1,
  suffix = "",
) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return `${value.toFixed(decimals).replace(".", ",")}${suffix}`;
}

export function formatTindeqSignedNumber(
  value: number | null | undefined,
  decimals = 2,
  suffix = "",
) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  const normalized = Math.abs(value) < 10 ** -(decimals + 1) ? 0 : value;
  const sign = normalized > 0 ? "+" : normalized < 0 ? "−" : "";
  return `${sign}${Math.abs(normalized).toFixed(decimals).replace(".", ",")}${suffix}`;
}

export function formatTindeqDate(value: string) {
  if (!value) return "–";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("cs-CZ", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(parsed);
}

export function tindeqToneClass(tone: TindeqPresentationTone) {
  return TONE_CLASSES[tone];
}
