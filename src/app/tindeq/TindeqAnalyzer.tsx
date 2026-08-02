"use client";

import { useState, type KeyboardEvent } from "react";
import {
  importTindeqArchive,
  type RepetitionResult,
  type TindeqSession,
} from "@/lib/tindeq-browser";
import {
  buildClientChartComment,
  buildClientSideView,
  buildClientSummary,
  clientAccuracyLabel,
  clientWarnings,
  DEFAULT_TINDEQ_RESULT_VIEW,
  overallMaintenance,
  overallStability,
  overallTargetAchievement,
  type ResultViewMode,
} from "@/lib/tindeq-client-view";
import type { SaveTindeqSessionResult } from "@/lib/tindeq-persistence";
import styles from "./tindeq.module.css";

type LoadState = "idle" | "loading" | "ready" | "error";
type SaveState = "idle" | "saving" | "success" | "partial" | "error";

type SelectedAthlete = {
  id: string;
  displayName: string;
};

type TindeqAnalyzerProps = {
  selectedAthlete: SelectedAthlete | null;
  onSaveSessions: (sessions: TindeqSession[]) => Promise<SaveTindeqSessionResult[]>;
};

function formatNumber(value: number | null | undefined, decimals = 1, suffix = "") {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return `${value.toFixed(decimals).replace(".", ",")}${suffix}`;
}

function formatSignedNumber(
  value: number | null | undefined,
  decimals = 2,
  suffix = "",
) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  const normalized = Math.abs(value) < 10 ** -(decimals + 1) ? 0 : value;
  const sign = normalized > 0 ? "+" : normalized < 0 ? "−" : "";
  return `${sign}${Math.abs(normalized).toFixed(decimals).replace(".", ",")}${suffix}`;
}

function formatDate(value: string) {
  if (!value) return "–";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("cs-CZ", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(parsed);
}

function toneForStatus(value: string) {
  const normalized = value.toLocaleLowerCase("cs-CZ");
  if (
    normalized.includes("bez výrazného poklesu") ||
    normalized.includes("bez poklesu")
  ) {
    return styles.good;
  }
  if (
    normalized.includes("výrazná odchylka") ||
    normalized.includes("výraznější odchylka") ||
    normalized.includes("výrazný pokles") ||
    normalized.includes("výraznější pokles") ||
    normalized.includes("výrazně kolísavá") ||
    normalized.includes("nestabil") ||
    normalized.includes("nelze vyhodnotit")
  ) {
    return styles.problem;
  }
  if (
    normalized.includes("kontrole") ||
    normalized.includes("mírný") ||
    normalized.includes("kolísavá")
  ) {
    return styles.warning;
  }
  if (
    normalized.includes("dobrá") ||
    normalized.includes("dobře") ||
    normalized.includes("stabilní")
  ) {
    return styles.good;
  }
  return styles.neutral;
}


function normalizeIdentity(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("cs-CZ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tagMatchesAthlete(tag: string, athleteName: string) {
  const normalizedTag = normalizeIdentity(tag);
  const normalizedAthlete = normalizeIdentity(athleteName);
  if (!normalizedTag || !normalizedAthlete) return true;
  return normalizedTag.includes(normalizedAthlete) || normalizedAthlete.includes(normalizedTag);
}

function medianCurve(curves: Array<Array<number | null>>): Array<number | null> {
  if (curves.length === 0) return [];
  return Array.from({ length: curves[0].length }, (_, index) => {
    const values = curves
      .map((curve) => curve[index])
      .filter((value): value is number => value !== null && Number.isFinite(value))
      .sort((a, b) => a - b);
    if (values.length === 0) return null;
    const middle = Math.floor(values.length / 2);
    return values.length % 2 === 0
      ? (values[middle - 1] + values[middle]) / 2
      : values[middle];
  });
}

function pathForCurve(curve: Array<number | null>, width: number, height: number) {
  const minY = 70;
  const maxY = 120;
  return curve
    .map((value, index) => {
      if (value === null) return null;
      const x = (index / Math.max(1, curve.length - 1)) * width;
      const clamped = Math.max(minY, Math.min(maxY, value));
      const y = height - ((clamped - minY) / (maxY - minY)) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean)
    .join(" ");
}

function OverlayChart({
  repetitions,
  mode,
}: {
  repetitions: RepetitionResult[];
  mode: ResultViewMode;
}) {
  const width = 720;
  const plotHeight = 260;
  const totalHeight = 300;
  const leftCurves = repetitions.map((repetition) => repetition.curveLeftPct);
  const rightCurves = repetitions.map((repetition) => repetition.curveRightPct);
  const leftMedian = medianCurve(leftCurves);
  const rightMedian = medianCurve(rightCurves);
  const yFor = (value: number) => plotHeight - ((value - 70) / 50) * plotHeight;
  const ariaLabel =
    mode === "client"
      ? "Graf průběhu síly levé a pravé nohy během jednotlivých opakování vůči nastavenému cíli"
      : "Normalizované průběhy jednotlivých opakování a jejich mediánové křivky";

  return (
    <div className={styles.chartWrap}>
      <div className={styles.chartScroller} tabIndex={0} aria-label="Posuvná oblast grafu">
        <svg
          aria-label={ariaLabel}
          className={styles.chart}
          role="img"
          viewBox={`0 0 ${width} ${totalHeight}`}
        >
          <rect
            className={styles.targetBand}
            height={yFor(95) - yFor(105)}
            width={width}
            x="0"
            y={yFor(105)}
          />
          {[80, 90, 95, 100, 105, 110, 120].map((value) => (
            <g key={value}>
              <line
                className={value === 100 ? styles.targetLine : styles.gridLine}
                x1="0"
                x2={width}
                y1={yFor(value)}
                y2={yFor(value)}
              />
              <text className={styles.axisText} x="34" y={yFor(value) - 5}>
                {value} %
              </text>
            </g>
          ))}
          {leftCurves.map((curve, index) => (
            <path
              className={styles.leftCurve}
              d={pathForCurve(curve, width, plotHeight)}
              key={`left-${index}`}
            />
          ))}
          {rightCurves.map((curve, index) => (
            <path
              className={styles.rightCurve}
              d={pathForCurve(curve, width, plotHeight)}
              key={`right-${index}`}
            />
          ))}
          <path className={styles.leftMedian} d={pathForCurve(leftMedian, width, plotHeight)} />
          <path className={styles.rightMedian} d={pathForCurve(rightMedian, width, plotHeight)} />
          <text className={styles.regionAbove} textAnchor="end" x="710" y="20">
            Nad cílem
          </text>
          <text className={styles.regionTarget} textAnchor="end" x="710" y={yFor(100) - 8}>
            V cíli
          </text>
          <text className={styles.regionBelow} textAnchor="end" x="710" y="245">
            Pod cílem
          </text>
          <text className={styles.xAxisLabel} textAnchor="middle" x="360" y="292">
            Průběh opakování
          </text>
          <text
            className={styles.yAxisLabel}
            textAnchor="middle"
            transform="rotate(-90 13 130)"
            x="13"
            y="130"
          >
            Síla vůči cíli
          </text>
        </svg>
      </div>
      <div className={styles.legend} aria-label="Legenda grafu">
        <span>
          <i className={styles.leftLegend} />Levá noha
        </span>
        <span>
          <i className={styles.rightLegend} />Pravá noha
        </span>
        <span>
          <i className={styles.thinLegend} />Jednotlivá opakování
        </span>
        <span>
          <i className={styles.typicalLegend} />Typický průběh
        </span>
      </div>
      {mode === "trainer" && (
        <p className={styles.chartTechnicalNote}>
          Tenké čáry představují jednotlivá opakování, silné čáry mediánový průběh.
          Cílové pásmo odpovídá 95–105 % nastavené síly.
        </p>
      )}
    </div>
  );
}

function ClientSideCard({
  label,
  accentClass,
  target,
  summary,
  unit,
}: {
  label: string;
  accentClass: string;
  target: number | null;
  summary: TindeqSession["analysis"]["summary"]["left"];
  unit: string;
}) {
  const view = buildClientSideView(target, summary);
  return (
    <section className={`${styles.sideCard} ${accentClass}`}>
      <header className={styles.sideHeader}>
        <span className={styles.sideDot} aria-hidden="true" />
        <h4>{label}</h4>
      </header>
      <dl className={styles.sideMetricList}>
        <div>
          <dt>Cílová síla</dt>
          <dd>{formatNumber(view.targetForce, 1, ` ${unit}`)}</dd>
        </div>
        <div>
          <dt>Průměrná síla</dt>
          <dd>{formatNumber(view.averageForce, 1, ` ${unit}`)}</dd>
        </div>
        <div>
          <dt>Dosažení cíle</dt>
          <dd>{formatNumber(view.targetAchievementPct, 0, " %")}</dd>
        </div>
        <div>
          <dt>Čas v cíli</dt>
          <dd>{formatNumber(view.timeInTargetPct, 0, " %")}</dd>
        </div>
        <div>
          <dt>Stabilita</dt>
          <dd className={toneForStatus(view.stability)}>{view.stability}</dd>
        </div>
      </dl>
    </section>
  );
}

function TrainerSideCard({
  label,
  accentClass,
  target,
  summary,
  unit,
}: {
  label: string;
  accentClass: string;
  target: number | null;
  summary: TindeqSession["analysis"]["summary"]["left"];
  unit: string;
}) {
  return (
    <section className={`${styles.sideCard} ${accentClass}`}>
      <header className={styles.sideHeader}>
        <span className={styles.sideDot} aria-hidden="true" />
        <h4>{label}</h4>
      </header>
      <dl className={styles.sideMetricList}>
        <div>
          <dt>Cílová síla</dt>
          <dd>{formatNumber(target, 1, ` ${unit}`)}</dd>
        </div>
        <div>
          <dt>Průměrné splnění cíle</dt>
          <dd>{formatNumber(summary.meanPctTarget, 1, " %")}</dd>
        </div>
        <div>
          <dt>Čas v pásmu ±5 %</dt>
          <dd>{formatNumber(summary.meanTimeIn5Pct, 0, " %")}</dd>
        </div>
        <div>
          <dt>CV během opakování</dt>
          <dd>{formatNumber(summary.medianWithinRepCvPct, 1, " %")}</dd>
        </div>
        <div>
          <dt>CV mezi opakováními</dt>
          <dd>{formatNumber(summary.betweenRepCvPct, 1, " %")}</dd>
        </div>
        <div>
          <dt>Trend v sérii</dt>
          <dd>{formatSignedNumber(summary.trendPctTargetPerRep, 2, " p. b./opak.")}</dd>
        </div>
      </dl>
    </section>
  );
}

function SessionResult({ session }: { session: TindeqSession }) {
  const { metadata, analysis } = session;
  const [viewMode, setViewMode] = useState<ResultViewMode>(DEFAULT_TINDEQ_RESULT_VIEW);
  const clientSummary = buildClientSummary(session);
  const targetAchievement = overallTargetAchievement(session);
  const stability = overallStability(session);
  const maintenance = overallMaintenance(session);
  const graphComment = buildClientChartComment(session);
  const warnings = clientWarnings(session);
  const unit = metadata.unit || "kg";

  function selectMode(mode: ResultViewMode) {
    setViewMode(mode);
    window.requestAnimationFrame(() => {
      document.getElementById(`tindeq-${mode}-tab`)?.focus();
    });
  }

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home" || event.key === "ArrowLeft") selectMode("client");
    else selectMode("trainer");
  }

  return (
    <article className={styles.result}>
      <section className={styles.resultHeader}>
        <div className={styles.resultIdentity}>
          <p className={styles.eyebrow}>{metadata.type || "Repeaters"}</p>
          <h2>{metadata.tag}</h2>
          <p>{formatDate(metadata.measuredAt)}</p>
        </div>
        <div className={styles.viewSwitch} role="tablist" aria-label="Zobrazení výsledku">
          <button
            aria-controls="tindeq-client-panel"
            aria-selected={viewMode === "client"}
            className={viewMode === "client" ? styles.activeViewTab : ""}
            id="tindeq-client-tab"
            onClick={() => setViewMode("client")}
            onKeyDown={handleTabKey}
            role="tab"
            tabIndex={viewMode === "client" ? 0 : -1}
            type="button"
          >
            Pro klienta
          </button>
          <button
            aria-controls="tindeq-trainer-panel"
            aria-selected={viewMode === "trainer"}
            className={viewMode === "trainer" ? styles.activeViewTab : ""}
            id="tindeq-trainer-tab"
            onClick={() => setViewMode("trainer")}
            onKeyDown={handleTabKey}
            role="tab"
            tabIndex={viewMode === "trainer" ? 0 : -1}
            type="button"
          >
            Detail pro trenéra
          </button>
        </div>
      </section>

      {viewMode === "client" ? (
        <div
          aria-labelledby="tindeq-client-tab"
          className={styles.clientPanel}
          id="tindeq-client-panel"
          role="tabpanel"
          tabIndex={0}
        >
          <p className={styles.compactProtocol}>
            {analysis.detectedRepetitions} opakování · {formatNumber(metadata.workDurationSeconds, 0)} sekund ·{" "}
            {formatNumber(metadata.workLevelPct, 0)} % MVC
          </p>

          <section className={`${styles.clientSummary} ${toneForStatus(clientSummary.title)}`}>
            <p className={styles.eyebrow}>Výsledek série</p>
            <h3>{clientSummary.title}</h3>
            <p>{clientSummary.text}</p>
          </section>

          <section className={styles.clientDomainGrid} aria-label="Tři hlavní výsledky série">
            <div className={styles.clientMetricCard}>
              <span>Dosažení cílové síly</span>
              <small>Jak blízko byla síla nastavenému cíli</small>
              <strong>{formatNumber(targetAchievement, 0, " %")}</strong>
              <b className={toneForStatus(clientAccuracyLabel(analysis.summary.domains.accuracy))}>
                {clientAccuracyLabel(analysis.summary.domains.accuracy)}
              </b>
            </div>
            <div className={styles.clientMetricCard}>
              <span>Stabilita síly</span>
              <small>Jak rovnoměrně byla síla během opakování držena</small>
              <strong className={toneForStatus(stability)}>{stability}</strong>
            </div>
            <div className={styles.clientMetricCard}>
              <span>Udržení výkonu</span>
              <small>Jak se výkon měnil od začátku do konce série</small>
              <strong className={toneForStatus(maintenance)}>{maintenance}</strong>
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Výsledek podle strany</p>
                <h3>Levá a pravá noha</h3>
              </div>
            </div>
            <div className={styles.sideGrid}>
              <ClientSideCard
                accentClass={styles.leftSide}
                label="Levá noha"
                summary={analysis.summary.left}
                target={analysis.targets.left}
                unit={unit}
              />
              <ClientSideCard
                accentClass={styles.rightSide}
                label="Pravá noha"
                summary={analysis.summary.right}
                target={analysis.targets.right}
                unit={unit}
              />
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.clientChartHeading}>
              <p className={styles.eyebrow}>Průběh série</p>
              <h3>Jak byla síla držena během opakování</h3>
              <p>
                Zelené pásmo ukazuje nastavený cíl. Čím více jsou čáry v zeleném pásmu a blízko u sebe,
                tím přesněji a stabilněji byla síla držena.
              </p>
            </div>
            <OverlayChart mode="client" repetitions={analysis.repetitions} />
            <p className={styles.graphComment}>{graphComment}</p>
          </section>

          <section
            className={`${styles.clientAlert} ${warnings.length === 1 && warnings[0].startsWith("Série proběhla") ? styles.clientAlertNeutral : ""}`}
          >
            <h3>Upozornění k záznamu</h3>
            <ul>
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </section>

          <p className={styles.clientDisclaimer}>
            Výsledek popisuje provedení této silové série.
          </p>
          <button
            className={styles.detailButton}
            onClick={() => setViewMode("trainer")}
            type="button"
          >
            Zobrazit detail pro trenéra
          </button>
        </div>
      ) : (
        <div
          aria-labelledby="tindeq-trainer-tab"
          className={styles.trainerPanel}
          id="tindeq-trainer-panel"
          role="tabpanel"
          tabIndex={0}
        >
          <section className={styles.domainGrid}>
            {[
              ["Splnění cíle", analysis.summary.domains.accuracy],
              ["Kontrola síly", analysis.summary.domains.control],
              ["Udržení série", analysis.summary.domains.maintenance],
            ].map(([label, value]) => (
              <div className={styles.domainCard} key={label}>
                <span>{label}</span>
                <strong className={toneForStatus(value)}>{value}</strong>
              </div>
            ))}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Souhrn podle strany</p>
                <h3>Levá a pravá noha</h3>
              </div>
              <span>CV popisuje relativní variabilitu síly.</span>
            </div>
            <div className={styles.sideGrid}>
              <TrainerSideCard
                accentClass={styles.leftSide}
                label="Levá noha"
                summary={analysis.summary.left}
                target={analysis.targets.left}
                unit={unit}
              />
              <TrainerSideCard
                accentClass={styles.rightSide}
                label="Pravá noha"
                summary={analysis.summary.right}
                target={analysis.targets.right}
                unit={unit}
              />
            </div>
          </section>

          <section className={styles.protocolCard}>
            <div>
              <p className={styles.eyebrow}>Technické údaje</p>
              <h3>Parametry měření</h3>
            </div>
            <dl className={styles.protocolGrid}>
              <div>
                <dt>Opakování</dt>
                <dd>{analysis.detectedRepetitions}/{analysis.expectedRepetitions}</dd>
              </div>
              <div>
                <dt>Pracovní interval</dt>
                <dd>{formatNumber(metadata.workDurationSeconds, 1, " s")}</dd>
              </div>
              <div>
                <dt>Intenzita</dt>
                <dd>{formatNumber(metadata.workLevelPct, 0, " % MVC")}</dd>
              </div>
              <div>
                <dt>Vzorkovací frekvence</dt>
                <dd>{formatNumber(analysis.samplingHz, 1, " Hz")}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.alert}>
            <strong>Technická upozornění</strong>
            {analysis.warnings.length > 0 ? (
              <ul>
                {analysis.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p>Bez souhrnných technických upozornění.</p>
            )}
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Průběh série</p>
                <h3>Opakování normalizovaná na 0–100 % pracovního intervalu</h3>
              </div>
              <span>Cílové pásmo: 95–105 %</span>
            </div>
            <OverlayChart mode="trainer" repetitions={analysis.repetitions} />
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.eyebrow}>Detail</p>
                <h3>Jednotlivá opakování</h3>
              </div>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th rowSpan={2} scope="col">#</th>
                    <th className={styles.leftGroupHeader} colSpan={4} scope="colgroup">Levá noha</th>
                    <th className={styles.rightGroupHeader} colSpan={4} scope="colgroup">Pravá noha</th>
                    <th rowSpan={2} scope="col">Upozornění</th>
                  </tr>
                  <tr>
                    <th scope="col">% cíle</th>
                    <th scope="col">CV</th>
                    <th scope="col">Čas ±5 %</th>
                    <th scope="col">Náběh 95 %</th>
                    <th scope="col">% cíle</th>
                    <th scope="col">CV</th>
                    <th scope="col">Čas ±5 %</th>
                    <th scope="col">Náběh 95 %</th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.repetitions.map((repetition) => (
                    <tr key={repetition.repetition}>
                      <td>{repetition.repetition}</td>
                      <td>{formatNumber(repetition.left.meanPctTarget, 1, " %")}</td>
                      <td>{formatNumber(repetition.left.cvPct, 1, " %")}</td>
                      <td>{formatNumber(repetition.left.timeIn5Pct, 0, " %")}</td>
                      <td>{formatNumber(repetition.left.timeTo95Seconds, 2, " s")}</td>
                      <td>{formatNumber(repetition.right.meanPctTarget, 1, " %")}</td>
                      <td>{formatNumber(repetition.right.cvPct, 1, " %")}</td>
                      <td>{formatNumber(repetition.right.timeIn5Pct, 0, " %")}</td>
                      <td>{formatNumber(repetition.right.timeTo95Seconds, 2, " s")}</td>
                      <td>{repetition.flags.length > 0 ? repetition.flags.join("; ") : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <footer className={styles.methodNote}>
            Výpočet používá 100ms vyhlazení, detekci nad 35 % pracovního rozsahu a stabilní část
            25–85 % kontrakce. Prahové hodnoty jsou pracovní analytické hranice, nikoliv validované
            klinické cut-off hodnoty.
          </footer>
        </div>
      )}
    </article>
  );
}

export default function TindeqAnalyzer({ selectedAthlete, onSaveSessions }: TindeqAnalyzerProps) {
  const [state, setState] = useState<LoadState>("idle");
  const [sessions, setSessions] = useState<TindeqSession[]>([]);
  const [errors, setErrors] = useState<Array<{ file: string; error: string }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveResults, setSaveResults] = useState<Record<string, SaveTindeqSessionResult>>({});
  const [saveAthleteId, setSaveAthleteId] = useState<string | null>(null);
  const activeSaveState = saveAthleteId === selectedAthlete?.id ? saveState : "idle";
  const activeSaveResults = saveAthleteId === selectedAthlete?.id ? saveResults : {};

  const selected = sessions.find((session) => session.id === selectedId) ?? sessions[0] ?? null;

  async function handleFile(file: File | null) {
    if (!file) return;
    setState("loading");
    setMessage(null);
    setSessions([]);
    setErrors([]);
    setSaveState("idle");
    setSaveResults({});
    setSaveAthleteId(null);
    try {
      const result = await importTindeqArchive(file);
      if (result.sessions.length === 0) {
        throw new Error("V archivu nebylo možné načíst žádné měření.");
      }
      setSessions(result.sessions);
      setErrors(result.errors);
      setSelectedId(result.sessions[0].id);
      setState("ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Soubor se nepodařilo zpracovat.");
      setState("error");
    }
  }

  async function handleSave() {
    if (!selectedAthlete || activeSaveState === "saving") return;
    const sessionsToSave = sessions.filter((session) => !activeSaveResults[session.id]?.ok);
    if (sessionsToSave.length === 0) return;

    setSaveAthleteId(selectedAthlete.id);
    setSaveState("saving");
    try {
      const results = await onSaveSessions(sessionsToSave);
      setSaveResults((current) => {
        const next = { ...current };
        results.forEach((result) => {
          if (result.sourceSessionId) next[result.sourceSessionId] = result;
        });
        return next;
      });
      const succeeded = results.filter((result) => result.ok).length;
      if (succeeded === results.length) setSaveState("success");
      else if (succeeded > 0) setSaveState("partial");
      else setSaveState("error");
    } catch (error) {
      setSaveState("error");
      const errorMessage = error instanceof Error ? error.message : "Uložení se nepodařilo.";
      setSaveResults((current) => ({
        ...current,
        ...Object.fromEntries(
          sessionsToSave.map((session) => [
            session.id,
            {
              ok: false as const,
              sourceSessionId: session.id,
              sourceTag: session.metadata.tag,
              error: errorMessage,
            },
          ]),
        ),
      }));
    }
  }

  const savedCount = sessions.filter((session) => activeSaveResults[session.id]?.ok).length;
  const remainingCount = sessions.length - savedCount;
  const mismatchedSessions = selectedAthlete
    ? sessions.filter((session) => !tagMatchesAthlete(session.metadata.tag, selectedAthlete.displayName))
    : [];

  return (
    <div className={styles.analyzer}>
      {sessions.length === 0 ? (
      <section className={styles.uploadCard}>
        <label className={styles.uploadLabel}>
          <input
            accept=".zip,application/zip,application/x-zip-compressed"
            disabled={state === "loading"}
            onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
            type="file"
          />
          <span className={styles.uploadIcon} aria-hidden="true">＋</span>
          <strong>{state === "loading" ? "Analyzuji soubor…" : "Nahrát Tindeq ZIP"}</strong>
          <small>Jednotlivý export nebo ZIP s více exporty</small>
        </label>
        <p className={styles.privacyNote}>
          ZIP zůstává v zařízení. Strukturovaný výsledek se uloží až po výslovném potvrzení.
        </p>
      </section>
    ) : (
      <div className={styles.reuploadBar}>
        <label className={styles.reuploadLabel}>
          <input
            accept=".zip,application/zip,application/x-zip-compressed"
            disabled={state === "loading"}
            onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
            type="file"
          />
          <span aria-hidden="true">↻</span>
          <strong>Nahrát jiný Tindeq ZIP</strong>
        </label>
      </div>
    )}

    {state === "error" && <div className={styles.errorBox}>{message}</div>}


      {sessions.length > 0 && (
        <section className={styles.savePanel} aria-labelledby="save-tindeq-title">
          <div className={styles.savePanelHeader}>
            <div>
              <p className={styles.eyebrow}>Uložení výsledku</p>
              <h2 id="save-tindeq-title">Uložit měření ke klientovi</h2>
              <p>
                {selectedAthlete
                  ? `Vybraný klient: ${selectedAthlete.displayName}`
                  : "Nejprve vyber klienta z databáze."}
              </p>
            </div>
            <button
              className={styles.saveButton}
              disabled={!selectedAthlete || activeSaveState === "saving" || remainingCount === 0}
              onClick={handleSave}
              type="button"
            >
              {activeSaveState === "saving"
                ? "Ukládám…"
                : remainingCount === 0
                  ? "Měření uloženo"
                  : sessions.length > 1
                    ? `Uložit ${remainingCount} měření ke klientovi`
                    : "Uložit měření ke klientovi"}
            </button>
          </div>

          {mismatchedSessions.length > 0 ? (
            <div className={styles.matchWarning} role="status">
              <strong>Zkontroluj přiřazení klienta.</strong>
              <p>
                Tag v exportu ({mismatchedSessions.map((session) => session.metadata.tag).join(", ")})
                neodpovídá přesně vybranému klientovi. Uložení není blokováno.
              </p>
            </div>
          ) : null}

          <div aria-live="polite" className={styles.saveStatus}>
            {activeSaveState === "success" && remainingCount === 0 ? (
              <p className={styles.saveSuccess}>Všechna měření byla bezpečně uložena.</p>
            ) : null}
            {activeSaveState === "partial" ? (
              <p className={styles.savePartial}>
                Část měření byla uložena. Znovu se odešlou pouze neúspěšné položky.
              </p>
            ) : null}
            {activeSaveState === "error" ? (
              <p className={styles.saveError}>Uložení selhalo. Analyzovaný výsledek zůstává na obrazovce.</p>
            ) : null}
            {Object.keys(activeSaveResults).length > 0 ? (
              <ul className={styles.saveResultList}>
                {sessions.map((session) => {
                  const result = activeSaveResults[session.id];
                  if (!result) return null;
                  return (
                    <li className={result.ok ? styles.saveSuccess : styles.saveError} key={session.id}>
                      <strong>{session.metadata.tag}:</strong>{" "}
                      {result.ok ? "uloženo" : result.error}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        </section>
      )}

      {sessions.length > 1 && (
        <nav className={styles.sessionTabs} aria-label="Importovaná měření">
          {sessions.map((session) => (
            <button
              aria-current={session.id === selected?.id ? "true" : undefined}
              className={session.id === selected?.id ? styles.activeTab : ""}
              key={session.id}
              onClick={() => setSelectedId(session.id)}
              type="button"
            >
              {session.metadata.tag}
              <small>{formatDate(session.metadata.measuredAt)}</small>
            </button>
          ))}
        </nav>
      )}

      {errors.length > 0 && (
        <div className={styles.errorBox}>
          <strong>Některé soubory se nepodařilo načíst:</strong>
          <ul>
            {errors.map((error) => (
              <li key={`${error.file}-${error.error}`}>
                {error.file}: {error.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && <SessionResult key={selected.id} session={selected} />}
    </div>
  );
}
