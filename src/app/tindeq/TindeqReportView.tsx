import {
  betweenRepCvStatus,
  reportFindingStatus,
  recommendationStatus,
  seriesSummaryStatus,
  successRateStatus,
  targetAchievementStatus,
  technicalFlagRateStatus,
  timeInTargetStatus,
  TINDEQ_METRIC_COPY,
  TINDEQ_RULE_TYPE_LABELS,
  withinRepCvStatus,
  type TindeqMetricCopy,
  type TindeqPresentationStatus,
} from "@/lib/tindeq-metric-presentation";
import type {
  TindeqCanonicalReport,
  TindeqReportFinding,
  TindeqReportSide,
} from "@/lib/tindeq-report";
import { TindeqMetricRow, TindeqStatusBadge } from "./TindeqResultCards";
import metricStyles from "./tindeq-metrics.module.css";
import styles from "./tindeq.module.css";

const DESCRIPTIVE: TindeqMetricCopy = {
  ruleType: "descriptive",
  explanation: "Popisná hodnota protokolu bez automatického klinického hodnocení.",
};

function formatNumber(
  value: number | null | undefined,
  decimals = 1,
  suffix = "",
) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return `${value.toFixed(decimals).replace(".", ",")}${suffix}`;
}

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "–";
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function ContextMetric({
  label,
  value,
  copy,
  status,
}: {
  label: string;
  value: string;
  copy: TindeqMetricCopy;
  status?: TindeqPresentationStatus;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd className={metricStyles.metricValueLine}>
        <span>{value}</span>
        {status ? <TindeqStatusBadge status={status} /> : null}
      </dd>
      <small className={metricStyles.ruleType}>{TINDEQ_RULE_TYPE_LABELS[copy.ruleType]}</small>
      <p className={metricStyles.contextNote}>{copy.explanation}</p>
    </div>
  );
}

function SideReportCard({
  label,
  side,
  accentClass,
}: {
  label: string;
  side: TindeqReportSide;
  accentClass: string;
}) {
  return (
    <section className={`${styles.sideCard} ${accentClass}`}>
      <header className={styles.sideHeader}>
        <span className={styles.sideDot} aria-hidden="true" />
        <h4>{label}</h4>
      </header>
      <div className={metricStyles.metricList}>
        <TindeqMetricRow
          copy={TINDEQ_METRIC_COPY.targetForce}
          label="Cílová síla"
          value={formatNumber(side.targetForceKg, 1, " kg")}
        />
        <TindeqMetricRow
          copy={TINDEQ_METRIC_COPY.averageForce}
          label="Průměrná síla"
          value={formatNumber(side.averageForceKg, 1, " kg")}
        />
        <TindeqMetricRow
          copy={TINDEQ_METRIC_COPY.targetAchievement}
          label="Dosažení cíle"
          status={targetAchievementStatus(side.targetAchievementPct)}
          value={formatNumber(side.targetAchievementPct, 0, " %")}
        />
        <TindeqMetricRow
          copy={TINDEQ_METRIC_COPY.timeInTarget}
          label="Čas v cílovém pásmu"
          status={timeInTargetStatus(side.timeInTargetPct)}
          value={formatNumber(side.timeInTargetPct, 0, " %")}
        />
        <TindeqMetricRow
          copy={TINDEQ_METRIC_COPY.successfulRepetitions}
          label="Úspěšná opakování"
          value={`${side.successfulRepetitions}/${side.evaluableRepetitions}`}
        />
        <TindeqMetricRow
          copy={TINDEQ_METRIC_COPY.successRate}
          label="Úspěšnost opakování"
          status={successRateStatus(side.successRatePct)}
          value={formatNumber(side.successRatePct, 0, " %")}
        />
        <TindeqMetricRow
          copy={TINDEQ_METRIC_COPY.withinRepCv}
          label="CV uvnitř kontrakce"
          status={withinRepCvStatus(side.withinRepCvPct)}
          value={formatNumber(side.withinRepCvPct, 1, " %")}
        />
        <TindeqMetricRow
          copy={TINDEQ_METRIC_COPY.betweenRepCv}
          label="CV mezi opakováními"
          status={betweenRepCvStatus(side.betweenRepCvPct)}
          value={formatNumber(side.betweenRepCvPct, 1, " %")}
        />
        <TindeqMetricRow
          copy={DESCRIPTIVE}
          label="Pod cílem / nad cílem"
          value={`${side.undershootRepetitions} / ${side.overshootRepetitions}`}
        />
        <TindeqMetricRow
          copy={TINDEQ_METRIC_COPY.onsetTo95}
          label="Průměrný náběh na 95 %"
          value={formatNumber(side.meanOnsetTo95Seconds, 2, " s")}
        />
        <TindeqMetricRow
          copy={TINDEQ_METRIC_COPY.trend}
          label="Trend série"
          value={formatNumber(side.trendPctTargetPerRep, 2, " p. b./opak.")}
        />
        <TindeqMetricRow
          copy={TINDEQ_METRIC_COPY.firstToLast}
          label="První–poslední"
          value={formatNumber(side.firstToLastChangePctPoints, 1, " p. b.")}
        />
        <TindeqMetricRow
          copy={TINDEQ_METRIC_COPY.timeInTargetChange}
          label="Změna času v pásmu"
          value={formatNumber(side.timeInTargetChangePctPoints, 1, " p. b.")}
        />
      </div>
    </section>
  );
}

function neutralizeFatigueRule(rule: string) {
  return rule
    .replaceAll("běžná únava", "hraniční výkonový trend")
    .replaceAll("Bez poklesu", "V cíli");
}

function presentationRecommendationReason(reason: string) {
  return reason
    .replaceAll("únavu", "vývoj série")
    .replaceAll("únavový", "výkonový")
    .replaceAll("únavová", "výkonová")
    .replaceAll("únavové", "výkonové");
}

function FindingCard({
  finding,
  copy,
  title,
  summary,
  neutralizeRules = false,
}: {
  finding: TindeqReportFinding;
  copy: TindeqMetricCopy;
  title?: string;
  summary?: string;
  neutralizeRules?: boolean;
}) {
  const status = reportFindingStatus(finding.status);
  return (
    <section className={`${styles.protocolCard} ${metricStyles.findingCard}`} data-tone={status.tone}>
      <div>
        <p className={styles.eyebrow}>Pravidlový závěr</p>
        <div className={metricStyles.findingHeading}>
          <h3>{title ?? finding.title}</h3>
          <TindeqStatusBadge status={status} />
        </div>
        <p>{summary ?? finding.summary}</p>
        <p className={metricStyles.contextNote}>{copy.explanation}</p>
        {copy.detail ? (
          <details className={metricStyles.metricDetails}>
            <summary>Více informací</summary>
            <p>{copy.detail}</p>
          </details>
        ) : null}
      </div>
      <dl className={styles.protocolGrid}>
        {finding.evidence.map((item) => (
          <div key={`${finding.title}-${item.metric}`}>
            <dt>{item.metric}</dt>
            <dd>{item.value}</dd>
            <small>{neutralizeRules ? neutralizeFatigueRule(item.rule) : item.rule}</small>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function TindeqReportView({
  report,
}: {
  report: TindeqCanonicalReport;
}) {
  const { context, performance, control, fatigue, reaction } = report;
  const interpretationStatus = reportFindingStatus(report.interpretation.status);
  const interpretationSummary = seriesSummaryStatus(report.interpretation.status);
  const recommendation = recommendationStatus(report.recommendation.action);
  const painComplete = context.painBefore !== null && context.painDuring !== null && context.painAfter !== null;

  return (
    <article aria-labelledby="canonical-report-title">
      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Kanonický report</p>
            <h2 id="canonical-report-title">Rozhodovací report Tindeq</h2>
          </div>
          <span>{report.version}</span>
        </div>

        <section className={styles.protocolCard}>
          <div>
            <p className={styles.eyebrow}>1. Kontext měření</p>
            <h3>{context.athleteName || "Klient neuveden"}</h3>
            <p>{formatDate(context.measuredAt)}</p>
          </div>
          <dl className={styles.protocolGrid}>
            <ContextMetric label="Protokol" value={context.protocol || "–"} copy={DESCRIPTIVE} />
            <ContextMetric
              label="Úhel kolene"
              value={formatNumber(context.kneeAngleDegrees, 0, "°")}
              copy={{ ruleType: "contextual", explanation: "Úhel je součást standardizace měření. Samotná hodnota zde není klasifikována jako dobrá nebo špatná." }}
            />
            <ContextMetric
              label="MVIC / maximum levá"
              value={formatNumber(context.previousMaxLeftKg, 1, " kg")}
              copy={TINDEQ_METRIC_COPY.previousMax}
            />
            <ContextMetric
              label="MVIC / maximum pravá"
              value={formatNumber(context.previousMaxRightKg, 1, " kg")}
              copy={TINDEQ_METRIC_COPY.previousMax}
            />
            <ContextMetric
              label="Předepsaná intenzita"
              value={formatNumber(context.prescribedPct, 0, " %")}
              copy={TINDEQ_METRIC_COPY.prescribedIntensity}
            />
            <ContextMetric
              label="Cíl levá / pravá"
              value={`${formatNumber(context.targetForceLeftKg, 1, " kg")} / ${formatNumber(context.targetForceRightKg, 1, " kg")}`}
              copy={TINDEQ_METRIC_COPY.targetForce}
            />
            <ContextMetric
              label="Opakování"
              value={`${context.detectedRepetitions}/${context.expectedRepetitions}`}
              copy={DESCRIPTIVE}
            />
            <ContextMetric
              label="Bolest před / během / po"
              value={`${formatNumber(context.painBefore, 0, "/10")} / ${formatNumber(context.painDuring, 0, "/10")} / ${formatNumber(context.painAfter, 0, "/10")}`}
              copy={TINDEQ_METRIC_COPY.painReaction}
              status={painComplete ? reportFindingStatus(reaction.finding.status) : { label: "Bez hodnocení", tone: "neutral" }}
            />
          </dl>
        </section>

        {context.missingData.length > 0 ? (
          <section className={metricStyles.neutralNotice}>
            <div className={metricStyles.findingHeading}>
              <strong>Chybějící kontext</strong>
              <TindeqStatusBadge status={{ label: "Bez hodnocení", tone: "neutral" }} />
            </div>
            <p>Chybějící údaj sám o sobě není červený klinický nález. Omezuje pouze to, co lze z reportu spolehlivě vyvodit.</p>
            <ul>{context.missingData.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        ) : null}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>2. Výkon</p><h3>Výsledek podle strany</h3></div>
          <span>Pracovní pravidlo úspěšného opakování: 95–105 % cíle a ≥60 % času v pásmu</span>
        </div>
        <div className={styles.sideGrid}>
          <SideReportCard accentClass={styles.leftSide} label="Levá noha" side={performance.left} />
          <SideReportCard accentClass={styles.rightSide} label="Pravá noha" side={performance.right} />
        </div>
        <section className={styles.protocolCard}>
          <div>
            <p className={styles.eyebrow}>Porovnání stran</p>
            <h3>Kontextové rozdíly</h3>
          </div>
          <dl className={styles.protocolGrid}>
            <ContextMetric
              label="Rozdíl normalizovaného výkonu"
              value={formatNumber(performance.normalizedSideDifferencePctPoints, 1, " p. b.")}
              copy={TINDEQ_METRIC_COPY.normalizedSideDifference}
            />
            <ContextMetric
              label="Rozdíl průměrné síly"
              value={formatNumber(performance.averageForceDifferenceKg, 1, " kg")}
              copy={TINDEQ_METRIC_COPY.averageForceDifference}
            />
          </dl>
        </section>
        <FindingCard finding={performance.finding} copy={TINDEQ_METRIC_COPY.targetAchievement} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>3. Kontrola a stabilita</p><h3>Variabilita a technický průběh</h3></div>
        </div>
        <section className={styles.protocolCard}>
          <div>
            <p className={styles.eyebrow}>Technický kontext</p>
            <h3>Důvěra v záznam</h3>
          </div>
          <dl className={styles.protocolGrid}>
            <ContextMetric
              label="Průměrný rozdíl náběhu stran"
              value={formatNumber(control.meanAbsOnsetDifferenceSeconds, 2, " s")}
              copy={TINDEQ_METRIC_COPY.onsetDifference}
            />
            <ContextMetric
              label="Opakování s technickým flagem"
              value={String(control.repetitionsWithTechnicalFlags)}
              copy={DESCRIPTIVE}
            />
            <ContextMetric
              label="Podíl technických flagů"
              value={formatNumber(control.technicalFlagRatePct, 0, " %")}
              copy={TINDEQ_METRIC_COPY.technicalFlags}
              status={technicalFlagRateStatus(control.technicalFlagRatePct)}
            />
          </dl>
        </section>
        <FindingCard finding={control.finding} copy={TINDEQ_METRIC_COPY.withinRepCv} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>4. Vývoj série</p><h3>Souhrn výkonového trendu</h3></div>
        </div>
        <FindingCard
          copy={TINDEQ_METRIC_COPY.seriesDevelopment}
          finding={fatigue.finding}
          neutralizeRules
          summary={TINDEQ_METRIC_COPY.seriesDevelopment.explanation}
          title="Vývoj série"
        />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>5. Interpretace</p><h3>{interpretationSummary.title}</h3></div>
          <TindeqStatusBadge status={interpretationStatus} />
        </div>
        <p>{interpretationSummary.explanation}</p>
        <FindingCard finding={reaction.finding} copy={TINDEQ_METRIC_COPY.painReaction} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>6. Doporučení pro další trénink</p><h3>{report.recommendation.action}</h3></div>
          <TindeqStatusBadge status={recommendation} />
        </div>
        <section className={`${styles.protocolCard} ${metricStyles.findingCard}`} data-tone={recommendation.tone}>
          <div>
            <strong>{report.recommendation.summary}</strong>
            <p className={metricStyles.contextNote}>Doporučení vychází z pracovních pravidel tohoto reportu a dostupného kontextu.</p>
          </div>
          <ul>
            {report.recommendation.reasons.map((reason) => (
              <li key={reason}>{presentationRecommendationReason(reason)}</li>
            ))}
          </ul>
        </section>
      </section>

      <footer className={styles.methodNote}>
        <strong>Limity interpretace</strong>
        <ul>{report.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
      </footer>
    </article>
  );
}