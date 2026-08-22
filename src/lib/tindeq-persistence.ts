import type { SupabaseClient } from "@supabase/supabase-js";
import type { TindeqSession } from "./tindeq-browser.js";
import * as core from "./tindeq-persistence-core";

export const TINDEQ_ANALYSIS_VERSION = core.TINDEQ_ANALYSIS_VERSION;
export const TINDEQ_HISTORY_SELECT = core.TINDEQ_HISTORY_SELECT;

function normalizeTindeqForceUnit(unit: string): string {
  const normalized = unit.trim().toLocaleLowerCase("en-US").replace(/\s+/g, "");
  // Real Tindeq repeater exports use `SI` for the metric/kg display mode.
  if (normalized === "si") return "kg";
  return unit;
}

export function forceToKg(value: number | null | undefined, unit: string): number | null {
  return core.forceToKg(value, normalizeTindeqForceUnit(unit));
}

function withPersistenceForceUnit(session: TindeqSession): TindeqSession {
  const unit = session?.metadata?.unit;
  if (typeof unit !== "string") return session;
  const normalizedUnit = normalizeTindeqForceUnit(unit);
  if (normalizedUnit === unit) return session;
  return {
    ...session,
    metadata: {
      ...session.metadata,
      unit: normalizedUnit,
    },
  };
}

const IMPORT_ID_PATTERN = /^[0-9a-f]{20}$/;
const DATASET_PATTERN = /^data_set_\d+\.csv$/i;

type InsertZipMetadata = core.TindeqInsertPayload["raw_metadata"] & {
  importSource: "tindeq-zip";
  sourceDatasetName: string;
};

type StoredZipMetadata = core.StoredTindeqSession["raw_metadata"] & {
  importSource?: "tindeq-zip";
  sourceDatasetName?: string;
};

export type TindeqInsertPayload = Omit<core.TindeqInsertPayload, "raw_metadata"> & {
  raw_metadata: InsertZipMetadata;
};

export type StoredTindeqSession = Omit<core.StoredTindeqSession, "raw_metadata"> & {
  raw_metadata: StoredZipMetadata;
};

export type StoredSideMetrics = core.StoredSideMetrics;
export type StoredRepetitionResult = core.StoredRepetitionResult;

export type SaveTindeqSessionResult =
  | {
      ok: true;
      duplicate: boolean;
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

function containsNonFiniteNumber(value: unknown): boolean {
  if (typeof value === "number") return !Number.isFinite(value);
  if (Array.isArray(value)) return value.some(containsNonFiniteNumber);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some(containsNonFiniteNumber);
  }
  return false;
}

function hasZipParserShape(session: TindeqSession) {
  return (
    IMPORT_ID_PATTERN.test(session.id) &&
    session.sourceName.toLocaleLowerCase("en-US").endsWith(".zip") &&
    DATASET_PATTERN.test(session.datasetName) &&
    session.analysis.repetitions.length > 0 &&
    session.analysis.repetitions.every(
      (repetition) => repetition.curveLeftPct.length === 101 && repetition.curveRightPct.length === 101,
    )
  );
}

export function validateTindeqSessionForSave(
  session: TindeqSession,
  athleteId: string,
  analysisVersion = TINDEQ_ANALYSIS_VERSION,
): string[] {
  const errors = core.validateTindeqSessionForSave(
    withPersistenceForceUnit(session),
    athleteId,
    analysisVersion,
  );
  if (session && typeof session === "object" && !hasZipParserShape(session)) {
    errors.push("Měření nemá ověřitelný tvar výsledku vytvořeného ZIP analyzátorem.");
  }
  if (session && typeof session === "object" && containsNonFiniteNumber(session)) {
    errors.push("Analyzovaný výsledek obsahuje NaN nebo Infinity.");
  }
  return [...new Set(errors)];
}

export function mapTindeqSessionToInsert(session: TindeqSession, athleteId: string): TindeqInsertPayload {
  const errors = validateTindeqSessionForSave(session, athleteId);
  if (errors.length > 0) throw new Error(errors.join(" "));
  const payload = core.mapTindeqSessionToInsert(withPersistenceForceUnit(session), athleteId);
  return {
    ...payload,
    overall_summary: {
      ...payload.overall_summary,
      sourceForceUnit: session.metadata.unit,
    },
    raw_metadata: {
      ...payload.raw_metadata,
      sourceForceUnit: session.metadata.unit,
      importSource: "tindeq-zip",
      sourceDatasetName: session.datasetName,
    },
  };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value) ?? "undefined";
}

function withoutSessionId(metadata: StoredZipMetadata | InsertZipMetadata) {
  const { tindeqSessionId: ignoredSessionId, ...rest } = metadata;
  void ignoredSessionId;
  return rest;
}

function semanticIdentityPayload(payload: TindeqInsertPayload) {
  const {
    athlete_id: ignoredAthleteId,
    source_filename: ignoredSourceFilename,
    raw_metadata: rawMetadata,
    ...rest
  } = payload;
  void ignoredAthleteId;
  void ignoredSourceFilename;
  return {
    ...rest,
    raw_metadata: withoutSessionId(rawMetadata),
  };
}

async function stableSemanticSessionId(payload: TindeqInsertPayload): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(semanticIdentityPayload(payload)));
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  // Production DB constrains source session IDs to exactly 20 lowercase hex chars.
  // Keep the semantic SHA-256 identity, truncated to the existing 80-bit storage contract.
  return Array.from(digest)
    .slice(0, 10)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function sameInstant(left: string, right: string): boolean {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  return Number.isFinite(leftTime) && Number.isFinite(rightTime) && leftTime === rightTime;
}

function sameSemanticMeasurement(record: StoredTindeqSession, payload: TindeqInsertPayload): boolean {
  return (
    sameInstant(record.measured_at, payload.measured_at) &&
    record.source_dataset_name === payload.source_dataset_name &&
    record.source_tag === payload.source_tag &&
    record.protocol_name === payload.protocol_name &&
    record.target_force_left_kg === payload.target_force_left_kg &&
    record.target_force_right_kg === payload.target_force_right_kg &&
    record.sampling_rate_hz === payload.sampling_rate_hz &&
    record.detected_repetitions === payload.detected_repetitions &&
    record.expected_repetitions === payload.expected_repetitions &&
    record.analysis_version === payload.analysis_version &&
    canonicalJson(record.left_summary) === canonicalJson(payload.left_summary) &&
    canonicalJson(record.right_summary) === canonicalJson(payload.right_summary) &&
    canonicalJson(record.overall_summary) === canonicalJson(payload.overall_summary) &&
    canonicalJson(record.repetitions) === canonicalJson(payload.repetitions) &&
    canonicalJson(record.warnings) === canonicalJson(payload.warnings) &&
    canonicalJson(withoutSessionId(record.raw_metadata)) === canonicalJson(withoutSessionId(payload.raw_metadata))
  );
}

async function findDuplicate(
  supabase: SupabaseClient,
  athleteId: string,
  payload: TindeqInsertPayload,
): Promise<StoredTindeqSession | null> {
  const { data, error } = await supabase
    .from("tindeq_sessions")
    .select(TINDEQ_HISTORY_SELECT)
    .eq("athlete_id", athleteId)
    .eq("analysis_version", TINDEQ_ANALYSIS_VERSION)
    .contains("raw_metadata", { tindeqSessionId: payload.raw_metadata.tindeqSessionId })
    .is("deleted_at", null)
    .limit(1);
  if (error) throw new Error(`Kontrola duplicity selhala: ${error.message}`);
  const exact = ((data ?? [])[0] as StoredTindeqSession | undefined) ?? null;
  if (exact) return exact;

  // Older rows used an ID derived from the outer ZIP container. Re-exporting the same
  // measurement can therefore have a different legacy ID even when its structured content
  // is identical. Keep a backwards-compatible semantic lookup for those historical rows.
  const { data: candidates, error: candidatesError } = await supabase
    .from("tindeq_sessions")
    .select(TINDEQ_HISTORY_SELECT)
    .eq("athlete_id", athleteId)
    .eq("analysis_version", TINDEQ_ANALYSIS_VERSION)
    .eq("measured_at", payload.measured_at)
    .eq("source_dataset_name", payload.source_dataset_name)
    .is("deleted_at", null)
    .limit(20);
  if (candidatesError) throw new Error(`Kontrola obsahové duplicity selhala: ${candidatesError.message}`);
  return ((candidates ?? []) as StoredTindeqSession[]).find((record) =>
    sameSemanticMeasurement(record, payload)
  ) ?? null;
}

export async function saveTindeqSessions(
  supabase: SupabaseClient,
  sessions: TindeqSession[],
  athleteId: string,
): Promise<SaveTindeqSessionResult[]> {
  if (sessions.length === 0) {
    return [{ ok: false, sourceSessionId: "", sourceTag: "Bez měření", error: "Není co uložit." }];
  }
  const results: SaveTindeqSessionResult[] = [];
  for (const session of sessions) {
    try {
      const payload = mapTindeqSessionToInsert(session, athleteId);
      // Persist a stable semantic ID for all new rows. It deliberately excludes the client
      // and outer ZIP filename, so re-exported archives of the same measurement converge on
      // the same DB unique key. Historical rows remain covered by the semantic fallback.
      payload.raw_metadata.tindeqSessionId = await stableSemanticSessionId(payload);
      const duplicate = await findDuplicate(supabase, athleteId, payload);
      if (duplicate) {
        results.push({ ok: true, duplicate: true, sourceSessionId: session.id, sourceTag: session.metadata.tag, record: duplicate });
        continue;
      }
      const { data, error } = await supabase
        .from("tindeq_sessions")
        .insert(payload)
        .select(TINDEQ_HISTORY_SELECT)
        .single();
      if (error?.code === "23505") {
        const racedDuplicate = await findDuplicate(supabase, athleteId, payload);
        if (racedDuplicate) {
          results.push({
            ok: true,
            duplicate: true,
            sourceSessionId: session.id,
            sourceTag: session.metadata.tag,
            record: racedDuplicate,
          });
          continue;
        }
      }
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
          duplicate: false,
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
  return (await core.loadTindeqHistory(supabase, athleteId)) as StoredTindeqSession[];
}
