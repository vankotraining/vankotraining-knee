import type { SupabaseClient } from "@supabase/supabase-js";
import type { TindeqSession } from "./tindeq-browser.js";
import * as core from "./tindeq-persistence-core.js";

export const TINDEQ_ANALYSIS_VERSION = core.TINDEQ_ANALYSIS_VERSION;
export const TINDEQ_HISTORY_SELECT = core.TINDEQ_HISTORY_SELECT;
export const forceToKg = core.forceToKg;

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
  const errors = core.validateTindeqSessionForSave(session, athleteId, analysisVersion);
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
  const payload = core.mapTindeqSessionToInsert(session, athleteId);
  return {
    ...payload,
    raw_metadata: {
      ...payload.raw_metadata,
      importSource: "tindeq-zip",
      sourceDatasetName: session.datasetName,
    },
  };
}

async function findDuplicate(
  supabase: SupabaseClient,
  session: TindeqSession,
  athleteId: string,
): Promise<StoredTindeqSession | null> {
  const { data, error } = await supabase
    .from("tindeq_sessions")
    .select(TINDEQ_HISTORY_SELECT)
    .eq("athlete_id", athleteId)
    .eq("analysis_version", TINDEQ_ANALYSIS_VERSION)
    .contains("raw_metadata", { tindeqSessionId: session.id })
    .is("deleted_at", null)
    .limit(1);
  if (error) throw new Error(`Kontrola duplicity selhala: ${error.message}`);
  return ((data ?? [])[0] as StoredTindeqSession | undefined) ?? null;
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
      const duplicate = await findDuplicate(supabase, session, athleteId);
      if (duplicate) {
        results.push({ ok: true, duplicate: true, sourceSessionId: session.id, sourceTag: session.metadata.tag, record: duplicate });
        continue;
      }
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
