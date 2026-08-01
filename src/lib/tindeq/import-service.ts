import { createHash, randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeTindeqExport } from "./analysis";
import { TINDEQ_UPLOAD_MAX_BYTES, TINDEQ_VERSIONS } from "./config";
import { TindeqImportError } from "./errors";
import { parseTindeqZip } from "./parser";
import { isReadableTag } from "./validation";
import type { ParsedTindeqExport } from "./types";

export type TindeqImportResult = {
  success: true;
  measurementId: string;
  detailUrl: string;
  duplicate: boolean;
  importedCount: number;
};

type ImportedMeasurement = {
  id: string;
  detailUrl: string;
  duplicate: boolean;
};

function sha256(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function findOrCreateAthlete(
  supabase: SupabaseClient,
  parsed: ParsedTindeqExport,
) {
  const { originalTag, normalizedTag } = parsed.info;
  if (!isReadableTag(originalTag) || !normalizedTag) return null;

  const { data: existing, error: lookupError } = await supabase
    .from("athletes")
    .select("id")
    .eq("name_key", normalizedTag)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing?.id) return existing.id as string;

  const { data: created, error: createError } = await supabase
    .from("athletes")
    .insert({
      display_name: originalTag!.trim(),
      name_key: normalizedTag,
      note: "Vytvořeno automaticky při importu Tindeq Repeaters.",
    })
    .select("id")
    .single();

  if (!createError && created?.id) return created.id as string;

  const { data: concurrent, error: concurrentError } = await supabase
    .from("athletes")
    .select("id")
    .eq("name_key", normalizedTag)
    .maybeSingle();
  if (concurrentError || !concurrent?.id) throw createError ?? concurrentError;
  return concurrent.id as string;
}

async function importOne(
  supabase: SupabaseClient,
  userId: string,
  parsed: ParsedTindeqExport,
): Promise<ImportedMeasurement> {
  const fileHash = sha256(parsed.rawZip);
  const { data: duplicate, error: duplicateError } = await supabase
    .from("tindeq_repeaters_sessions")
    .select("id,athlete_id")
    .eq("owner_user_id", userId)
    .eq("file_hash", fileHash)
    .maybeSingle();
  if (duplicateError) throw duplicateError;

  if (duplicate?.id) {
    const id = duplicate.id as string;
    const athleteId = duplicate.athlete_id as string | null;
    return {
      id,
      detailUrl: athleteId
        ? `/clients/${athleteId}/repeaters/${id}`
        : `/repeaters/${id}`,
      duplicate: true,
    };
  }

  const analysis = analyzeTindeqExport(parsed);
  const athleteId = await findOrCreateAthlete(supabase, parsed);
  const sessionId = randomUUID();
  const storagePath = `${userId}/${sessionId}/original.zip`;
  const { error: storageError } = await supabase.storage
    .from("tindeq-raw")
    .upload(storagePath, parsed.rawZip, {
      contentType: "application/zip",
      upsert: false,
    });
  if (storageError) throw storageError;

  const sessionPayload = {
    id: sessionId,
    owner_user_id: userId,
    athlete_id: athleteId,
    original_tag: parsed.info.originalTag,
    normalized_tag: parsed.info.normalizedTag,
    test_datetime: parsed.info.testDatetime,
    protocol_type: parsed.info.protocolType,
    left_mvc: parsed.info.leftMvc,
    right_mvc: parsed.info.rightMvc,
    work_percentage: parsed.info.workPercentage,
    left_target: parsed.info.leftTarget,
    right_target: parsed.info.rightTarget,
    work_duration_seconds: parsed.info.workDurationSeconds,
    rest_duration_seconds: parsed.info.restDurationSeconds,
    planned_repetitions: parsed.info.plannedRepetitions === null
      ? null
      : Math.round(parsed.info.plannedRepetitions),
    detected_repetitions: analysis.repetitions.length,
    sampling_frequency_hz: parsed.samplingFrequencyHz,
    unit: parsed.info.unit,
    file_hash: fileHash,
    storage_path: storagePath,
    raw_metadata: parsed.info.metadata,
    summary_metrics: analysis.summary,
    analysis_version: TINDEQ_VERSIONS.analysis,
    parser_version: TINDEQ_VERSIONS.parser,
    segmentation_version: TINDEQ_VERSIONS.segmentation,
    metrics_version: TINDEQ_VERSIONS.metrics,
    analyzed_at: new Date().toISOString(),
  };

  const { error: sessionError } = await supabase
    .from("tindeq_repeaters_sessions")
    .insert(sessionPayload);

  if (sessionError) {
    await supabase.storage.from("tindeq-raw").remove([storagePath]);
    if (sessionError.code === "23505") {
      const { data: existing } = await supabase
        .from("tindeq_repeaters_sessions")
        .select("id,athlete_id")
        .eq("owner_user_id", userId)
        .eq("file_hash", fileHash)
        .maybeSingle();
      if (existing?.id) {
        const id = existing.id as string;
        const existingAthleteId = existing.athlete_id as string | null;
        return {
          id,
          detailUrl: existingAthleteId
            ? `/clients/${existingAthleteId}/repeaters/${id}`
            : `/repeaters/${id}`,
          duplicate: true,
        };
      }
    }
    throw sessionError;
  }

  if (analysis.repetitions.length > 0) {
    const { error: repetitionError } = await supabase
      .from("tindeq_repetitions")
      .insert(analysis.repetitions.map((repetition) => ({
        session_id: sessionId,
        repetition_number: repetition.repetitionNumber,
        is_valid: repetition.isValid,
        work_start_seconds: repetition.workStartSeconds,
        work_end_seconds: repetition.workEndSeconds,
        left_metrics: repetition.leftMetrics,
        right_metrics: repetition.rightMetrics,
        bilateral_metrics: repetition.bilateralMetrics,
        warnings: repetition.warnings,
      })));

    if (repetitionError) {
      await supabase.from("tindeq_repeaters_sessions").delete().eq("id", sessionId);
      await supabase.storage.from("tindeq-raw").remove([storagePath]);
      throw repetitionError;
    }
  }

  return {
    id: sessionId,
    detailUrl: athleteId
      ? `/clients/${athleteId}/repeaters/${sessionId}`
      : `/repeaters/${sessionId}`,
    duplicate: false,
  };
}

export async function importTindeqFile(
  supabase: SupabaseClient,
  userId: string,
  file: File,
): Promise<TindeqImportResult> {
  if (file.size > TINDEQ_UPLOAD_MAX_BYTES) {
    throw new TindeqImportError("FILE_TOO_LARGE", undefined, 413);
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const exports = parseTindeqZip(bytes, file.name);
  const imported: ImportedMeasurement[] = [];

  for (const parsed of exports) {
    imported.push(await importOne(supabase, userId, parsed));
  }

  const first = imported[0];
  return {
    success: true,
    measurementId: first.id,
    detailUrl: first.detailUrl,
    duplicate: imported.every((measurement) => measurement.duplicate),
    importedCount: imported.filter((measurement) => !measurement.duplicate).length,
  };
}

export async function logTindeqImportError(
  supabase: SupabaseClient,
  userId: string,
  file: File | null,
  code: string,
  userMessage: string,
  technicalDetail: string,
) {
  let fileHash: string | null = null;
  if (file) {
    try {
      fileHash = sha256(new Uint8Array(await file.arrayBuffer()));
    } catch {
      fileHash = null;
    }
  }
  await supabase.from("tindeq_import_errors").insert({
    owner_user_id: userId,
    file_name: file?.name ?? null,
    file_hash: fileHash,
    error_code: code,
    user_message: userMessage,
    technical_detail: technicalDetail,
  });
}
