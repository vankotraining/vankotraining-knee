"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CAPACITY_STAGES,
  CLINICAL_EXERCISE_CARDS,
  CLINICAL_EXERCISE_MAP_SNAPSHOT,
  CLINICAL_FAMILIES,
  CLINICAL_GOALS,
  EARLY_KNEE_REASONING_LENS,
  getClinicalGoal,
  getMappingConfidenceLabel,
  type ClinicalExerciseCard,
} from "@/lib/clinical-exercise-map-v1";
import { useSupabaseSession } from "@/lib/use-supabase-session";
import styles from "./clinical-exercise-map.module.css";
import ClinicalLearningBridge from "./ClinicalLearningBridge";

type TrainingExercise = {
  id: string;
  name: string;
  family_slug: string | null;
  category: string | null;
  training_type: string | null;
  laterality: string | null;
  equipment: string[] | null;
  segments: string[] | null;
  source: string | null;
  source_row: number | null;
  is_active: boolean;
};

const loadFields: Array<[keyof ClinicalExerciseCard["loadSignature"], string]> = [
  ["contraction", "Kontrakce"],
  ["laterality", "Laterality"],
  ["romKneeFlexionDemand", "ROM / flexion"],
  ["kneeForwardDemand", "Knee-forward"],
  ["velocity", "Velocity"],
  ["impactLoadingRateDemand", "Impact / loading rate"],
  ["decelerationDemand", "Deceleration"],
  ["assistance", "Assistance"],
  ["externalLoad", "External load"],
];

function confidenceClass(confidence: ClinicalExerciseCard["mappingConfidence"]) {
  if (confidence === "A") return styles.confidenceA;
  if (confidence === "B") return styles.confidenceB;
  return styles.confidenceC;
}

function mappingReason(state: ClinicalExerciseCard["mappingState"]) {
  if (state === "exact") {
    return "Direct clinical use is documented in the existing projection provenance.";
  }
  if (state === "probable") {
    return "Documented clinical use has a probable canonical Training match, but the Visit does not store an exact exercise_id.";
  }
  return "Clinical use may be documented, but an exact Training mapping is intentionally unresolved and needs clinician/library review.";
}

function trainingLinkStatus(
  card: ClinicalExerciseCard,
  libraryState: "idle" | "loading" | "ready" | "error",
  liveTraining: TrainingExercise | null,
) {
  if (!card.trainingExerciseId) {
    return { label: "none", className: styles.trainingNone };
  }
  if (libraryState === "ready") {
    return liveTraining
      ? { label: "verified", className: styles.trainingVerified }
      : { label: "unresolved", className: styles.trainingUnresolved };
  }
  return {
    label: libraryState === "error" ? "unavailable" : "pending",
    className: styles.trainingPending,
  };
}

function renderArray(value: string[] | null) {
  return value && value.length > 0 ? value.join(", ") : "unknown";
}

export default function ClinicalExerciseMap({ initialNode }: { initialNode?: string }) {
  const { supabase, session, state, error: authError, isConfigured } = useSupabaseSession();
  const [libraryResult, setLibraryResult] = useState<{
    sessionUserId: string;
    exercises: TrainingExercise[];
    error: string | null;
  } | null>(null);
  const [selectedId, setSelectedId] = useState(() => {
    const match = CLINICAL_EXERCISE_CARDS.find((card) => initialNode === `family:${card.family}` || initialNode === `capacity:${card.capacity}`);
    return match?.id ?? CLINICAL_EXERCISE_CARDS[0]?.id ?? "";
  });

  useEffect(() => {
    if (!supabase || !session) return;

    let active = true;
    const sessionUserId = session.user.id;

    void (async () => {
      const { data, error } = await supabase
        .from("exercises")
        .select(
          "id,name,family_slug,category,training_type,laterality,equipment,segments,source,source_row,is_active",
        )
        .eq("is_active", true)
        .order("name");

      if (!active) return;
      setLibraryResult({
        sessionUserId,
        exercises: error ? [] : ((data ?? []) as TrainingExercise[]),
        error: error?.message ?? null,
      });
    })();

    return () => {
      active = false;
    };
  }, [session, supabase]);

  const currentLibraryResult =
    session && libraryResult?.sessionUserId === session.user.id ? libraryResult : null;
  const trainingExercises = currentLibraryResult?.exercises ?? [];
  const libraryError = currentLibraryResult?.error ?? null;
  const libraryState: "idle" | "loading" | "ready" | "error" =
    !session
      ? "idle"
      : !currentLibraryResult
        ? "loading"
        : currentLibraryResult.error
          ? "error"
          : "ready";

  const trainingById = new Map(trainingExercises.map((exercise) => [exercise.id, exercise]));

  const selectedCard =
    CLINICAL_EXERCISE_CARDS.find((card) => card.id === selectedId) ??
    CLINICAL_EXERCISE_CARDS[0] ??
    null;

  const selectedTraining = selectedCard?.trainingExerciseId
    ? trainingById.get(selectedCard.trainingExerciseId) ?? null
    : null;
  const selectedFamily = selectedCard
    ? CLINICAL_FAMILIES.find((family) => family.id === selectedCard.family) ?? null
    : null;
  const selectedCapacity = selectedCard
    ? CAPACITY_STAGES.find((stage) => stage.id === selectedCard.capacity) ?? null
    : null;
  const selectedTrainingLink = selectedCard
    ? trainingLinkStatus(selectedCard, libraryState, selectedTraining)
    : null;
  const activeGoal = CLINICAL_GOALS[0] ?? null;
  const selectedGoalLinks =
    selectedCard?.clinicalGoalLinks
      ?.map((link) => ({ link, goal: getClinicalGoal(link.goalId) }))
      .filter((item) => item.goal) ?? [];

  if (!isConfigured || state === "unconfigured") {
    return (
      <main className={styles.page}>
        <section className={styles.stateCard}>
          <p className={styles.eyebrow}>Clinical Map · read-only</p>
          <h1>Chybí Supabase konfigurace</h1>
          <p>Clinical Map potřebuje stejnou přihlašovací konfiguraci jako ostatní Knee workspace.</p>
        </section>
      </main>
    );
  }

  if (state === "loading") {
    return (
      <main className={styles.page}>
        <section className={styles.stateCard} aria-live="polite">
          <p className={styles.eyebrow}>Clinical Map · read-only</p>
          <h1>Ověřuji přihlášení…</h1>
        </section>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className={styles.page}>
        <section className={styles.stateCard} role="alert">
          <p className={styles.eyebrow}>Clinical Map · read-only</p>
          <h1>Přihlášení se nepodařilo ověřit</h1>
          <p>{authError ?? "Neznámá chyba autentizace."}</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className={styles.page}>
        <section className={styles.stateCard}>
          <p className={styles.eyebrow}>Clinical Map · read-only</p>
          <h1>Nejdřív se přihlas</h1>
          <p>Clinical data ani Training library se bez aktivní Knee session nenačítají.</p>
          <Link className={styles.primaryLink} href="/">Přejít na Klienty a přihlášení</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>knee.vankotraining.cz · read-only</p>
          <h1>Clinical Map</h1>
          <p className={styles.intro}>
            Vizuální mapa proměnných pro klinickou rozvahu: stav kolene, limitery, modifikátory,
            možnosti intervence a response. Nejde o protokol ani automatickou progresi.
          </p>
        </div>
        <div className={styles.snapshot}>
          <strong>Projection {CLINICAL_EXERCISE_MAP_SNAPSHOT.snapshotDate}</strong>
          <span>
            {CLINICAL_EXERCISE_MAP_SNAPSHOT.canonicalVisits} Visits ·{" "}
            {CLINICAL_EXERCISE_MAP_SNAPSHOT.primaryKneeContextEpisodes} primary knee-context episodes
          </span>
          <span>
            Training live:{" "}
            {libraryState === "ready"
              ? `${trainingExercises.length} active exercises`
              : libraryState === "loading"
                ? "načítám…"
                : libraryState === "error"
                  ? "nedostupné"
                  : "čeká"}
          </span>
        </div>
      </header>

      {libraryState === "error" ? (
        <div className={styles.warning} role="alert">
          Live Training library se nepodařilo načíst: {libraryError}. Projection zůstává viditelná,
          ale exercise_id nelze v této session runtime ověřit.
        </div>
      ) : null}

      <section className={styles.legend} aria-label="Clinical mapping a Training link legenda">
        <div className={styles.legendGroup}>
          <strong>Clinical mapping confidence</strong>
          <div className={styles.legendItems}>
            <span className={`${styles.badge} ${styles.confidenceA}`}>A · direct clinical use</span>
            <span className={`${styles.badge} ${styles.confidenceB}`}>B · probable mapping</span>
            <span className={`${styles.badge} ${styles.confidenceC}`}>C · unresolved</span>
          </div>
          <p>A/B/C popisuje klinickou provenance a jistotu mapování, ne účinnost cviku.</p>
        </div>
        <div className={styles.legendGroup}>
          <strong>Training library link</strong>
          <div className={styles.legendItems}>
            <span className={`${styles.linkStatus} ${styles.trainingVerified}`}>verified</span>
            <span className={`${styles.linkStatus} ${styles.trainingUnresolved}`}>unresolved</span>
            <span className={`${styles.linkStatus} ${styles.trainingNone}`}>none</span>
          </div>
          <p>Samostatný runtime stav exercise_id; nemění clinical confidence.</p>
        </div>
      </section>

      <section className={styles.reasoningLens} aria-labelledby="early-knee-title">
        <div className={styles.reasoningHeader}>
          <div>
            <p className={styles.eyebrow}>Clinical reasoning lens · not a protocol</p>
            <h2 id="early-knee-title">{EARLY_KNEE_REASONING_LENS.label}</h2>
            <p>{EARLY_KNEE_REASONING_LENS.description}</p>
          </div>
          <span className={styles.reasoningStatus}>Overview only</span>
        </div>

        <p className={styles.quietKneeNote}>{EARLY_KNEE_REASONING_LENS.quietKneeNote}</p>

        <div className={styles.reasoningGrid}>
          <article className={styles.reasoningCard}>
            <strong>State</strong>
            <div className={styles.reasoningChips}>
              {EARLY_KNEE_REASONING_LENS.stateVariables.map((item) => <span key={item}>{item}</span>)}
            </div>
          </article>

          <article className={styles.reasoningCard}>
            <strong>Limiter</strong>
            <div className={styles.reasoningChips}>
              {EARLY_KNEE_REASONING_LENS.limiters.map((item) => <span key={item}>{item}</span>)}
            </div>
          </article>

          <article className={styles.reasoningCard}>
            <strong>Modifiers</strong>
            <div className={styles.reasoningChips}>
              {EARLY_KNEE_REASONING_LENS.modifiers.map((item) => <span key={item}>{item}</span>)}
            </div>
          </article>

          <article className={styles.reasoningCard}>
            <strong>Options</strong>
            {EARLY_KNEE_REASONING_LENS.optionGroups.map((group) => (
              <div className={styles.optionGroup} key={group.label}>
                <span className={styles.optionGroupLabel}>{group.label}</span>
                <div className={styles.reasoningChips}>
                  {group.items.map((item) => <span key={item}>{item}</span>)}
                </div>
              </div>
            ))}
          </article>

          <article className={styles.reasoningCard}>
            <strong>Response</strong>
            <div className={styles.reasoningChips}>
              {EARLY_KNEE_REASONING_LENS.responseVariables.map((item) => <span key={item}>{item}</span>)}
            </div>
          </article>
        </div>

        <div className={styles.reasoningFooter}>
          <div>
            <strong>CSB guardrails</strong>
            <div className={styles.reasoningEvidence}>
              {EARLY_KNEE_REASONING_LENS.evidence.map((item) => (
                <span key={item.claimId}>{item.claimId}</span>
              ))}
            </div>
          </div>
          {activeGoal ? (
            <div className={styles.reviewedGoal}>
              <span>Reviewed goal</span>
              <strong>{activeGoal.label}</strong>
              <div className={styles.reasoningChips}>
                {activeGoal.components.map((component) => (
                  <span key={component.id}>{component.label}</span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <p className={styles.reasoningNote}>{EARLY_KNEE_REASONING_LENS.note}</p>
      </section>

      <div className={styles.workspace}>
        <section className={styles.matrixPanel} aria-labelledby="capacity-title">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Výchozí view</p>
              <h2 id="capacity-title">Capacity view</h2>
            </div>
            <div className={styles.matrixGuidance}>
              <p>Kliknutí drží výběr a otevře inspector.</p>
              <span className={styles.scrollHint} aria-hidden="true">Posuň doprava →</span>
            </div>
          </div>

          <div className={styles.matrixViewport} data-testid="clinical-map-matrix-viewport">
            <div className={styles.matrix} role="grid" aria-label="Clinical Exercise Capacity Map">
              <div
                className={`${styles.cell} ${styles.corner}`}
                data-testid="clinical-map-corner"
                role="columnheader"
              >
                Exercise family
              </div>
              {CAPACITY_STAGES.map((stage) => (
                <div
                  aria-label={`${stage.label}: ${stage.description}`}
                  className={`${styles.cell} ${styles.stageHeader}`}
                  data-testid="clinical-map-stage-header"
                  role="columnheader"
                  key={stage.id}
                >
                  <strong>{stage.label}</strong>
                  <span>{stage.description}</span>
                </div>
              ))}

              {CLINICAL_FAMILIES.flatMap((family) => {
                const row = [
                  <div
                    className={`${styles.cell} ${styles.familyCell}`}
                    data-testid="clinical-map-family-cell"
                    role="rowheader"
                    key={`${family.id}-label`}
                  >
                    {family.label}
                  </div>,
                ];

                for (const stage of CAPACITY_STAGES) {
                  const cards = CLINICAL_EXERCISE_CARDS.filter(
                    (card) => card.family === family.id && card.capacity === stage.id,
                  );
                  row.push(
                    <div
                      className={`${styles.cell} ${styles.mapCell}`}
                      data-card-count={cards.length}
                      role="gridcell"
                      key={`${family.id}-${stage.id}`}
                    >
                      {cards.map((card) => {
                        const liveTraining = card.trainingExerciseId
                          ? trainingById.get(card.trainingExerciseId)
                          : null;
                        const isSelected = card.id === selectedId;
                        const activeGoalLink = activeGoal
                          ? card.clinicalGoalLinks?.find((link) => link.goalId === activeGoal.id)
                          : null;
                        const linkStatus = trainingLinkStatus(
                          card,
                          libraryState,
                          liveTraining ?? null,
                        );

                        return (
                          <button
                            aria-pressed={isSelected}
                            className={[
                              styles.exerciseCard,
                              isSelected ? styles.selected : "",
                              activeGoalLink ? styles.goalLinked : "",
                            ].filter(Boolean).join(" ")}
                            key={card.id}
                            onClick={() => setSelectedId(card.id)}
                            type="button"
                          >
                            <span className={styles.cardTopline}>
                              <span className={`${styles.badge} ${confidenceClass(card.mappingConfidence)}`}>
                                {card.mappingConfidence}
                              </span>
                              <span className={`${styles.linkStatus} ${linkStatus.className}`}>
                                Training {linkStatus.label}
                              </span>
                            </span>
                            <strong>{card.canonicalName}</strong>
                            <span className={styles.variant}>{card.variant}</span>
                            {activeGoalLink ? (
                              <span className={styles.goalTag}>↳ Reviewed goal</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>,
                  );
                }
                return row;
              })}
            </div>
          </div>
        </section>

        <aside className={styles.inspector} aria-live="polite">
          {selectedCard ? (
            <>
              <div className={styles.inspectorHeader}>
                <div>
                  <p className={styles.eyebrow}>Exercise identity</p>
                  <h2>{selectedCard.canonicalName}</h2>
                  <p>{selectedCard.variant}</p>
                </div>
              </div>

              <dl className={styles.identityGrid}>
                <div><dt>Clinical family</dt><dd>{selectedFamily?.label ?? selectedCard.family}</dd></div>
                <div><dt>Capacity placement</dt><dd>{selectedCapacity?.label ?? selectedCard.capacity}</dd></div>
                <div>
                  <dt>Clinical mapping confidence</dt>
                  <dd>
                    <span className={`${styles.badge} ${confidenceClass(selectedCard.mappingConfidence)}`}>
                      {getMappingConfidenceLabel(selectedCard.mappingConfidence)}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt>Training library link</dt>
                  <dd>
                    <span className={`${styles.linkStatus} ${selectedTrainingLink?.className ?? ""}`}>
                      {selectedTrainingLink?.label ?? "unknown"}
                    </span>
                  </dd>
                </div>
              </dl>

              {selectedGoalLinks.length > 0 ? (
                <section className={styles.inspectorSection}>
                  <h3>Clinical goal links</h3>
                  <div className={styles.stack}>
                    {selectedGoalLinks.map(({ link, goal }) => (
                      <article className={styles.goalLinkCard} key={link.goalId}>
                        <div className={styles.goalLinkMeta}>
                          <strong>{goal?.label}</strong>
                          <span>{link.role}</span>
                        </div>
                        <p>{link.note}</p>
                        <div className={styles.goalLinkGroups}>
                          <div>
                            <span className={styles.goalLinkLabel}>Components</span>
                            <div className={styles.goalChips}>
                              {link.componentIds.map((componentId) => (
                                <span key={componentId}>
                                  {goal?.components.find((item) => item.id === componentId)?.label ?? componentId}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <span className={styles.goalLinkLabel}>Limiter targets</span>
                            <div className={styles.goalChips}>
                              {link.limiterIds.map((limiterId) => (
                                <span key={limiterId}>
                                  {goal?.limiters.find((item) => item.id === limiterId)?.label ?? limiterId}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}

              <section className={styles.inspectorSection}>
                <h3>Proč je cvik v mapě</h3>
                <p className={styles.mappingReason}>{mappingReason(selectedCard.mappingState)}</p>
              </section>
              <ClinicalLearningBridge nodeIds={[`family:${selectedCard.family}`, `capacity:${selectedCard.capacity}`]} supabase={supabase} session={session} />

              <section className={styles.inspectorSection}>
                <h3>Relevant clinical contexts</h3>
                <div className={styles.chips}>
                  {selectedCard.clinicalContexts.map((context) => (
                    <span key={context}>{context}</span>
                  ))}
                </div>
                <p className={styles.caution}>
                  Context není automaticky potvrzená diagnóza a mapa nevytváří diagnózu ani RTS verdict.
                </p>
              </section>

              <section className={styles.inspectorSection}>
                <h3>Clinical-use provenance</h3>
                <div className={styles.stack}>
                  {selectedCard.provenance.map((item, index) => (
                    <article className={styles.provenanceCard} key={`${item.label}-${index}`}>
                      <strong>{item.label}</strong>
                      {item.visitId ? (
                        <span className={styles.provenanceMeta}>
                          Visit {item.visitDate ?? "unknown date"} · {item.visitId}
                        </span>
                      ) : null}
                      <p>{item.note}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.inspectorSection}>
                <h3>Context guardrails</h3>
                <div className={styles.stack}>
                  {selectedCard.evidence.map((item) => (
                    <article className={styles.guardrail} key={item.claimId}>
                      <strong>{item.claimId} · {item.context}</strong>
                      <p>{item.guardrail}</p>
                    </article>
                  ))}
                </div>
                <p className={styles.caution}>
                  Claim je guardrail pro klinické rozhodování; není důkaz, že tato konkrétní exercise varianta „léčí“ daný kontext.
                </p>
              </section>

              <section className={styles.inspectorSection}>
                <h3>Unresolved questions</h3>
                {selectedCard.unresolvedQuestions.length > 0 ? (
                  <ul>
                    {selectedCard.unresolvedQuestions.map((question) => <li key={question}>{question}</li>)}
                  </ul>
                ) : (
                  <p>V rámci V1 nejsou pro tuto kartu evidované další mapping otázky.</p>
                )}
              </section>

              <details className={styles.dataDisclosure}>
                <summary>Data / provenance</summary>
                <div className={styles.dataDisclosureBody}>
                  <dl className={styles.detailList}>
                    <div><dt>exercise_id</dt><dd className={styles.codeValue}>{selectedCard.trainingExerciseId ?? "unresolved"}</dd></div>
                    <div><dt>Clinical family key</dt><dd>{selectedCard.family}</dd></div>
                    <div><dt>Capacity key</dt><dd>{selectedCard.capacity}</dd></div>
                    <div><dt>Mapping state</dt><dd>{selectedCard.mappingState}</dd></div>
                    <div><dt>Expected Training name</dt><dd>{selectedCard.expectedTrainingName ?? "unresolved"}</dd></div>
                    <div><dt>Training library family</dt><dd>{selectedTraining?.family_slug ?? "unknown"}</dd></div>
                  </dl>

                  <h4>Live Training metadata</h4>
                  {selectedCard.trainingExerciseId ? (
                    selectedTraining ? (
                      <dl className={styles.detailList}>
                        <div><dt>Name</dt><dd>{selectedTraining.name}</dd></div>
                        <div><dt>Category</dt><dd>{selectedTraining.category ?? "unknown"}</dd></div>
                        <div><dt>Training type</dt><dd>{selectedTraining.training_type ?? "unknown"}</dd></div>
                        <div><dt>Laterality</dt><dd>{selectedTraining.laterality ?? "unknown"}</dd></div>
                        <div><dt>Segments</dt><dd>{renderArray(selectedTraining.segments)}</dd></div>
                        <div><dt>Equipment</dt><dd>{renderArray(selectedTraining.equipment)}</dd></div>
                        <div><dt>Source row</dt><dd>{selectedTraining.source ?? "unknown"}{selectedTraining.source_row ? ` · row ${selectedTraining.source_row}` : ""}</dd></div>
                        <div><dt>Active</dt><dd>{selectedTraining.is_active ? "true" : "false"}</dd></div>
                      </dl>
                    ) : (
                      <p className={styles.unknown}>
                        {libraryState === "ready"
                          ? "Projection odkazuje na exercise_id, který není mezi aktuálně aktivními Training exercises. Vyžaduje kontrolu; mapping se automaticky nenahrazuje."
                          : "Čekám na live ověření Training library."}
                      </p>
                    )
                  ) : (
                    <p className={styles.unknown}>Exact Training exercise_id nebylo bezpečně určeno.</p>
                  )}

                  <h4>Load signature</h4>
                  <dl className={styles.detailList}>
                    {loadFields.map(([field, label]) => (
                      <div key={field}>
                        <dt>{label}</dt>
                        <dd>{selectedCard.loadSignature[field] ?? "unknown"}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </details>
            </>
          ) : null}
        </aside>
      </div>

      <footer className={styles.footer}>
        <strong>Authority model:</strong> CLIENTS = klinický průběh · Knee/Tindeq/Fmax = objektivní kapacita ·
        Training = canonical exercise library · historical programs = sekundární provenance · Clinical Second Brain =
        evidence guardrails.
      </footer>
    </main>
  );
}
