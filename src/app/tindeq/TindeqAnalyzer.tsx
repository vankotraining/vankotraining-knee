"use client";

import { useMemo, useState } from "react";
import {
  importTindeqArchive,
  type RepetitionResult,
  type TindeqSession,
} from "@/lib/tindeq-browser";
import styles from "./tindeq.module.css";

type LoadState = "idle" | "loading" | "ready" | "error";

function formatNumber(value: number | null | undefined, decimals = 1, suffix = "") {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  return `${value.toFixed(decimals).replace(".", ",")}${suffix}`;
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
    normalized.includes("dobrá") ||
    normalized.includes("stabilní") ||
    normalized.includes("bez poklesu")
  ) {
    return styles.good;
  }
  if (normalized.includes("kontrole") || normalized.includes("mírný")) {
    return styles.warning;
  }
  return styles.problem;
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

function OverlayChart({ repetitions }: { repetitions: RepetitionResult[] }) {
  const width = 720;
  const height = 260;
  const leftCurves = repetitions.map((repetition) => repetition.curveLeftPct);
  const rightCurves = repetitions.map((repetition) => repetition.curveRightPct);
  const leftMedian = medianCurve(leftCurves);
  const rightMedian = medianCurve(rightCurves);
  const yFor = (value: number) => height - ((value - 70) / 50) * height;

  return (
    <div className={styles.chartWrap}>
      <svg
        aria-label="Normalizované průběhy opakování"
        className={styles.chart}
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        {[80, 90, 95, 100, 105, 110, 120].map((value) => (
          <g key={value}>
            <line
              className={value === 100 ? styles.targetLine : styles.gridLine}
              x1="0"
              x2={width}
              y1={yFor(value)}
              y2={yFor(value)}
            />
            <text className={styles.axisText} x="6" y={yFor(value) - 5}>
              {value} %
            </text>
          </g>
        ))}
        {leftCurves.map((curve, index) => (
          <path
            className={styles.leftCurve}
            d={pathForCurve(curve, width, height)}
            key={`left-${index}`}
          />
        ))}
        {rightCurves.map((curve, index) => (
          <path
            className={styles.rightCurve}
            d={pathForCurve(curve, width, height)}
            key={`right-${index}`}
          />
        ))}
        <path className={styles.leftMedian} d={pathForCurve(leftMedian, width, height)} />
        <path className={styles.rightMedian} d={pathForCurve(rightMedian, width, height)} />
      </svg>
      <div className={styles.legend}>
        <span>
          <i className={styles.leftLegend} />Levá
        </span>
        <span>
          <i className={styles.rightLegend} />Pravá
        </span>
        <span className={styles.legendNote}>Tenké čáry = opakování, silná = medián</span>
      </div>
    </div>
  );
}

function SessionResult({ session }: { session: TindeqSession }) {
  const { metadata, analysis } = session;
  const averageTarget = useMemo(() => {
    const values = [
      analysis.summary.left.meanPctTarget,
      analysis.summary.right.meanPctTarget,
    ].filter((value): value is number => value !== null);
    return values.length > 0
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;
  }, [analysis.summary]);

  return (
    <article className={styles.result}>
      <section className={styles.resultHeader}>
        <div>
          <p className={styles.eyebrow}>{metadata.type || "Repeaters"}</p>
          <h2>{metadata.tag}</h2>
          <p>
            {formatDate(metadata.measuredAt)} · {metadata.workLevelPct} % MVC ·{" "}
            {metadata.repetitions} × {metadata.workDurationSeconds} s
          </p>
        </div>
        <div className={styles.targetPill}>
          Průměr cíle {formatNumber(averageTarget, 1, " %")}
        </div>
      </section>

      <section className={styles.domainGrid}>
        {[
          ["Splnění cíle", analysis.summary.domains.accuracy],
          ["Kontrola", analysis.summary.domains.control],
          ["Udržení", analysis.summary.domains.maintenance],
        ].map(([label, value]) => (
          <div className={styles.domainCard} key={label}>
            <span>{label}</span>
            <strong className={toneForStatus(value)}>{value}</strong>
          </div>
        ))}
      </section>

      <section className={styles.metricGrid}>
        <div>
          <span>Opakování</span>
          <strong>
            {analysis.detectedRepetitions}/{analysis.expectedRepetitions}
          </strong>
        </div>
        <div>
          <span>Cíl vlevo</span>
          <strong>{formatNumber(analysis.targets.left, 1, ` ${metadata.unit}`)}</strong>
        </div>
        <div>
          <span>Cíl vpravo</span>
          <strong>{formatNumber(analysis.targets.right, 1, ` ${metadata.unit}`)}</strong>
        </div>
        <div>
          <span>Vzorkování</span>
          <strong>{formatNumber(analysis.samplingHz, 1, " Hz")}</strong>
        </div>
        <div>
          <span>Čas ±5 % vlevo</span>
          <strong>{formatNumber(analysis.summary.left.meanTimeIn5Pct, 0, " %")}</strong>
        </div>
        <div>
          <span>Čas ±5 % vpravo</span>
          <strong>{formatNumber(analysis.summary.right.meanTimeIn5Pct, 0, " %")}</strong>
        </div>
        <div>
          <span>CV vlevo</span>
          <strong>{formatNumber(analysis.summary.left.medianWithinRepCvPct, 1, " %")}</strong>
        </div>
        <div>
          <span>CV vpravo</span>
          <strong>{formatNumber(analysis.summary.right.medianWithinRepCvPct, 1, " %")}</strong>
        </div>
      </section>

      {analysis.warnings.length > 0 && (
        <section className={styles.alert}>
          <strong>Upozornění</strong>
          <ul>
            {analysis.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.section}>
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Průběh série</p>
            <h3>Opakování normalizovaná na 0–100 %</h3>
          </div>
          <span>Cílové pásmo: 95–105 %</span>
        </div>
        <OverlayChart repetitions={analysis.repetitions} />
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
                <th>#</th>
                <th>Levá % cíle</th>
                <th>Pravá % cíle</th>
                <th>CV L/P</th>
                <th>Čas ±5 % L/P</th>
                <th>Náběh 95 % L/P</th>
                <th>Upozornění</th>
              </tr>
            </thead>
            <tbody>
              {analysis.repetitions.map((repetition) => (
                <tr key={repetition.repetition}>
                  <td>{repetition.repetition}</td>
                  <td>{formatNumber(repetition.left.meanPctTarget, 1, " %")}</td>
                  <td>{formatNumber(repetition.right.meanPctTarget, 1, " %")}</td>
                  <td>
                    {formatNumber(repetition.left.cvPct, 1)} /{" "}
                    {formatNumber(repetition.right.cvPct, 1)} %
                  </td>
                  <td>
                    {formatNumber(repetition.left.timeIn5Pct, 0)} /{" "}
                    {formatNumber(repetition.right.timeIn5Pct, 0)} %
                  </td>
                  <td>
                    {formatNumber(repetition.left.timeTo95Seconds, 2)} /{" "}
                    {formatNumber(repetition.right.timeTo95Seconds, 2)} s
                  </td>
                  <td>
                    {repetition.flags.length > 0
                      ? repetition.flags.join("; ")
                      : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <footer className={styles.methodNote}>
        Výpočet je pracovní analytická verze: 100ms vyhlazení, detekce nad 35 %
        pracovního rozsahu a stabilní část 25–85 % kontrakce. Prahy nejsou
        klinicky validované cut-off hodnoty.
      </footer>
    </article>
  );
}

export default function TindeqAnalyzer() {
  const [state, setState] = useState<LoadState>("idle");
  const [sessions, setSessions] = useState<TindeqSession[]>([]);
  const [errors, setErrors] = useState<Array<{ file: string; error: string }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    sessions.find((session) => session.id === selectedId) ?? sessions[0] ?? null;

  async function handleFile(file: File | null) {
    if (!file) return;
    setState("loading");
    setMessage(null);
    setSessions([]);
    setErrors([]);
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
      setMessage(
        error instanceof Error ? error.message : "Soubor se nepodařilo zpracovat.",
      );
      setState("error");
    }
  }

  return (
    <div className={styles.analyzer}>
      <section className={styles.uploadCard}>
        <label className={styles.uploadLabel}>
          <input
            accept=".zip,application/zip,application/x-zip-compressed"
            disabled={state === "loading"}
            onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
            type="file"
          />
          <span className={styles.uploadIcon}>＋</span>
          <strong>
            {state === "loading" ? "Analyzuji soubor…" : "Nahrát Tindeq ZIP"}
          </strong>
          <small>Jednotlivý export nebo ZIP s více exporty</small>
        </label>
        <p className={styles.privacyNote}>
          Data zůstávají v zařízení a po obnovení stránky se smažou.
        </p>
      </section>

      {state === "error" && <div className={styles.errorBox}>{message}</div>}

      {sessions.length > 1 && (
        <nav className={styles.sessionTabs} aria-label="Importovaná měření">
          {sessions.map((session) => (
            <button
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

      {selected && <SessionResult session={selected} />}
    </div>
  );
}
