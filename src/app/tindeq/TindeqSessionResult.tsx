"use client";

import { useState, type KeyboardEvent } from "react";
import type { TindeqSession } from "@/lib/tindeq-browser";
import {
  buildClientChartComment,
  buildClientSummary,
  buildClientWarningsView,
  clientAccuracyStatus,
  DEFAULT_TINDEQ_RESULT_VIEW,
  domainTone,
  overallMaintenanceStatus,
  overallStabilityStatus,
  overallTargetAchievement,
  type ResultViewMode,
} from "@/lib/tindeq-client-view";
import { ClientSideCard, TrainerSideCard } from "./TindeqResultCards";
import TindeqResultChart from "./TindeqResultChart";
import {
  formatTindeqDate,
  formatTindeqNumber,
  tindeqToneClass,
} from "./tindeq-presentation";
import styles from "./tindeq.module.css";

export default function TindeqSessionResult({ session }: { session: TindeqSession }) {
  const { metadata, analysis } = session;
  const [viewMode, setViewMode] = useState<ResultViewMode>(DEFAULT_TINDEQ_RESULT_VIEW);
  const clientSummary = buildClientSummary(session);
  const targetAchievement = overallTargetAchievement(session);
  const stability = overallStabilityStatus(session);
  const maintenance = overallMaintenanceStatus(session);
  const accuracy = clientAccuracyStatus(analysis.summary.domains.accuracy);
  const graphComment = buildClientChartComment(session);
  const warningsView = buildClientWarningsView(session);
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
          <p>{formatTindeqDate(metadata.measuredAt)}</p>
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
            {analysis.detectedRepetitions} opakování · {formatTindeqNumber(metadata.workDurationSeconds, 0)} sekund ·{" "}
            {formatTindeqNumber(metadata.workLevelPct, 0)} % MVC
          </p>

          <section className={`${styles.clientSummary} ${tindeqToneClass(clientSummary.tone)}`}>
            <p className={styles.eyebrow}>Výsledek série</p>
            <h3>{clientSummary.title}</h3>
            <p>{clientSummary.text}</p>
          </section>

          <section className={styles.clientDomainGrid} aria-label="Tři hlavní výsledky série">
            <div className={styles.clientMetricCard}>
              <span>Dosažení cílové síly</span>
              <small>Jak blízko byla síla nastavenému cíli</small>
              <strong>{formatTindeqNumber(targetAchievement, 0, " %")}</strong>
              <b className={tindeqToneClass(accuracy.tone)}>{accuracy.label}</b>
            </div>
            <div className={styles.clientMetricCard}>
              <span>Stabilita síly</span>
              <small>Jak rovnoměrně byla síla během opakování držena</small>
              <strong className={tindeqToneClass(stability.tone)}>{stability.label}</strong>
            </div>
            <div className={styles.clientMetricCard}>
              <span>Udržení výkonu</span>
              <small>Jak se výkon měnil od začátku do konce série</small>
              <strong className={tindeqToneClass(maintenance.tone)}>{maintenance.label}</strong>
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
            <TindeqResultChart mode="client" repetitions={analysis.repetitions} />
            <p className={styles.graphComment}>{graphComment}</p>
          </section>

          <section
            className={`${styles.clientAlert} ${warningsView.tone === "neutral" ? styles.clientAlertNeutral : ""}`}
          >
            <h3>Upozornění k záznamu</h3>
            <ul>
              {warningsView.messages.map((warning) => (
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
              { label: "Splnění cíle", value: analysis.summary.domains.accuracy },
              { label: "Kontrola síly", value: analysis.summary.domains.control },
              { label: "Udržení série", value: analysis.summary.domains.maintenance },
            ].map(({ label, value }) => (
              <div className={styles.domainCard} key={label}>
                <span>{label}</span>
                <strong className={tindeqToneClass(domainTone(value))}>{value}</strong>
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
                <dd>{formatTindeqNumber(metadata.workDurationSeconds, 1, " s")}</dd>
              </div>
              <div>
                <dt>Intenzita</dt>
                <dd>{formatTindeqNumber(metadata.workLevelPct, 0, " % MVC")}</dd>
              </div>
              <div>
                <dt>Vzorkovací frekvence</dt>
                <dd>{formatTindeqNumber(analysis.samplingHz, 1, " Hz")}</dd>
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
            <TindeqResultChart mode="trainer" repetitions={analysis.repetitions} />
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
                      <td>{formatTindeqNumber(repetition.left.meanPctTarget, 1, " %")}</td>
                      <td>{formatTindeqNumber(repetition.left.cvPct, 1, " %")}</td>
                      <td>{formatTindeqNumber(repetition.left.timeIn5Pct, 0, " %")}</td>
                      <td>{formatTindeqNumber(repetition.left.timeTo95Seconds, 2, " s")}</td>
                      <td>{formatTindeqNumber(repetition.right.meanPctTarget, 1, " %")}</td>
                      <td>{formatTindeqNumber(repetition.right.cvPct, 1, " %")}</td>
                      <td>{formatTindeqNumber(repetition.right.timeIn5Pct, 0, " %")}</td>
                      <td>{formatTindeqNumber(repetition.right.timeTo95Seconds, 2, " s")}</td>
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
