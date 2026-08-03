"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  importTindeqArchive,
  type TindeqSession,
} from "@/lib/tindeq-browser";
import {
  loadWorkflowHistory,
  saveWorkflowSession,
  type ReferenceSnapshot,
  type StoredWorkflowSession,
} from "@/lib/tindeq-workflow-persistence";
import {
  calculateTargetForce,
  evaluateTindeqSessionSide,
  parseOptionalPain,
  type ExerciseSide,
} from "@/lib/tindeq-workflow";
import { useSupabaseSession } from "@/lib/use-supabase-session";
import type { SelectedClient } from "./selected-client";
import styles from "./tindeq-client-records.module.css";

type TindeqClientRecordsProps = {
  selectedClient: SelectedClient;
};

type ReferenceTest = {
  id: string;
  test_date: string;
  left_force_kg: number;
  right_force_kg: number;
  created_at: string | null;
};

type DraftStatus = "ready" | "saving" | "saved" | "duplicate" | "error";

type ImportDraft = {
  key: string;
  session: TindeqSession;
  side: ExerciseSide;
  referenceTestId: string;
  prescribedPct: string;
  painBefore: string;
  painDuring: string;
  painAfter: string;
  status: DraftStatus;
  message: string | null;
};

const REFERENCE_SELECT =
  "id,test_date,left_force_kg,right_force_kg,created_at";

function formatNumber(
  value: number | null | undefined,
  decimals = 1,
  suffix = "",
) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "–";
  }
  return `${Number(value).toFixed(decimals).replace(".", ",")}${suffix}`;
}

function formatDate(value: string | null | undefined, withTime = false) {
  if (!value) return "–";
  const date = new Date(withTime ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(
    "cs-CZ",
    withTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" },
  ).format(date);
}

function formatSide(side: ExerciseSide | null | undefined) {
  if (side === "left") return "Levá";
  if (side === "right") return "Pravá";
  return "–";
}

function parseOptionalPositive(value: string, label: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.trim().replace(",", "."));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} musí být kladné číslo nebo prázdné.`);
  }
  return parsed;
}

function getReferenceForce(test: ReferenceTest, side: ExerciseSide) {
  return side === "left" ? Number(test.left_force_kg) : Number(test.right_force_kg);
}

function previewOptionalPositive(value: string) {
  const parsed = Number(value.trim().replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildReferenceSnapshot(
  draft: ImportDraft,
  references: ReferenceTest[],
): ReferenceSnapshot | null {
  if (!draft.referenceTestId) {
    if (draft.prescribedPct.trim()) {
      throw new Error("Procento lze zadat pouze s vybraným referenčním maximem.");
    }
    return null;
  }

  const reference = references.find((test) => test.id === draft.referenceTestId);
  if (!reference) throw new Error("Vybrané referenční maximum už není dostupné.");
  const referenceForceKg = getReferenceForce(reference, draft.side);
  if (!Number.isFinite(referenceForceKg) || referenceForceKg <= 0) {
    throw new Error("Referenční maximum vybrané strany není platné.");
  }

  const prescribedPct = parseOptionalPositive(draft.prescribedPct, "Procento");
  return {
    referenceTestId: reference.id,
    referenceTestDate: reference.test_date,
    referenceForceKg,
    prescribedPct,
    targetForceKg:
      prescribedPct === null
        ? null
        : calculateTargetForce(referenceForceKg, prescribedPct),
  };
}

export default function TindeqClientRecords({
  selectedClient,
}: TindeqClientRecordsProps) {
  const { supabase, session, state, error: authError } = useSupabaseSession();
  const [isOpen, setIsOpen] = useState(false);
  const [references, setReferences] = useState<ReferenceTest[]>([]);
  const [history, setHistory] = useState<StoredWorkflowSession[]>([]);
  const [drafts, setDrafts] = useState<ImportDraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const selectedClientId = selectedClient?.id ?? null;

  const loadRecords = useCallback(async () => {
    if (!supabase || !session || !selectedClientId) {
      setReferences([]);
      setHistory([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [testsResult, nextHistory] = await Promise.all([
        supabase
          .from("knee_extension_tests")
          .select(REFERENCE_SELECT)
          .eq("athlete_id", selectedClientId)
          .is("deleted_at", null)
          .order("test_date", { ascending: false })
          .order("created_at", { ascending: false }),
        loadWorkflowHistory(supabase, selectedClientId),
      ]);

      if (testsResult.error) throw new Error(testsResult.error.message);
      setReferences((testsResult.data ?? []) as ReferenceTest[]);
      setHistory(nextHistory);
      setLoadError(null);
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : "Tindeq data nelze načíst.";
      setLoadError(
        detail.includes("column") || detail.includes("schema cache")
          ? "Databázová migrace pro Tindeq záznamy zatím není aplikována."
          : detail,
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedClientId, session, supabase]);

  useEffect(() => {
    setDrafts([]);
    setMessage("");
    setIsOpen(false);
  }, [selectedClientId]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void loadRecords();
    });
    return () => {
      cancelled = true;
    };
  }, [loadRecords]);

  const latestReferenceId = references[0]?.id ?? "";

  async function importFile(file: File | null) {
    if (!file || !selectedClient) return;
    setMessage("Načítám Tindeq export…");
    try {
      const result = await importTindeqArchive(file);
      setDrafts(
        result.sessions.map((parsedSession, index) => ({
          key: `${parsedSession.id}-${index}`,
          session: parsedSession,
          side: "left",
          referenceTestId: latestReferenceId,
          prescribedPct:
            parsedSession.metadata.workLevelPct > 0
              ? String(parsedSession.metadata.workLevelPct)
              : "",
          painBefore: "",
          painDuring: "",
          painAfter: "",
          status: "ready",
          message: null,
        })),
      );
      setMessage(
        `Načteno ${result.sessions.length} záznamů${
          result.errors.length
            ? `; chybné vnitřní soubory: ${result.errors.length}`
            : ""
        }.`,
      );
    } catch (caught) {
      setDrafts([]);
      setMessage(
        caught instanceof Error ? caught.message : "Tindeq ZIP nelze analyzovat.",
      );
    }
  }

  function patchDraft(key: string, patch: Partial<ImportDraft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)),
    );
  }

  function editDraft(key: string, patch: Partial<ImportDraft>) {
    patchDraft(key, { ...patch, status: "ready", message: null });
  }

  async function saveDraft(draft: ImportDraft) {
    if (!supabase || !selectedClient) return;
    patchDraft(draft.key, { status: "saving", message: "Ukládám…" });

    try {
      const reference = buildReferenceSnapshot(draft, references);
      const result = await saveWorkflowSession(supabase, draft.session, {
        athleteId: selectedClient.id,
        side: draft.side,
        reference,
        pain: {
          before: parseOptionalPain(draft.painBefore),
          duringMax: parseOptionalPain(draft.painDuring),
          after: parseOptionalPain(draft.painAfter),
        },
      });

      if (!result.ok) {
        patchDraft(draft.key, {
          status: result.duplicate ? "duplicate" : "error",
          message: result.duplicate
            ? `${result.error} Záznam ${result.existing.id}.`
            : result.error,
        });
        return;
      }

      setDrafts((current) =>
        current.map((item) =>
          item.key === draft.key
            ? {
                ...item,
                status: "saved",
                message: "Uloženo bez původního ZIPu a raw časové řady.",
              }
            : item,
        ),
      );
      await loadRecords();
    } catch (caught) {
      patchDraft(draft.key, {
        status: "error",
        message:
          caught instanceof Error ? caught.message : "Záznam se nepodařilo uložit.",
      });
    }
  }

  const historySummary = useMemo(
    () =>
      history.map((record) => ({
        record,
        title: `${formatDate(record.measured_at, true)} · ${formatSide(
          record.exercise_side,
        )}`,
      })),
    [history],
  );

  return (
    <section id="tindeq-records" className={styles.section}>
      <div className={styles.headingRow}>
        <div>
          <p className={styles.eyebrow}>Tindeq</p>
          <h2>Tindeq záznamy klienta</h2>
          <p className={styles.help}>
            Vyber klienta v Knee aplikaci, nahraj jeho Tindeq ZIP a ulož
            normalizovaný výsledek přímo do historie klienta.
          </p>
        </div>
        {selectedClient && state === "signed-in" ? (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? "Zavřít import" : "Přidat Tindeq záznam"}
          </button>
        ) : null}
      </div>

      {!selectedClient ? (
        <p className={styles.emptyState}>Nejdřív vyber klienta v přehledu výše.</p>
      ) : state === "loading" ? (
        <p className={styles.emptyState}>Ověřuji přihlášení…</p>
      ) : state === "unconfigured" ? (
        <p className={styles.errorText}>Chybí Supabase konfigurace.</p>
      ) : state === "error" ? (
        <p className={styles.errorText}>{authError ?? "Přihlášení nelze ověřit."}</p>
      ) : state === "signed-out" ? (
        <p className={styles.emptyState}>
          Přihlas se v hlavní části aplikace a znovu vyber klienta.
        </p>
      ) : (
        <>
          <div className={styles.clientContext}>
            Záznam bude uložen klientovi <strong>{selectedClient.name}</strong>.
          </div>

          {isOpen ? (
            <div className={styles.importPanel}>
              <label className={styles.fileInput}>
                Tindeq ZIP
                <input
                  type="file"
                  accept=".zip,application/zip"
                  onChange={(event) => void importFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <p className={styles.help}>
                Klienta už aplikace zná. Název souboru se proto nepoužívá k
                automatickému přiřazování.
              </p>

              {drafts.map((draft) => {
                const reference = references.find(
                  (test) => test.id === draft.referenceTestId,
                );
                const referenceForce = reference
                  ? getReferenceForce(reference, draft.side)
                  : null;
                const prescribedPct = previewOptionalPositive(draft.prescribedPct);
                const evaluation = evaluateTindeqSessionSide(
                  draft.session,
                  draft.side,
                  referenceForce,
                  prescribedPct,
                );

                return (
                  <article className={styles.importCard} key={draft.key}>
                    <div className={styles.cardHeading}>
                      <div>
                        <h3>{draft.session.metadata.tag || draft.session.datasetName}</h3>
                        <p>
                          {formatDate(draft.session.metadata.measuredAt, true)} ·{" "}
                          {draft.session.analysis.detectedRepetitions} opakování
                        </p>
                      </div>
                      <span className={styles.badge}>{draft.session.metadata.type}</span>
                    </div>

                    <div className={styles.formGrid}>
                      <label>
                        Strana
                        <select
                          value={draft.side}
                          onChange={(event) =>
                            editDraft(draft.key, {
                              side: event.target.value as ExerciseSide,
                            })
                          }
                        >
                          <option value="left">Levá</option>
                          <option value="right">Pravá</option>
                        </select>
                      </label>
                      <label>
                        Referenční maximum
                        <select
                          value={draft.referenceTestId}
                          onChange={(event) =>
                            editDraft(draft.key, {
                              referenceTestId: event.target.value,
                              prescribedPct: event.target.value
                                ? draft.prescribedPct
                                : "",
                            })
                          }
                        >
                          <option value="">Bez reference</option>
                          {references.map((test) => (
                            <option value={test.id} key={test.id}>
                              {formatDate(test.test_date)} · L{" "}
                              {formatNumber(test.left_force_kg, 1)} / P{" "}
                              {formatNumber(test.right_force_kg, 1)} kg
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Procento maxima
                        <input
                          inputMode="decimal"
                          value={draft.prescribedPct}
                          disabled={!draft.referenceTestId}
                          onChange={(event) =>
                            editDraft(draft.key, {
                              prescribedPct: event.target.value,
                            })
                          }
                          placeholder="volitelné"
                        />
                      </label>
                      <label>
                        Bolest před
                        <input
                          inputMode="decimal"
                          value={draft.painBefore}
                          onChange={(event) =>
                            editDraft(draft.key, { painBefore: event.target.value })
                          }
                          placeholder="0–10"
                        />
                      </label>
                      <label>
                        Bolest během max
                        <input
                          inputMode="decimal"
                          value={draft.painDuring}
                          onChange={(event) =>
                            editDraft(draft.key, { painDuring: event.target.value })
                          }
                          placeholder="0–10"
                        />
                      </label>
                      <label>
                        Bolest po
                        <input
                          inputMode="decimal"
                          value={draft.painAfter}
                          onChange={(event) =>
                            editDraft(draft.key, { painAfter: event.target.value })
                          }
                          placeholder="0–10"
                        />
                      </label>
                    </div>

                    <dl className={styles.summaryGrid}>
                      <div>
                        <dt>Průměr</dt>
                        <dd>{formatNumber(evaluation.meanForceKg, 1, " kg")}</dd>
                      </div>
                      <div>
                        <dt>Maximum / cíl</dt>
                        <dd>
                          {formatNumber(evaluation.meanPctReference, 1, " %")} /{" "}
                          {formatNumber(evaluation.meanPctTarget, 1, " %")}
                        </dd>
                      </div>
                      <div>
                        <dt>Nejlepší / nejslabší</dt>
                        <dd>
                          {formatNumber(evaluation.bestRepForceKg, 1)} /{" "}
                          {formatNumber(evaluation.weakestRepForceKg, 1)} kg
                        </dd>
                      </div>
                      <div>
                        <dt>Konzistence</dt>
                        <dd>{formatNumber(evaluation.consistencyCvPct, 1, " % CV")}</dd>
                      </div>
                    </dl>

                    {!draft.referenceTestId ? (
                      <p className={styles.warning}>
                        Bez reference se uloží technická analýza bez procenta maxima
                        a cíle.
                      </p>
                    ) : null}

                    <button
                      type="button"
                      className={styles.primaryButton}
                      disabled={draft.status === "saving" || draft.status === "saved"}
                      onClick={() => void saveDraft(draft)}
                    >
                      {draft.status === "saving"
                        ? "Ukládám…"
                        : draft.status === "saved"
                          ? "Uloženo"
                          : `Uložit klientovi ${selectedClient.name}`}
                    </button>
                    {draft.message ? (
                      <p
                        className={
                          draft.status === "error" || draft.status === "duplicate"
                            ? styles.errorText
                            : styles.message
                        }
                      >
                        {draft.message}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : null}

          {message ? <p className={styles.message}>{message}</p> : null}
          {loadError ? <p className={styles.errorText}>{loadError}</p> : null}
          {isLoading ? <p className={styles.emptyState}>Načítám historii…</p> : null}

          <div className={styles.historyHeading}>
            <h3>Historie Tindeq</h3>
            <Link href="/tindeq" className={styles.secondaryLink}>
              Obecný analyzátor
            </Link>
          </div>
          {!isLoading && historySummary.length === 0 ? (
            <p className={styles.emptyState}>Klient zatím nemá uložený Tindeq záznam.</p>
          ) : (
            <div className={styles.historyList}>
              {historySummary.map(({ record, title }) => (
                <details className={styles.historyCard} key={record.id}>
                  <summary>
                    <strong>{title}</strong>
                    <span>
                      {formatNumber(record.mean_force_kg, 1, " kg")} ·{" "}
                      {formatNumber(record.mean_pct_reference, 1, " % maxima")}
                    </span>
                  </summary>
                  <dl className={styles.summaryGrid}>
                    <div>
                      <dt>Reference</dt>
                      <dd>
                        {formatNumber(record.reference_force_kg, 1, " kg")} ·{" "}
                        {formatDate(record.reference_test_date)}
                      </dd>
                    </div>
                    <div>
                      <dt>Procento / cíl</dt>
                      <dd>
                        {formatNumber(record.prescribed_pct, 0, " %")} /{" "}
                        {formatNumber(record.prescribed_target_force_kg, 1, " kg")}
                      </dd>
                    </div>
                    <div>
                      <dt>Nejlepší / nejslabší</dt>
                      <dd>
                        {formatNumber(record.best_rep_force_kg, 1)} /{" "}
                        {formatNumber(record.weakest_rep_force_kg, 1)} kg
                      </dd>
                    </div>
                    <div>
                      <dt>Bolest před / během / po</dt>
                      <dd>
                        {formatNumber(record.pain_before, 0)} /{" "}
                        {formatNumber(record.pain_during_max, 0)} /{" "}
                        {formatNumber(record.pain_after, 0)}
                      </dd>
                    </div>
                    <div>
                      <dt>Opakování</dt>
                      <dd>
                        {record.detected_repetitions} z {record.expected_repetitions}
                      </dd>
                    </div>
                    <div>
                      <dt>Upozornění</dt>
                      <dd>
                        {record.warnings.length
                          ? record.warnings.join("; ")
                          : "Bez upozornění"}
                      </dd>
                    </div>
                  </dl>
                </details>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
