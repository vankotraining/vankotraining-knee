from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.strip() + "\n", encoding="utf-8")


def apply() -> None:
    write(
        "src/lib/tindeq/import-service.ts",
        r'''
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
''',
    )

    write(
        "src/app/api/import/tindeq/route.ts",
        r'''
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { TindeqImportError } from "@/lib/tindeq/errors";
import { importTindeqFile, logTindeqImportError } from "@/lib/tindeq/import-service";

export const runtime = "nodejs";
export const maxDuration = 60;

function getFile(formData: FormData) {
  const candidate = formData.get("tindeqFile") ?? formData.get("file");
  return candidate instanceof File ? candidate : null;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json(
      { success: false, code: "UNAUTHORIZED", message: "Pro import se nejprve přihlas." },
      { status: 401 },
    );
  }

  let file: File | null = null;
  try {
    file = getFile(await request.formData());
    if (!file) throw new TindeqImportError("NO_FILE");
    const result = await importTindeqFile(supabase, user.id, file);
    return NextResponse.json(result);
  } catch (error) {
    const known = error instanceof TindeqImportError
      ? error
      : new TindeqImportError("IMPORT_FAILED", undefined, 500);
    console.error("Tindeq import failed", {
      code: known.code,
      fileName: file?.name,
      detail: error instanceof Error ? error.stack ?? error.message : String(error),
    });
    await logTindeqImportError(
      supabase,
      user.id,
      file,
      known.code,
      known.message,
      error instanceof Error ? error.stack ?? error.message : String(error),
    );
    return NextResponse.json(
      { success: false, code: known.code, message: known.message },
      { status: known.status },
    );
  }
}
''',
    )

    write(
        "src/app/api/repeaters/[sessionId]/route.ts",
        r'''
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { validateClinicalScale } from "@/lib/tindeq/validation";

type RouteContext = {
  params: Promise<{ sessionId: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: false, code: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const { sessionId } = await params;
    const body = await request.json() as {
      painDuring?: unknown;
      rpe?: unknown;
      clinicalNote?: unknown;
    };
    const painDuring = validateClinicalScale(body.painDuring, "pain");
    const rpe = validateClinicalScale(body.rpe, "rpe");
    const clinicalNote = typeof body.clinicalNote === "string"
      ? body.clinicalNote.trim().slice(0, 2000) || null
      : null;
    const { error } = await supabase
      .from("tindeq_repeaters_sessions")
      .update({
        pain_during: painDuring,
        rpe,
        clinical_note: clinicalNote,
      })
      .eq("id", sessionId)
      .eq("owner_user_id", user.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tindeq clinical data update failed", error);
    return NextResponse.json(
      { success: false, code: "INVALID_CLINICAL_DATA", message: "Údaje se nepodařilo uložit." },
      { status: 400 },
    );
  }
}
''',
    )

    write(
        "src/app/components/TindeqUploadCard.tsx",
        r'''
"use client";

import { useRef, useState } from "react";

type ImportResponse = {
  success: boolean;
  measurementId?: string;
  detailUrl?: string;
  duplicate?: boolean;
  importedCount?: number;
  code?: string;
  message?: string;
};

type Stage = "idle" | "uploading" | "checking" | "analyzing" | "saving" | "done" | "error";

const STAGE_LABELS: Record<Stage, string> = {
  idle: "Připraveno",
  uploading: "Nahrávání",
  checking: "Kontrola souboru",
  analyzing: "Analýza",
  saving: "Ukládání",
  done: "Hotovo",
  error: "Chyba",
};

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export default function TindeqUploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [message, setMessage] = useState("Vyber původní ZIP export z Tindeq.");

  async function upload(file: File) {
    setStage("uploading");
    setMessage(file.name);
    try {
      const formData = new FormData();
      formData.set("tindeqFile", file);
      await delay(120);
      setStage("checking");
      await delay(120);
      setStage("analyzing");
      const response = await fetch("/api/import/tindeq", {
        method: "POST",
        body: formData,
      });
      const result = await response.json() as ImportResponse;
      if (!response.ok || !result.success || !result.detailUrl) {
        throw new Error(result.message ?? "Import se nepodařil.");
      }
      setStage("saving");
      await delay(100);
      setStage("done");
      setMessage(result.duplicate
        ? "Tento soubor už byl importován. Otevírám existující měření."
        : `Importováno: ${result.importedCount ?? 1}`);
      const separator = result.detailUrl.includes("?") ? "&" : "?";
      window.location.assign(`${result.detailUrl}${separator}duplicate=${result.duplicate ? "1" : "0"}`);
    } catch (error) {
      setStage("error");
      setMessage(error instanceof Error ? error.message : "Import se nepodařil.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="tindeq-upload-shell" aria-labelledby="tindeq-upload-heading">
      <div>
        <p className="eyebrow">Tindeq Repeaters</p>
        <h2 id="tindeq-upload-heading">Rychlý import měření</h2>
        <p className="tindeq-upload-message">{message}</p>
      </div>
      <div className="tindeq-upload-actions">
        <input
          ref={inputRef}
          className="tindeq-file-input"
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <button
          className="tindeq-upload-button"
          type="button"
          disabled={!(["idle", "done", "error"] as Stage[]).includes(stage)}
          onClick={() => inputRef.current?.click()}
        >
          Nahrát Tindeq ZIP
        </button>
        <span className={`tindeq-stage tindeq-stage-${stage}`} role="status" aria-live="polite">
          {STAGE_LABELS[stage]}
        </span>
      </div>
    </section>
  );
}
''',
    )

    write(
        "src/app/components/TindeqClinicalForm.tsx",
        r'''
"use client";

import { useState } from "react";

type Props = {
  sessionId: string;
  initialPain: number | null;
  initialRpe: number | null;
  initialNote: string | null;
};

export default function TindeqClinicalForm({
  sessionId,
  initialPain,
  initialRpe,
  initialNote,
}: Props) {
  const [pain, setPain] = useState(initialPain === null ? "" : String(initialPain));
  const [rpe, setRpe] = useState(initialRpe === null ? "" : String(initialRpe));
  const [note, setNote] = useState(initialNote ?? "");
  const [status, setStatus] = useState("");

  async function save() {
    setStatus("Ukládání…");
    const response = await fetch(`/api/repeaters/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        painDuring: pain === "" ? null : Number(pain),
        rpe: rpe === "" ? null : Number(rpe),
        clinicalNote: note,
      }),
    });
    const result = await response.json() as { success?: boolean; message?: string };
    setStatus(response.ok && result.success ? "Uloženo" : result.message ?? "Uložení se nepodařilo.");
  }

  const scaleOptions = Array.from({ length: 11 }, (_, value) => value);

  return (
    <section className="tindeq-detail-card">
      <h2>Bolest a RPE</h2>
      <p className="tindeq-detail-note">
        Nehodnoceno je odlišné od hodnoty 0. Bez bolesti a RPE aplikace zobrazuje pouze mechanické hodnocení.
      </p>
      <div className="tindeq-clinical-grid">
        <label>
          Bolest během testu
          <select value={pain} onChange={(event) => setPain(event.target.value)}>
            <option value="">Nehodnoceno</option>
            {scaleOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          RPE
          <select value={rpe} onChange={(event) => setRpe(event.target.value)}>
            <option value="">Nehodnoceno</option>
            {scaleOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <label>
        Klinická poznámka
        <textarea rows={3} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <div className="tindeq-form-footer">
        <button className="tindeq-secondary-button" type="button" onClick={() => void save()}>
          Uložit klinické údaje
        </button>
        <span role="status">{status}</span>
      </div>
    </section>
  );
}
''',
    )

    write(
        "src/app/components/TindeqSessionDetail.tsx",
        r'''
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import TindeqClinicalForm from "./TindeqClinicalForm";

type Props = {
  sessionId: string;
  expectedAthleteId?: string;
  duplicate?: boolean;
};

type Session = {
  id: string;
  athlete_id: string | null;
  original_tag: string | null;
  test_datetime: string | null;
  protocol_type: string | null;
  left_mvc: number | null;
  right_mvc: number | null;
  work_percentage: number | null;
  left_target: number | null;
  right_target: number | null;
  work_duration_seconds: number | null;
  rest_duration_seconds: number | null;
  planned_repetitions: number | null;
  detected_repetitions: number;
  sampling_frequency_hz: number | null;
  unit: string;
  summary_metrics: Record<string, unknown>;
  pain_during: number | null;
  rpe: number | null;
  clinical_note: string | null;
  parser_version: string;
  segmentation_version: string;
  metrics_version: string;
  analyzed_at: string;
};

type Repetition = {
  id: string;
  repetition_number: number;
  is_valid: boolean;
  work_start_seconds: number;
  work_end_seconds: number;
  left_metrics: Record<string, unknown>;
  right_metrics: Record<string, unknown>;
  warnings: string[];
};

function formatNumber(value: unknown, digits = 1) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(value)
    : "–";
}

function formatDate(value: string | null) {
  if (!value) return "Datum neuvedeno";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("cs-CZ", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

function metric(record: Record<string, unknown>, key: string) {
  return formatNumber(record[key]);
}

const WARNING_LABELS: Record<string, string> = {
  incomplete_work_interval: "Neúplný pracovní interval",
  recording_ended_without_relaxation: "Záznam skončil bez relaxační fáze",
  slow_ramp: "Pomalý náběh",
  target_not_reached: "Nedosažení cíle",
  target_overshoot: "Přestřelení cíle",
  unstable_force: "Zvýšená variabilita",
};

export default async function TindeqSessionDetail({ sessionId, expectedAthleteId, duplicate }: Props) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data, error } = await supabase
    .from("tindeq_repeaters_sessions")
    .select("id,athlete_id,original_tag,test_datetime,protocol_type,left_mvc,right_mvc,work_percentage,left_target,right_target,work_duration_seconds,rest_duration_seconds,planned_repetitions,detected_repetitions,sampling_frequency_hz,unit,summary_metrics,pain_during,rpe,clinical_note,parser_version,segmentation_version,metrics_version,analyzed_at")
    .eq("id", sessionId)
    .single();
  if (error || !data) notFound();
  const session = data as Session;
  if (expectedAthleteId && session.athlete_id !== expectedAthleteId) notFound();

  const [{ data: athlete }, { data: repetitionsData }] = await Promise.all([
    session.athlete_id
      ? supabase.from("athletes").select("display_name").eq("id", session.athlete_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("tindeq_repetitions")
      .select("id,repetition_number,is_valid,work_start_seconds,work_end_seconds,left_metrics,right_metrics,warnings")
      .eq("session_id", session.id)
      .order("repetition_number"),
  ]);
  const repetitions = (repetitionsData ?? []) as Repetition[];
  const summary = session.summary_metrics ?? {};
  const warnings = Array.isArray(summary.warnings) ? summary.warnings.filter((item): item is string => typeof item === "string") : [];

  return (
    <main className="tindeq-detail-shell">
      <a className="tindeq-back-link" href="/">← Zpět do Knee</a>
      {duplicate ? <div className="tindeq-duplicate-note">Tento soubor už byl importován. Zobrazuje se existující měření.</div> : null}
      <header className="tindeq-detail-header">
        <p className="eyebrow">Tindeq Repeaters</p>
        <h1>{athlete?.display_name ?? session.original_tag ?? "Nepřiřazené měření"}</h1>
        <p>{formatDate(session.test_datetime)} · {session.protocol_type ?? "Protokol neuveden"}</p>
      </header>

      <section className="tindeq-metric-grid">
        <article><span>Pracovní intenzita</span><strong>{formatNumber(session.work_percentage)} % MVC</strong></article>
        <article><span>Opakování</span><strong>{formatNumber(summary.validRepetitions, 0)} / {formatNumber(session.detected_repetitions, 0)}</strong></article>
        <article><span>Plnění cíle</span><strong>{formatNumber(summary.averageTargetCompletionPct)} %</strong></article>
        <article><span>Vzorkování</span><strong>{formatNumber(session.sampling_frequency_hz)} Hz</strong></article>
      </section>

      <section className="tindeq-detail-card">
        <h2>Nastavení testu</h2>
        <dl className="tindeq-definition-grid">
          <div><dt>MVC vlevo</dt><dd>{formatNumber(session.left_mvc)} {session.unit}</dd></div>
          <div><dt>MVC vpravo</dt><dd>{formatNumber(session.right_mvc)} {session.unit}</dd></div>
          <div><dt>Cíl vlevo</dt><dd>{formatNumber(session.left_target)} {session.unit}</dd></div>
          <div><dt>Cíl vpravo</dt><dd>{formatNumber(session.right_target)} {session.unit}</dd></div>
          <div><dt>Práce</dt><dd>{formatNumber(session.work_duration_seconds)} s</dd></div>
          <div><dt>Pauza</dt><dd>{formatNumber(session.rest_duration_seconds)} s</dd></div>
          <div><dt>Plán opakování</dt><dd>{formatNumber(session.planned_repetitions, 0)}</dd></div>
          <div><dt>Analýza</dt><dd>{session.parser_version} / {session.segmentation_version} / {session.metrics_version}</dd></div>
        </dl>
      </section>

      <section className="tindeq-detail-card">
        <h2>Mechanický souhrn</h2>
        <p className="tindeq-detail-note">{String(summary.heuristicNotice ?? "Hodnocení je popisné a používá pracovní heuristiky.")}</p>
        {warnings.length ? (
          <ul className="tindeq-warning-list">
            {warnings.map((warning) => <li key={warning}>{WARNING_LABELS[warning] ?? warning}</li>)}
          </ul>
        ) : <p>Bez automaticky detekovaného upozornění.</p>}
      </section>

      <section className="tindeq-detail-card">
        <h2>Opakování</h2>
        <div className="tindeq-repetition-list">
          {repetitions.map((repetition) => (
            <article key={repetition.id} className="tindeq-repetition-card">
              <div>
                <strong>Opakování {repetition.repetition_number}</strong>
                <span>{repetition.is_valid ? "Kompletní" : "Neúplné"}</span>
              </div>
              <dl>
                <div><dt>Průměr vlevo</dt><dd>{metric(repetition.left_metrics, "mean")} {session.unit}</dd></div>
                <div><dt>Průměr vpravo</dt><dd>{metric(repetition.right_metrics, "mean")} {session.unit}</dd></div>
                <div><dt>CV vlevo</dt><dd>{metric(repetition.left_metrics, "coefficientOfVariationPct")} %</dd></div>
                <div><dt>CV vpravo</dt><dd>{metric(repetition.right_metrics, "coefficientOfVariationPct")} %</dd></div>
              </dl>
            </article>
          ))}
          {!repetitions.length ? <p>Nebylo detekováno žádné pracovní opakování.</p> : null}
        </div>
      </section>

      <TindeqClinicalForm
        sessionId={session.id}
        initialPain={session.pain_during}
        initialRpe={session.rpe}
        initialNote={session.clinical_note}
      />
    </main>
  );
}
''',
    )

    write(
        "src/app/repeaters/[sessionId]/page.tsx",
        r'''
import TindeqSessionDetail from "@/app/components/TindeqSessionDetail";

type PageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ duplicate?: string }>;
};

export default async function RepeatersDetailPage({ params, searchParams }: PageProps) {
  const [{ sessionId }, query] = await Promise.all([params, searchParams]);
  return <TindeqSessionDetail sessionId={sessionId} duplicate={query.duplicate === "1"} />;
}
''',
    )

    write(
        "src/app/clients/[athleteId]/repeaters/[sessionId]/page.tsx",
        r'''
import TindeqSessionDetail from "@/app/components/TindeqSessionDetail";

type PageProps = {
  params: Promise<{ athleteId: string; sessionId: string }>;
  searchParams: Promise<{ duplicate?: string }>;
};

export default async function AthleteRepeatersDetailPage({ params, searchParams }: PageProps) {
  const [{ athleteId, sessionId }, query] = await Promise.all([params, searchParams]);
  return (
    <TindeqSessionDetail
      sessionId={sessionId}
      expectedAthleteId={athleteId}
      duplicate={query.duplicate === "1"}
    />
  );
}
''',
    )

    write(
        "src/app/components/KneeApp.tsx",
        r'''
"use client";

import { useState } from "react";
import ArchivedClients from "./ArchivedClients";
import ArchivedMeasurements from "./ArchivedMeasurements";
import ClientDeletion from "./ClientDeletion";
import KneeDashboard from "./KneeDashboard";
import TindeqUploadCard from "./TindeqUploadCard";
import type { SelectedClient } from "./selected-client";

export default function KneeApp() {
  const [selectedClient, setSelectedClient] = useState<SelectedClient>(null);

  return (
    <>
      <TindeqUploadCard />
      <KneeDashboard onSelectedClientChange={setSelectedClient} />
      <ArchivedClients />
      <ClientDeletion selectedClient={selectedClient} />
      <ArchivedMeasurements selectedClient={selectedClient} />
    </>
  );
}
''',
    )

    css_path = ROOT / "src/app/globals.css"
    css = css_path.read_text(encoding="utf-8")
    marker = "/* Tindeq Repeaters Stage 1 */"
    if marker not in css:
        css += r'''

/* Tindeq Repeaters Stage 1 */
.tindeq-upload-shell {
  width: min(1280px, calc(100% - 28px));
  margin: 14px auto 0;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: var(--surface);
  box-shadow: 0 12px 35px rgba(22, 26, 21, 0.08);
}

.tindeq-upload-shell h2 {
  margin-top: 4px;
  font-size: clamp(21px, 4vw, 30px);
}

.tindeq-upload-message,
.tindeq-detail-note {
  margin-top: 7px;
  color: var(--muted);
  line-height: 1.5;
}

.tindeq-upload-actions {
  min-width: min(100%, 290px);
  display: grid;
  gap: 8px;
}

.tindeq-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.tindeq-upload-button,
.tindeq-secondary-button {
  min-height: 48px;
  padding: 12px 18px;
  border: 0;
  border-radius: 12px;
  background: var(--accent);
  color: white;
  font-weight: 800;
}

.tindeq-secondary-button {
  min-height: 42px;
  background: var(--accent-strong);
}

.tindeq-stage {
  color: var(--muted);
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.tindeq-stage-error { color: var(--danger); }
.tindeq-stage-done { color: var(--accent); }

.tindeq-detail-shell {
  width: min(920px, calc(100% - 28px));
  margin: 0 auto;
  padding: max(18px, env(safe-area-inset-top)) 0 60px;
}

.tindeq-back-link {
  display: inline-block;
  margin-bottom: 18px;
  color: var(--accent);
  font-weight: 700;
  text-decoration: none;
}

.tindeq-detail-header,
.tindeq-detail-card,
.tindeq-duplicate-note {
  margin-bottom: 14px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
}

.tindeq-detail-header h1 { margin: 4px 0 7px; }
.tindeq-detail-header > p:last-child { color: var(--muted); }
.tindeq-duplicate-note { border-color: var(--accent); color: var(--accent-strong); font-weight: 700; }
.tindeq-detail-card h2 { margin-bottom: 12px; }

.tindeq-metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.tindeq-metric-grid article {
  min-width: 0;
  padding: 15px;
  border: 1px solid var(--border);
  border-radius: 15px;
  background: var(--surface);
}

.tindeq-metric-grid span,
.tindeq-repetition-card span {
  display: block;
  color: var(--muted);
  font-size: 12px;
}

.tindeq-metric-grid strong { display: block; margin-top: 5px; font-size: 19px; }

.tindeq-definition-grid,
.tindeq-repetition-card dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.tindeq-definition-grid div,
.tindeq-repetition-card dl div {
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.tindeq-definition-grid dt,
.tindeq-repetition-card dt { color: var(--muted); font-size: 12px; }
.tindeq-definition-grid dd,
.tindeq-repetition-card dd { margin-top: 3px; font-weight: 700; }

.tindeq-warning-list { margin: 12px 0 0 20px; line-height: 1.7; }
.tindeq-repetition-list { display: grid; gap: 10px; }
.tindeq-repetition-card { padding: 14px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface-subtle); }
.tindeq-repetition-card > div { display: flex; justify-content: space-between; gap: 12px; }

.tindeq-clinical-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.tindeq-detail-card label { display: grid; gap: 6px; margin-top: 12px; font-weight: 700; }
.tindeq-detail-card select,
.tindeq-detail-card textarea { width: 100%; padding: 11px; border: 1px solid var(--border); border-radius: 10px; background: var(--surface); color: var(--foreground); }
.tindeq-form-footer { margin-top: 14px; display: flex; align-items: center; gap: 12px; }

@media (max-width: 720px) {
  .tindeq-upload-shell { align-items: stretch; flex-direction: column; }
  .tindeq-upload-actions { min-width: 100%; }
  .tindeq-metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .tindeq-definition-grid,
  .tindeq-repetition-card dl,
  .tindeq-clinical-grid { grid-template-columns: 1fr; }
  .tindeq-detail-header,
  .tindeq-detail-card { padding: 16px; }
}
'''
        css_path.write_text(css.rstrip() + "\n", encoding="utf-8")


if __name__ == "__main__":
    apply()
