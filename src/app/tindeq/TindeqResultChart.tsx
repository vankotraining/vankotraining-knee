import type { RepetitionResult } from "@/lib/tindeq-browser";
import type { ResultViewMode } from "@/lib/tindeq-client-view";
import styles from "./tindeq.module.css";

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

export default function TindeqResultChart({
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
