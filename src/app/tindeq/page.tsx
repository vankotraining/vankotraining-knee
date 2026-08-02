import type { Metadata } from "next";
import Link from "next/link";
import TindeqAnalyzer from "./TindeqAnalyzer";
import styles from "./tindeq.module.css";

export const metadata: Metadata = {
  title: "Tindeq Repeaters | Knee Data",
  description: "Lokální analýza Tindeq Repeaters exportů.",
};

const chartReadabilityStyles = `
  svg[aria-label="Normalizované průběhy opakování"] {
    min-width: 720px;
    border: 1px solid rgba(143, 163, 155, 0.2);
    border-radius: 14px;
    background-image:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 260'%3E%3Cg font-family='Arial,sans-serif' font-size='10' font-weight='700' letter-spacing='1'%3E%3Ctext x='700' y='24' text-anchor='end' fill='%23ffaaa0'%3ENAD CÍLEM %26gt%3B 105 %25%3C/text%3E%3Ctext x='700' y='106' text-anchor='end' fill='%2399e8c8'%3ECÍLOVÉ PÁSMO%3C/text%3E%3Ctext x='700' y='238' text-anchor='end' fill='%23e8c979'%3EPOD CÍLEM %26lt%3B 95 %25%3C/text%3E%3Ctext x='90' y='253' text-anchor='middle' fill='%238ba19a' font-size='9'%3ENÁBĚH%3C/text%3E%3Ctext x='396' y='253' text-anchor='middle' fill='%23a9bbb4' font-size='9'%3ESTABILNÍ ČÁST%3C/text%3E%3Ctext x='666' y='253' text-anchor='middle' fill='%238ba19a' font-size='9'%3EZÁVĚR%3C/text%3E%3Cline x1='180' x2='180' y1='0' y2='260' stroke='%2356756a' stroke-opacity='.45' stroke-dasharray='4 5'/%3E%3Cline x1='612' x2='612' y1='0' y2='260' stroke='%2356756a' stroke-opacity='.45' stroke-dasharray='4 5'/%3E%3C/g%3E%3C/svg%3E"),
      linear-gradient(
        to right,
        rgba(96, 165, 250, 0.035) 0%,
        rgba(96, 165, 250, 0.035) 25%,
        transparent 25%,
        transparent 85%,
        rgba(244, 202, 114, 0.035) 85%,
        rgba(244, 202, 114, 0.035) 100%
      ),
      linear-gradient(
        to bottom,
        rgba(255, 105, 95, 0.1) 0%,
        rgba(255, 105, 95, 0.1) 30%,
        rgba(105, 216, 173, 0.15) 30%,
        rgba(105, 216, 173, 0.15) 50%,
        rgba(244, 202, 114, 0.075) 50%,
        rgba(244, 202, 114, 0.075) 100%
      );
    background-repeat: no-repeat;
    background-size: 100% 100%;
  }

  svg[aria-label="Normalizované průběhy opakování"] [class*="targetBand"] {
    fill: rgba(105, 216, 173, 0.18) !important;
  }

  svg[aria-label="Normalizované průběhy opakování"] [class*="gridLine"] {
    stroke: rgba(134, 158, 149, 0.28) !important;
  }

  svg[aria-label="Normalizované průběhy opakování"] [class*="targetLine"] {
    stroke: rgba(238, 248, 244, 0.9) !important;
    stroke-width: 2.4 !important;
    stroke-dasharray: none !important;
  }

  svg[aria-label="Normalizované průběhy opakování"] [class*="axisText"] {
    fill: #c0d0ca !important;
    font-size: 11px !important;
    font-weight: 700;
    paint-order: stroke;
    stroke: #08130f;
    stroke-width: 3px;
    stroke-linejoin: round;
  }

  svg[aria-label="Normalizované průběhy opakování"] path {
    opacity: 0.42;
    vector-effect: non-scaling-stroke;
  }

  svg[aria-label="Normalizované průběhy opakování"] path:nth-last-of-type(2),
  svg[aria-label="Normalizované průběhy opakování"] path:last-of-type {
    opacity: 1;
    stroke-width: 4 !important;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.75));
  }

  @media (max-width: 820px) {
    svg[aria-label="Normalizované průběhy opakování"] {
      min-width: 760px;
    }
  }
`;

export default function TindeqPage() {
  return (
    <main className={styles.page}>
      <style>{chartReadabilityStyles}</style>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Knee Data</p>
          <h1>Tindeq Repeaters</h1>
          <p className={styles.intro}>
            Nahraj původní ZIP z Tindeq. Výpočet proběhne přímo v tomto prohlížeči;
            soubor se v této verzi nikam neukládá.
          </p>
        </div>
        <Link className={styles.backLink} href="/">
          Zpět na klienty
        </Link>
      </header>
      <TindeqAnalyzer />
    </main>
  );
}
