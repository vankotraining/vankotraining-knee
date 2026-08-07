import type { TindeqSession } from "@/lib/tindeq-browser";
import { buildClientSideView } from "@/lib/tindeq-client-view";
import {
  formatTindeqNumber,
  formatTindeqSignedNumber,
  tindeqToneClass,
} from "./tindeq-presentation";
import styles from "./tindeq.module.css";

type SideSummary = TindeqSession["analysis"]["summary"]["left"];

type SideCardProps = {
  label: string;
  accentClass: string;
  target: number | null;
  summary: SideSummary;
  unit: string;
};

export function ClientSideCard({
  label,
  accentClass,
  target,
  summary,
  unit,
}: SideCardProps) {
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
          <dd>{formatTindeqNumber(view.targetForce, 1, ` ${unit}`)}</dd>
        </div>
        <div>
          <dt>Průměrná síla</dt>
          <dd>{formatTindeqNumber(view.averageForce, 1, ` ${unit}`)}</dd>
        </div>
        <div>
          <dt>Dosažení cíle</dt>
          <dd>{formatTindeqNumber(view.targetAchievementPct, 0, " %")}</dd>
        </div>
        <div>
          <dt>Čas v cíli</dt>
          <dd>{formatTindeqNumber(view.timeInTargetPct, 0, " %")}</dd>
        </div>
        <div>
          <dt>Stabilita</dt>
          <dd className={tindeqToneClass(view.stabilityTone)}>{view.stability}</dd>
        </div>
      </dl>
    </section>
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
    <section className={`${styles.sideCard} ${accentClass}`}>
      <header className={styles.sideHeader}>
        <span className={styles.sideDot} aria-hidden="true" />
        <h4>{label}</h4>
      </header>
      <dl className={styles.sideMetricList}>
        <div>
          <dt>Cílová síla</dt>
          <dd>{formatTindeqNumber(target, 1, ` ${unit}`)}</dd>
        </div>
        <div>
          <dt>Průměrné splnění cíle</dt>
          <dd>{formatTindeqNumber(summary.meanPctTarget, 1, " %")}</dd>
        </div>
        <div>
          <dt>Čas v pásmu ±5 %</dt>
          <dd>{formatTindeqNumber(summary.meanTimeIn5Pct, 0, " %")}</dd>
        </div>
        <div>
          <dt>CV během opakování</dt>
          <dd>{formatTindeqNumber(summary.medianWithinRepCvPct, 1, " %")}</dd>
        </div>
        <div>
          <dt>CV mezi opakováními</dt>
          <dd>{formatTindeqNumber(summary.betweenRepCvPct, 1, " %")}</dd>
        </div>
        <div>
          <dt>Trend v sérii</dt>
          <dd>{formatTindeqSignedNumber(summary.trendPctTargetPerRep, 2, " p. b./opak.")}</dd>
        </div>
      </dl>
    </section>
  );
}
