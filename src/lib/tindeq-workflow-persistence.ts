import type { SupabaseClient } from "@supabase/supabase-js";
import type { TindeqSession } from "./tindeq-browser";
import {
  mapTindeqSessionToInsert,
  TINDEQ_HISTORY_SELECT,
  type StoredTindeqSession,
} from "./tindeq-persistence";
import {
  createImportFingerprint,
  evaluateTindeqSessionSide,
  type ExerciseSide,
  type PainSnapshot,
  type SideExerciseEvaluation,
} from "./tindeq-workflow";

export const TINDEQ_WORKFLOW_HISTORY_SELECT = `${TINDEQ_HISTORY_SELECT},exercise_side,reference_test_id,reference_test_date,reference_force_kg,prescribed_pct,prescribed_target_force_kg,mean_force_kg,best_rep_force_kg,weakest_rep_force_kg,mean_pct_reference,mean_pct_target,consistency_cv_pct,first_to_last_change_pct_points,total_work_seconds,pain_before,pain_during_max,pain_after,import_fingerprint`;

export type ReferenceSnapshot = {
  referenceTestId: string;
  referenceTestDate: string;
  referenceForceKg: number;
  prescribedPct: number | null;
  targetForceKg: number | null;
};

export type WorkflowSaveContext = {
  athleteId: string;
  side: ExerciseSide;
  reference: ReferenceSnapshot | null;
  pain: PainSnapshot;
};

export type WorkflowInsertPayload = ReturnType<typeof mapTindeqSessionToInsert> & {
  exercise_side: ExerciseSide;
  reference_test_id: string | null;
  reference_test_date: string | null;
  reference_force_kg: number | null;
  prescribed_pct: number | null;
  prescribed_target_force_kg: number | null;
  mean_force_kg: number | null;
  best_rep_force_kg: number | null;
  weakest_rep_force_kg: number | null;
  mean_pct_reference: number | null;
  mean_pct_target: number | null;
  consistency_cv_pct: number | null;
  first_to_last_change_pct_points: number | null;
  total_work_seconds: number | null;
  pain_before: number | null;
  pain_during_max: number | null;
  pain_after: number | null;
  import_fingerprint: string;
};

export type StoredWorkflowSession = StoredTindeqSession & {
  exercise_side: ExerciseSide | null;
  reference_test_id: string | null;
  reference_test_date: string | null;
  reference_force_kg: number | null;
  prescribed_pct: number | null;
  prescribed_target_force_kg: number | null;
  mean_force_kg: number | null;
  best_rep_force_kg: number | null;
  weakest_rep_force_kg: number | null;
  mean_pct_reference: number | null;
  mean_pct_target: number | null;
  consistency_cv_pct: number | null;
  first_to_last_change_pct_points: number | null;
  total_work_seconds: number | null;
  pain_before: number | null;
  pain_during_max: number | null;
  pain_after: number | null;
  import_fingerprint: string | null;
};

export type SaveWorkflowSessionResult =
  | { ok: true; duplicate: false; record: StoredWorkflowSession }
  | { ok: false; duplicate: true; existing: StoredWorkflowSession; error: string }
  | { ok: false; duplicate: false; error: string };

function validateReference(reference: ReferenceSnapshot | null) {
  if (!reference) return;
  if (
    !reference.referenceTestId ||
    !reference.referenceTestDate ||
    !Number.isFinite(reference.referenceForceKg) ||
    reference.referenceForceKg <= 0
  ) {
    throw new Error("Referenční maximum není úplné nebo platné.");
  }
  if (reference.prescribedPct === null) {
    if (reference.targetForceKg !== null) {
      throw new Error("Cílová síla nesmí být uložená bez procenta maxima.");
    }
    return;
  }
  if (
    !Number.isFinite(reference.prescribedPct) ||
    reference.prescribedPct <= 0 ||
    reference.targetForceKg === null ||
    !Number.isFinite(reference.targetForceKg) ||
    reference.targetForceKg <= 0
  ) {
    throw new Error("Procento a cílová síla musí být kladná čísla.");
  }
  const expectedTarget =
    (reference.referenceForceKg * reference.prescribedPct) / 100;
  if (Math.abs(expectedTarget - reference.targetForceKg) > 0.0001) {
    throw new Error("Cílová síla neodpovídá referenčnímu maximu a procentu.");
  }
}

function addEvaluation(
  payload: ReturnType<typeof mapTindeqSessionToInsert>,
  context: WorkflowSaveContext,
  evaluation: SideExerciseEvaluation,
  fingerprint: string,
): WorkflowInsertPayload {
  return {
    ...payload,
    exercise_side: context.side,
    reference_test_id: context.reference?.referenceTestId ?? null,
    reference_test_date: context.reference?.referenceTestDate ?? null,
    reference_force_kg: context.reference?.referenceForceKg ?? null,
    prescribed_pct: context.reference?.prescribedPct ?? null,
    prescribed_target_force_kg: context.reference?.targetForceKg ?? null,
    mean_force_kg: evaluation.meanForceKg,
    best_rep_force_kg: evaluation.bestRepForceKg,
    weakest_rep_force_kg: evaluation.weakestRepForceKg,
    mean_pct_reference: evaluation.meanPctReference,
    mean_pct_target: evaluation.meanPctTarget,
    consistency_cv_pct: evaluation.consistencyCvPct,
    first_to_last_change_pct_points: evaluation.firstToLastChangePctPoints,
    total_work_seconds: evaluation.totalWorkSeconds,
    pain_before: context.pain.before,
    pain_during_max: context.pain.duringMax,
    pain_after: context.pain.after,
    import_fingerprint: fingerprint,
  };
}

export async function buildWorkflowInsertPayload(
  session: TindeqSession,
  context: WorkflowSaveContext,
): Promise<WorkflowInsertPayload> {
  validateReference(context.reference);
  const evaluation = evaluateTindeqSessionSide(
    session,
    context.side,
    context.reference?.referenceForceKg ?? null,
    context.reference?.prescribedPct ?? null,
  );
  const fingerprint = await createImportFingerprint(
    session,
    context.athleteId,
    context.side,
  );
  return addEvaluation(
    mapTindeqSessionToInsert(session, context.athleteId),
    context,
    evaluation,
    fingerprint,
  );
}

export async function saveWorkflowSession(
  supabase: SupabaseClient,
  session: TindeqSession,
  context: WorkflowSaveContext,
): Promise<SaveWorkflowSessionResult> {
  try {
    const payload = await buildWorkflowInsertPayload(session, context);
    const { data: duplicate, error: duplicateError } = await supabase
      .from("tindeq_sessions")
      .select(TINDEQ_WORKFLOW_HISTORY_SELECT)
      .eq("athlete_id", context.athleteId)
      .eq("import_fingerprint", payload.import_fingerprint)
      .is("deleted_at", null)
      .maybeSingle();
    if (duplicateError) {
      return { ok: false, duplicate: false, error: duplicateError.message };
    }
    if (duplicate) {
      return {
        ok: false,
        duplicate: true,
        existing: duplicate as StoredWorkflowSession,
        error: "Stejný normalizovaný výsledek už je u tohoto klienta uložen.",
      };
    }

    const { data, error } = await supabase
      .from("tindeq_sessions")
      .insert(payload)
      .select(TINDEQ_WORKFLOW_HISTORY_SELECT)
      .single();
    if (error || !data) {
      if (error?.code === "23505") {
        const { data: existing } = await supabase
          .from("tindeq_sessions")
          .select(TINDEQ_WORKFLOW_HISTORY_SELECT)
          .eq("athlete_id", context.athleteId)
          .eq("import_fingerprint", payload.import_fingerprint)
          .is("deleted_at", null)
          .maybeSingle();
        if (existing) {
          return {
            ok: false,
            duplicate: true,
            existing: existing as StoredWorkflowSession,
            error: "Stejný normalizovaný výsledek už je u tohoto klienta uložen.",
          };
        }
      }
      return {
        ok: false,
        duplicate: false,
        error: error?.message ?? "Databáze nevrátila uložený výsledek.",
      };
    }
    return { ok: true, duplicate: false, record: data as StoredWorkflowSession };
  } catch (error) {
    return {
      ok: false,
      duplicate: false,
      error:
        error instanceof Error
          ? error.message
          : "Výsledek se nepodařilo připravit.",
    };
  }
}

export async function loadWorkflowHistory(
  supabase: SupabaseClient,
  athleteId: string,
): Promise<StoredWorkflowSession[]> {
  const { data, error } = await supabase
    .from("tindeq_sessions")
    .select(TINDEQ_WORKFLOW_HISTORY_SELECT)
    .eq("athlete_id", athleteId)
    .is("deleted_at", null)
    .order("measured_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as StoredWorkflowSession[];
}
