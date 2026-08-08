import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  RepetitionResult,
  SideMetrics,
  SideSummary,
  TindeqSession,
} from "./tindeq-browser.js";

export const TINDEQ_ANALYSIS_VERSION = "tindeq-repeaters-v1";
export const TINDEQ_HISTORY_SELECT =
  "id,athlete_id,measured_at,imported_at,source_filename,source_dataset_name,source_tag,protocol_name,target_force_left_kg,target_force_right_kg,sampling_rate_hz,detected_repetitions,expected_repetitions,left_summary,right_summary,overall_summary,repetitions,warnings,analysis_version,raw_metadata,created_at";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KILOGRAM_FORCE_PER_NEWTON = 1 / 9.80665;
const KILOGRAMS_PER_POUND = 0.45359237;

type SupportedForceUnit = "kg" | "n" | "lb";

export type TindeqInsertPayload = {
  athlete_id: string;
  measured_at: string;
  source_filename: string;
  source_dataset_name: string;
  source_tag: string | null;
  protocol_name: string | null;
  target_force_left_kg: number | null;
  target_force_right_kg: number | null;
  sampling_rate_hz: number | null;
  detected_repetitions: number;
  expected_repetitions: number;
  left_summary: SideSummary;
  right_summary: SideSummary;
  overall_summary: {
    domains: TindeqSession["analysis"]["summary"]["domains"];
    meanAbsOnsetDifferenceSeconds: number | null;
    meanSignedOnsetDifferenceSeconds: number | null;
    restTargetLeftKg: number | null;
    restTargetRightKg: number | null;
    sourceForceUnit: string;
    storedForceUnit: "kg";
  };
  repetitions: StoredRepetitionResult[];
  warnings: string[];
  analysis_version: string;
  raw_metadata: {
    tindeqSessionId: string;
    tagKey: string;
    comment: string;
    sourceForceUnit: string;
    repetitions: number;
    workDurationSeconds: number;
    pauseBetweenRepetitionsSeconds: number;
    sets: number;
    pauseBetweenSetsSeconds: number;
    mvcLeftKg: number | null;
    mvcRightKg: number | null;
    workLevelPct: number;
    restLevelPct: number;
  };
};

export type StoredSideMetrics = Omit<SideMetrics, "meanForce"> & {
  meanForceKg: number | null;
};

export type StoredRepetitionResult = Omit<RepetitionResult, "left" | "right"> & {
  left: StoredSideMetrics;
  right: StoredSideMetrics;
};

export type StoredTindeqSession = {
  id: string;
  athlete_id: string;
  measured_at: string;
  imported_at: string;
  source_filename: string;
  source_dataset_name: string;
  source_tag: string | null;
  protocol_name: string | null;
  target_force_left_kg: number | null;
  target_force_right_kg: number | null;
  sampling_rate_hz: number | null;
  detected_repetitions: number;
  expected_repetitions: number;
  left_summary: SideSummary;
  right_summary: SideSummary;
  overall_summary: TindeqInsertPayload["overall_summary"];
  repetitions: StoredRepetitionResult[];
  warnings: string[];
  analysis_version: string;
  raw_metadata: TindeqInsertPayload["raw_metadata"];
  created_at: string;
};

export type SaveTindeqSessionResult =
  | {
      ok: true;
      sourceSessionId: string;
      sourceTag: string;
      record: StoredTindeqSession;
    }
  | {
      ok: false;
      sourceSessionId: string;
      sourceTag: string;
      error: string;
    };

function finiteOrNull(value: number | null | undefined): number | null {
  return value !== null && value !== undefined && Number.isFinite(value) ? value : null;
}

function normalizeForceUnit(unit: string): SupportedForceUnit | null {
  const normalized = unit.trim().toLocaleLowerCase("en-US").replace(/\s+/g, "");
  if (["kg", "kgf", "kilogram", "kilograms"].includes(normalized)) return "kg";
  if (["n", "newton", "newtons"].includes(normalized)) return "n";
  if (["lb", "lbs", "lbf", "pound", "pounds"].includes(normalized)) return "lb";
  return null;
}

export function forceToKg(value: number | null | undefined, unit: string): number | null {
  const finite = finiteOrNull(value);
  if (finite === null) return null;
  const normalizedUnit = normalizeForceUnit(unit);
  if (normalizedUnit === "kg") return finite;
  if (normalizedUnit === "n") return finite * KILOGRAM_FORCE_PER_NEWTON;
  if (normalizedUnit === "lb") return finite * KILOGRAMS_PER_POUND;
  return null;
}

function normalizeSideMetrics(metrics: SideMetrics, unit: string): StoredSideMetrics {
  const { meanForce, ...rest } = metrics;
  return {
    ...rest,
    meanForceKg: forceToKg(meanForce, unit),
  };
}

function normalizeRepetition(
  repetition: RepetitionResult,
  unit: string,
): StoredRepetitionResult {
  return {
    ...repetition,
    left: normalizeSideMetrics(repetition.left, unit),
    right: normalizeSideMetrics(repetition.right, unit),
  };
}

function isFiniteNullable(value: unknown) {
  return value === null || (typeof value === "number" && Number.isFinite(value));
}

function validSideSummary(value: unknown): value is SideSummary {
  if (!value || typeof value !== "object") return false;
  const summary = value as Record<string, unknown>;
  return [
    "meanPctTarget",
    "betweenRepCvPct",
    "medianWithinRepCvPct",
    "meanTimeIn5Pct",
    "meanTimeIn10Pct",
    "meanAbsErrorPctPoints",
    "trendPctTargetPerRep",
    "firstToLastChangePctPoints",
  ].every((key) => isFiniteNullable(summary[key]));
}

export function validateTindeqSessionForSave(
  session: TindeqSession,
  athleteId: string,
  analysisVersion = TINDEQ_ANALYSIS_VERSION,
): string[] {
  const errors: string[] = [];
  if (!UUID_PATTERN.test(athleteId)) errors.push("Chybí platné athlete_id.");
  if (analysisVersion !== TINDEQ_ANALYSIS_VERSION) {
    errors.push("Výsledek používá nepodporovanou verzi analytického modelu.");
  }
  if (!session || typeof session !== "object") {
    return [...errors, "Chybí analyzované měření."];
  }

  const measuredAt = new Date(session.metadata?.measuredAt ?? "");
  if (Number.isNaN(measuredAt.getTime())) errors.push("Datum měření není platné.");
  if (!normalizeForceUnit(session.metadata?.unit ?? "")) {
    errors.push(`Jednotku síly „${session.metadata?.unit || "neuvedena"}“ nelze převést na kg.`);
  }
  if (!Number.isInteger(session.analysis?.detectedRepetitions) || session.analysis.detectedRepetitions < 1) {
    errors.push("Měření neobsahuje žádné analyzované opakování.");
  }
  if (!Array.isArray(session.analysis?.repetitions) || session.analysis.repetitions.length < 1) {
    errors.push("Chybí detail analyzovaných opakování.");
  }
  if (!validSideSummary(session.analysis?.summary?.left)) {
    errors.push("Chybí očekávaný souhrn levé strany.");
  }
  if (!validSideSummary(session.analysis?.summary?.right)) {
    errors.push("Chybí očekávaný souhrn pravé strany.");
  }
  const domains = session.analysis?.summary?.domains;
  if (
    !domains ||
    typeof domains.accuracy !== "string" ||
    typeof domains.control !== "string" ||
    typeof domains.maintenance !== "string"
  ) {
    errors.push("Chybí očekávaný celkový souhrn měření.");
  }
  return errors;
}

export function mapTindeqSessionToInsert(
  session: TindeqSession,
  athleteId: string,
): TindeqInsertPayload {
  const errors = validateTindeqSessionForSave(session, athleteId);
  if (errors.length > 0) throw new Error(errors.join(" "));

  const unit = session.metadata.unit;
  const measuredAt = new Date(session.metadata.measuredAt).toISOString();
  return {
    athlete_id: athleteId,
    measured_at: measuredAt,
    source_filename: session.sourceName,
    source_dataset_name: session.datasetName,
    source_tag: session.metadata.tag.trim() || null,
    protocol_name: session.metadata.type.trim() || null,
    target_force_left_kg: forceToKg(session.analysis.targets.left, unit),
    target_force_right_kg: forceToKg(session.analysis.targets.right, unit),
    sampling_rate_hz: finiteOrNull(session.analysis.samplingHz),
    detected_repetitions: session.analysis.detectedRepetitions,
    expected_repetitions: session.analysis.expectedRepetitions,
    left_summary: { ...session.analysis.summary.left },
    right_summary: { ...session.analysis.summary.right },
    overall_summary: {
      domains: { ...session.analysis.summary.domains },
      meanAbsOnsetDifferenceSeconds: finiteOrNull(
        session.analysis.summary.meanAbsOnsetDifferenceSeconds,
      ),
      meanSignedOnsetDifferenceSeconds: finiteOrNull(
        session.analysis.summary.meanSignedOnsetDifferenceSeconds,
      ),
      restTargetLeftKg: forceToKg(session.analysis.restTargets.left, unit),
      restTargetRightKg: forceToKg(session.analysis.restTargets.right, unit),
      sourceForceUnit: unit,
      storedForceUnit: "kg",
    },
    repetitions: session.analysis.repetitions.map((repetition) =>
      normalizeRepetition(repetition, unit),
    ),
    warnings: [...session.analysis.warnings],
    analysis_version: TINDEQ_ANALYSIS_VERSION,
    raw_metadata: {
      tindeqSessionId: session.id,
      tagKey: session.metadata.tagKey,
      comment: session.metadata.comment,
      sourceForceUnit: unit,
      repetitions: session.metadata.repetitions,
      workDurationSeconds: session.metadata.workDurationSeconds,
      pauseBetweenRepetitionsSeconds: session.metadata.pauseBetweenRepetitionsSeconds,
      sets: session.metadata.sets,
      pauseBetweenSetsSeconds: session.metadata.pauseBetweenSetsSeconds,
      mvcLeftKg: forceToKg(session.metadata.mvcLeft, unit),
      mvcRightKg: forceToKg(session.metadata.mvcRight, unit),
      workLevelPct: session.metadata.workLevelPct,
      restLevelPct: session.metadata.restLevelPct,
    },
  };
}

export async function saveTindeqSessions(
  supabase: SupabaseClient,
  sessions: TindeqSession[],
  athleteId: string,
): Promise<SaveTindeqSessionResult[]> {
  if (sessions.length === 0) {
    return [
      {
        ok: false,
        sourceSessionId: "",
        sourceTag: "Bez měření",
        error: "Není co uložit.",
      },
    ];
  }

  const results: SaveTindeqSessionResult[] = [];
  for (const session of sessions) {
    try {
      const payload = mapTindeqSessionToInsert(session, athleteId);
      const { data, error } = await supabase
        .from("tindeq_sessions")
        .insert(payload)
        .select(TINDEQ_HISTORY_SELECT)
        .single();
      if (error || !data) {
        results.push({
          ok: false,
          sourceSessionId: session.id,
          sourceTag: session.metadata.tag,
          error: error?.message ?? "Databáze nevrátila uložené měření.",
        });
      } else {
        results.push({
          ok: true,
          sourceSessionId: session.id,
          sourceTag: session.metadata.tag,
          record: data as StoredTindeqSession,
        });
      }
    } catch (error) {
      results.push({
        ok: false,
        sourceSessionId: session.id,
        sourceTag: session.metadata?.tag ?? session.id,
        error: error instanceof Error ? error.message : "Měření se nepodařilo připravit.",
      });
    }
  }
  return results;
}

export async function loadTindeqHistory(
  supabase: SupabaseClient,
  athleteId: string,
): Promise<StoredTindeqSession[]> {
  if (!UUID_PATTERN.test(athleteId)) throw new Error("Chybí platné athlete_id.");
  const { data, error } = await supabase
    .from("tindeq_sessions")
    .select(TINDEQ_HISTORY_SELECT)
    .eq("athlete_id", athleteId)
    .is("deleted_at", null)
    .order("measured_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as StoredTindeqSession[];
}
