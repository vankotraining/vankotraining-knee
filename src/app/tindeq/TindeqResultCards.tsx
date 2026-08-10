import type { TindeqSession } from "@/lib/tindeq-browser";
import { buildClientSideView, presentationMeanForce } from "@/lib/tindeq-client-view";
import {
  betweenRepCvStatus,
  targetAchievementStatus,
  timeInTargetStatus,
  TINDEQ_METRIC_COPY,
  TINDEQ_RULE_TYPE_LABELS,
  withinRepCvStatus,
  type TindeqMetricCopy,
  type TindeqPresentationStatus,
} from "@/lib/tindeq-metric-presentation";
import {
  formatTindeqNumber,
  formatTindeqSignedNumber,
} from "./tindeq-presentation";
import metricStyles from "./tindeq-metrics.module.css";
import styles from "./tindeq.module.css";

type SideSummary = TindeqSession["analysis"]["summary"]["left"];

type SideCardProps = {
  label: string;
  accentClass: string;
  target: number | null;
  summary: SideSummary;
  unit: string;
};

const STATUS_SCALE_ITEMS: Array<{
  status: TindeqPresentationStatus;
  meaning: string;
}> = [
  { status: { label: "V cíli", tone: "good" }, meaning: "V pořádku / v cílovém rozmezí." },
  { status: { label: "Sleduj", tone: "warning" }, meaning: "Hraniční / vyžaduje pozornost." },
  { status: { label: "Mimo cíl", tone: "problem" }, meaning: "Problém / výrazná odchylka." },
  { status: { label: "Bez hodnocení", tone: "neutral" }, meaning: "Neutrální stav bez korektní dobré/špatné klasifikace." },
];

export function TindeqStatusBadge({ status }: { status: TindeqPresentationStatus }) {
  return (
    <span className={metricStyles.statusBadge} data-tone={status.tone}>
      {status.label}
    </span>
  );
}

export function TindeqStatusLegend() {
  return (
    <aside className={metricStyles.statusLegend} aria-label="3stupňová barevná škála + neutrální stav">
      <strong>3stupňová barevná škála + neutrální stav</strong>
      <div className={metricStyles.statusLegendGrid}>
        {STATUS_SCALE_ITEMS.map(({ status, meaning }) => (
          <div className={metricStyles.statusLegendItem} key={status.tone}>
            <TindeqStatusBadge status={status} />
            <span>{meaning}</span>
          </div>
        ))}
      </div>
      <p className={metricStyles.statusLegendNote}>
        Šedá není čtvrtý stupeň hodnocení. Znamená, že metriku nelze korektně klasifikovat jako dobrou nebo špatnou.
      </p>
    </aside>
  );
}

export function TindeqMetricRow({
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
    <div className={metricStyles.metricRow} data-tone={status?.tone}>
      <div className={metricStyles.metricHeader}>
        <span className={metricStyles.metricName}>{label}</span>
        <span className={metricStyles.ruleType}>{TINDEQ_RULE_TYPE_LABELS[copy.ruleType]}</span>
      </div>
      <div className={metricStyles.metricValueLine}>
        <strong className={metricStyles.metricValue}>{value}</strong>
        {status ? <TindeqStatusBadge status={status} /> : null}
      </div>
      <p className={metricStyles.metricExplanation}>{copy.explanation}</p>
      {copy.detail ? (
        <details className={metricStyles.metricDetails}>
          <summary>Více informací</summary>
          <p>{copy.detail}</p>
        </details>
      ) : null}
    </div>
  );
}

function CompactMetric({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: TindeqPresentationStatus;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <span>{value}</span>
        {status ? <TindeqStatusBadge status={status} /> : null}
      </dd>
    </div>
  );
}

export function ClientSideCard({
  label,
  accentClass,
  target,
  summary,
  unit,
}: SideCardProps) {
  const view = buildClientSideView(target, summary);
  return (
    <>
      {label === "Levá noha" ? <TindeqStatusLegend /> : null}
      <section className={`${styles.sideCard} ${accentClass}`}>
        <header className={styles.sideHeader}>
          <span className={styles.sideDot} aria-hidden="true" />
          <h4>{label}</h4>
        </header>
        <dl className={styles.sideMetricList}>
          <CompactMetric
            label="Cílová síla"
            value={formatTindeqNumber(view.targetForce, 1, ` ${unit}`)}
          />
          <CompactMetric
            label="Průměrná síla"
            value={formatTindeqNumber(view.averageForce, 1, ` ${unit}`)}
          />
          <CompactMetric
            label="Dosažení cíle"
            status={targetAchievementStatus(view.targetAchievementPct)}
            value={formatTindeqNumber(view.targetAchievementPct, 0, " %")}
          />
          <CompactMetric
            label="Čas v cíli"
            status={timeInTargetStatus(view.timeInTargetPct)}
            value={formatTindeqNumber(view.timeInTargetPct, 0, " %")}
          />
          <CompactMetric
            label="Stabilita"
            status={{ label: view.stability, tone: view.stabilityTone }}
            value={formatTindeqNumber(summary.medianWithinRepCvPct, 1, " % CV")}
          />
        </dl>
      </section>
    </>
  );
}

export function TrainerSideCard({
  label,
  accentClass,
  target,
  summary,
  unit,
}: SideCardProps) {
  return (
    <>
      {label === "Levá noha" ? <TindeqStatusLegend /> : null}
      <section className={`${styles.sideCard} ${accentClass}`}>
        <header className={styles.sideHeader}>
          <span className={styles.sideDot} aria-hidden="true" />
          <h4>{label}</h4>
        </header>
        <div className={metricStyles.metricList}>
          <TindeqMetricRow
            copy={TINDEQ_METRIC_COPY.targetForce}
            label="Cílová síla"
            value={formatTindeqNumber(target, 1, ` ${unit}`)}
          />
          <TindeqMetricRow
            copy={TINDEQ_METRIC_COPY.averageForce}
            label="Průměrná síla"
            value={formatTindeqNumber(presentationMeanForce(target, summary.meanPctTarget), 1, ` ${unit}`)}
          />
          <TindeqMetricRow
            copy={TINDEQ_METRIC_COPY.targetAchievement}
            label="Dosažení cíle"
            status={targetAchievementStatus(summary.meanPctTarget)}
            value={formatTindeqNumber(summary.meanPctTarget, 1, " %")}
          />
          <TindeqMetricRow
            copy={TINDEQ_METRIC_COPY.timeInTarget}
            label="Čas v pásmu ±5 %"
            status={timeInTargetStatus(summary.meanTimeIn5Pct)}
            value={formatTindeqNumber(summary.meanTimeIn5Pct, 0, " %")}
          />
          <TindeqMetricRow
            copy={TINDEQ_METRIC_COPY.withinRepCv}
            label="CV během opakování"
            status={withinRepCvStatus(summary.medianWithinRepCvPct)}
            value={formatTindeqNumber(summary.medianWithinRepCvPct, 1, " %")}
          />
          <TindeqMetricRow
            copy={TINDEQ_METRIC_COPY.betweenRepCv}
            label="CV mezi opakováními"
            status={betweenRepCvStatus(summary.betweenRepCvPct)}
            value={formatTindeqNumber(summary.betweenRepCvPct, 1, " %")}
          />
          <TindeqMetricRow
            copy={TINDEQ_METRIC_COPY.trend}
            label="Trend v sérii"
            value={formatTindeqSignedNumber(summary.trendPctTargetPerRep, 2, " p. b./opak.")}
          />
          <TindeqMetricRow
            copy={TINDEQ_METRIC_COPY.firstToLast}
            label="První–poslední"
            value={formatTindeqSignedNumber(summary.firstToLastChangePctPoints, 1, " p. b.")}
          />
        </div>
      </section>
    </>
  );
}
