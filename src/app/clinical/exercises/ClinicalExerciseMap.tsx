"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CAPACITY_STAGES,
  CLINICAL_EXERCISE_CARDS,
  CLINICAL_EXERCISE_MAP_SNAPSHOT,
  CLINICAL_FAMILIES,
  getMappingConfidenceLabel,
  type ClinicalExerciseCard,
} from "@/lib/clinical-exercise-map-v1";
import { useSupabaseSession } from "@/lib/use-supabase-session";
import styles from "./clinical-exercise-map.module.css";

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

function mappingLabel(state: ClinicalExerciseCard["mappingState"]) {
  if (state === "exact") return "exact";
  if (state === "probable") return "probable";
  return "unresolved";
}

function renderArray(value: string[] | null) {
  return value && value.length > 0 ? value.join(", ") : "unknown";
}

export default function ClinicalExerciseMap() {
  const { supabase, session, state, error: authError, isConfigured } = useSupabaseSession();
  const [libraryResult, setLibraryResult] = useState<{
    sessionUserId: string;
    exercises: TrainingExercise[];
    error: string | null;
  } | null>(null);
  const [selectedId, setSelectedId] = useState(CLINICAL_EXERCISE_CARDS[0]?.id ?? "");

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
            Exercise-first mapa propojující doložené klinické použití, canonical Training library a
            evidence guardrails. Kapacity nejsou rigidní lineární fáze.
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

      <section className={styles.legend} aria-label="Legenda mapping confidence">
        <span className={`${styles.badge} ${styles.confidenceA}`}>A · direct clinical use</span>
        <span className={`${styles.badge} ${styles.confidenceB}`}>B · probable mapping</span>
        <span className={`${styles.badge} ${styles.confidenceC}`}>C · unresolved</span>
        <p>
          A/B/C popisuje provenance a jistotu mapování, ne účinnost cviku. Historical library
          availability není direct clinical use.
        </p>
      </section>

      <div className={styles.workspace}>
        <section className={styles.matrixPanel} aria-labelledby="capacity-title">
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Výchozí view</p>
              <h2 id="capacity-title">Capacity view</h2>
            </div>
            <p>Kliknutí drží výběr a otevře inspector.</p>
          </div>

          <div className={styles.matrixViewport} data-testid="clinical-map-matrix-viewport">
            <div className={styles.matrix} role="grid" aria-label="Clinical Exercise Capacity Map">
              <div className={`${styles.cell} ${styles.corner}`} role="columnheader">
                Exercise family
              </div>
              {CAPACITY_STAGES.map((stage) => (
                <div className={`${styles.cell} ${styles.stageHeader}`} role="columnheader" key={stage.id}>
                  <strong>{stage.label}</strong>
                  <span>{stage.description}</span>
                </div>
              ))}

              {CLINICAL_FAMILIES.flatMap((family) => {
                const row = [
                  <div
                    className={`${styles.cell} ${styles.familyCell}`}
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
                      role="gridcell"
                      key={`${family.id}-${stage.id}`}
                    >
                      {cards.map((card) => {
                        const liveTraining = card.trainingExerciseId
                          ? trainingById.get(card.trainingExerciseId)
                          : null;
                        const isSelected = card.id === selectedId;
                        const runtimeMismatch =
                          libraryState === "ready" &&
                          card.trainingExerciseId !== null &&
                          liveTraining === undefined;

                        return (
                          <button
                            aria-pressed={isSelected}
                            className={isSelected ? `${styles.exerciseCard} ${styles.selected}` : styles.exerciseCard}
                            key={card.id}
                            onClick={() => setSelectedId(card.id)}
                            type="button"
                          >
                            <span className={styles.cardTopline}>
                              <span className={`${styles.badge} ${confidenceClass(card.mappingConfidence)}`}>
                                {card.mappingConfidence}
                              </span>
                              <span>{mappingLabel(card.mappingState)}</span>
                            </span>
                            <strong>{card.canonicalName}</strong>
                            <span className={styles.variant}>{card.variant}</span>
                            <span className={styles.trainingStatus}>
                              {card.trainingExerciseId
                                ? runtimeMismatch
                                  ? "Training ID není live"
                                  : libraryState === "ready"
                                    ? "Training ID ověřeno"
                                    : "Training ID"
                                : "exercise_id unresolved"}
                            </span>
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
                  <p className={styles.eyebrow}>Exercise inspector</p>
                  <h2>{selectedCard.canonicalName}</h2>
                  <p>{selectedCard.variant}</p>
                </div>
                <span className={`${styles.badge} ${confidenceClass(selectedCard.mappingConfidence)}`}>
                  {getMappingConfidenceLabel(selectedCard.mappingConfidence)}
                </span>
              </div>

              <dl className={styles.factGrid}>
                <div><dt>Family</dt><dd>{selectedCard.family}</dd></div>
                <div><dt>Capacity placement</dt><dd>{selectedCard.capacity}</dd></div>
                <div><dt>Training mapping</dt><dd>{selectedCard.mappingState}</dd></div>
                <div><dt>exercise_id</dt><dd className={styles.codeValue}>{selectedCard.trainingExerciseId ?? "unresolved"}</dd></div>
              </dl>

              <section className={styles.inspectorSection}>
                <h3>Live Training record</h3>
                {selectedCard.trainingExerciseId ? (
                  selectedTraining ? (
                    <dl className={styles.detailList}>
                      <div><dt>Name</dt><dd>{selectedTraining.name}</dd></div>
                      <div><dt>Family slug</dt><dd>{selectedTraining.family_slug ?? "unknown"}</dd></div>
                      <div><dt>Training type</dt><dd>{selectedTraining.training_type ?? "unknown"}</dd></div>
                      <div><dt>Laterality</dt><dd>{selectedTraining.laterality ?? "unknown"}</dd></div>
                      <div><dt>Segments</dt><dd>{renderArray(selectedTraining.segments)}</dd></div>
                      <div><dt>Equipment</dt><dd>{renderArray(selectedTraining.equipment)}</dd></div>
                      <div><dt>Source</dt><dd>{selectedTraining.source ?? "unknown"}{selectedTraining.source_row ? ` · row ${selectedTraining.source_row}` : ""}</dd></div>
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
              </section>

              <section className={styles.inspectorSection}>
                <h3>Load signature</h3>
                <dl className={styles.detailList}>
                  {loadFields.map(([field, label]) => (
                    <div key={field}>
                      <dt>{label}</dt>
                      <dd>{selectedCard.loadSignature[field] ?? "unknown"}</dd>
                    </div>
                  ))}
                </dl>
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
                <h3>Relevantní clinical contexts</h3>
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
                <h3>Evidence / guardrails</h3>
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
                <h3>Unresolved otázky</h3>
                {selectedCard.unresolvedQuestions.length > 0 ? (
                  <ul>
                    {selectedCard.unresolvedQuestions.map((question) => <li key={question}>{question}</li>)}
                  </ul>
                ) : (
                  <p>V rámci V1 nejsou pro tuto kartu evidované další mapping otázky.</p>
                )}
              </section>
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
