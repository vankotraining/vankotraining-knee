import type {
  TindeqCanonicalReport,
  TindeqReportFinding,
  TindeqReportSide,
} from "@/lib/tindeq-report";
import styles from "./tindeq.module.css";

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

function toneForStatus(status: string) {
  if (status === "splněno" || status === "progrese") return styles.good;
  if (
    status === "nesplněno" ||
    status === "regrese" ||
    status === "technicky nehodnotitelné" ||
    status === "opakování měření"
  ) {
    return styles.problem;
  }
  if (
    status === "hraniční" ||
    status === "zachování" ||
    status === "technická úprava provedení" ||
    status === "doplnění údajů před rozhodnutím"
  ) {
    return styles.warning;
  }
  return styles.neutral;
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
      <dl className={styles.sideMetricList}>
        <div><dt>Cílová síla</dt><dd>{formatNumber(side.targetForceKg, 1, " kg")}</dd></div>
        <div><dt>Průměrná síla</dt><dd>{formatNumber(side.averageForceKg, 1, " kg")}</dd></div>
        <div><dt>Dosažení cíle</dt><dd>{formatNumber(side.targetAchievementPct, 0, " %")}</dd></div>
        <div><dt>Čas v cílovém pásmu</dt><dd>{formatNumber(side.timeInTargetPct, 0, " %")}</dd></div>
        <div><dt>Úspěšná opakování</dt><dd>{side.successfulRepetitions}/{side.evaluableRepetitions}</dd></div>
        <div><dt>Úspěšnost</dt><dd>{formatNumber(side.successRatePct, 0, " %")}</dd></div>
        <div><dt>CV uvnitř kontrakce</dt><dd>{formatNumber(side.withinRepCvPct, 1, " %")}</dd></div>
        <div><dt>CV mezi opakováními</dt><dd>{formatNumber(side.betweenRepCvPct, 1, " %")}</dd></div>
        <div><dt>Pod cílem / nad cílem</dt><dd>{side.undershootRepetitions} / {side.overshootRepetitions}</dd></div>
        <div><dt>Průměrný náběh na 95 %</dt><dd>{formatNumber(side.meanOnsetTo95Seconds, 2, " s")}</dd></div>
        <div><dt>Trend série</dt><dd>{formatNumber(side.trendPctTargetPerRep, 2, " p. b./opak.")}</dd></div>
        <div><dt>První–poslední</dt><dd>{formatNumber(side.firstToLastChangePctPoints, 1, " p. b.")}</dd></div>
        <div><dt>Změna času v pásmu</dt><dd>{formatNumber(side.timeInTargetChangePctPoints, 1, " p. b.")}</dd></div>
      </dl>
    </section>
  );
}

function FindingCard({ finding }: { finding: TindeqReportFinding }) {
  return (
    <section className={styles.protocolCard}>
      <div>
        <p className={styles.eyebrow}>Pravidlový závěr</p>
        <h3>{finding.title}</h3>
        <strong className={toneForStatus(finding.status)}>{finding.status}</strong>
        <p>{finding.summary}</p>
      </div>
      <dl className={styles.protocolGrid}>
        {finding.evidence.map((item) => (
          <div key={`${finding.title}-${item.metric}`}>
            <dt>{item.metric}</dt>
            <dd>{item.value}</dd>
            <small>{item.rule}</small>
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
            <div><dt>Protokol</dt><dd>{context.protocol || "–"}</dd></div>
            <div><dt>Úhel kolene</dt><dd>{formatNumber(context.kneeAngleDegrees, 0, "°")}</dd></div>
            <div><dt>MVIC / maximum levá</dt><dd>{formatNumber(context.previousMaxLeftKg, 1, " kg")}</dd></div>
            <div><dt>MVIC / maximum pravá</dt><dd>{formatNumber(context.previousMaxRightKg, 1, " kg")}</dd></div>
            <div><dt>Předepsaná intenzita</dt><dd>{formatNumber(context.prescribedPct, 0, " %")}</dd></div>
            <div><dt>Cíl levá / pravá</dt><dd>{formatNumber(context.targetForceLeftKg, 1, " kg")} / {formatNumber(context.targetForceRightKg, 1, " kg")}</dd></div>
            <div><dt>Opakování</dt><dd>{context.detectedRepetitions}/{context.expectedRepetitions}</dd></div>
            <div><dt>Bolest před / během / po</dt><dd>{formatNumber(context.painBefore, 0, "/10")} / {formatNumber(context.painDuring, 0, "/10")} / {formatNumber(context.painAfter, 0, "/10")}</dd></div>
          </dl>
        </section>

        {context.missingData.length > 0 ? (
          <section className={styles.alert}>
            <strong>Chybějící kontext</strong>
            <ul>{context.missingData.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
        ) : null}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>2. Výkon</p><h3>Výsledek podle strany</h3></div>
          <span>Úspěšné opakování: 95–105 % cíle a ≥60 % času v pásmu</span>
        </div>
        <div className={styles.sideGrid}>
          <SideReportCard accentClass={styles.leftSide} label="Levá noha" side={performance.left} />
          <SideReportCard accentClass={styles.rightSide} label="Pravá noha" side={performance.right} />
        </div>
        <dl className={styles.protocolGrid}>
          <div><dt>Rozdíl normalizovaného výkonu</dt><dd>{formatNumber(performance.normalizedSideDifferencePctPoints, 1, " p. b.")}</dd></div>
          <div><dt>Rozdíl průměrné síly</dt><dd>{formatNumber(performance.averageForceDifferenceKg, 1, " kg")}</dd></div>
        </dl>
        <FindingCard finding={performance.finding} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>3. Kontrola a stabilita</p><h3>Variabilita a technický průběh</h3></div>
        </div>
        <dl className={styles.protocolGrid}>
          <div><dt>Průměrný rozdíl náběhu stran</dt><dd>{formatNumber(control.meanAbsOnsetDifferenceSeconds, 2, " s")}</dd></div>
          <div><dt>Opakování s technickým flagem</dt><dd>{control.repetitionsWithTechnicalFlags}</dd></div>
          <div><dt>Podíl technických flagů</dt><dd>{formatNumber(control.technicalFlagRatePct, 0, " %")}</dd></div>
        </dl>
        <FindingCard finding={control.finding} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>4. Únava a vývoj série</p><h3>{fatigue.pattern}</h3></div>
        </div>
        <FindingCard finding={fatigue.finding} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>5. Interpretace</p><h3>{report.interpretation.headline}</h3></div>
          <strong className={toneForStatus(report.interpretation.status)}>{report.interpretation.status}</strong>
        </div>
        <p>{report.interpretation.summary}</p>
        <FindingCard finding={reaction.finding} />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div><p className={styles.eyebrow}>6. Doporučení pro další trénink</p><h3 className={toneForStatus(report.recommendation.action)}>{report.recommendation.action}</h3></div>
        </div>
        <section className={styles.alert}>
          <strong>{report.recommendation.summary}</strong>
          <ul>{report.recommendation.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </section>
      </section>

      <footer className={styles.methodNote}>
        <strong>Limity interpretace</strong>
        <ul>{report.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
      </footer>
    </article>
  );
}
