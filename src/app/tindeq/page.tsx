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
    border: 1px solid #dfe4d8;
    border-radius: 8px;
    background-color: #fbfcfa;
    background-image:
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 720 260'%3E%3Cg font-family='Arial,sans-serif' font-size='10' font-weight='700' letter-spacing='1'%3E%3Ctext x='700' y='24' text-anchor='end' fill='%239b2c2c'%3ENAD CÍLEM %26gt%3B 105 %25%3C/text%3E%3Ctext x='700' y='106' text-anchor='end' fill='%2323604a'%3ECÍLOVÉ PÁSMO%3C/text%3E%3Ctext x='700' y='238' text-anchor='end' fill='%23a75b12'%3EPOD CÍLEM %26lt%3B 95 %25%3C/text%3E%3Ctext x='90' y='253' text-anchor='middle' fill='%23687063' font-size='9'%3ENÁBĚH%3C/text%3E%3Ctext x='396' y='253' text-anchor='middle' fill='%234d554a' font-size='9'%3ESTABILNÍ ČÁST%3C/text%3E%3Ctext x='666' y='253' text-anchor='middle' fill='%23687063' font-size='9'%3EZÁVĚR%3C/text%3E%3Cline x1='180' x2='180' y1='0' y2='260' stroke='%2396a091' stroke-opacity='.55' stroke-dasharray='4 5'/%3E%3Cline x1='612' x2='612' y1='0' y2='260' stroke='%2396a091' stroke-opacity='.55' stroke-dasharray='4 5'/%3E%3C/g%3E%3C/svg%3E"),
      linear-gradient(
        to right,
        rgba(45, 108, 223, 0.035) 0%,
        rgba(45, 108, 223, 0.035) 25%,
        transparent 25%,
        transparent 85%,
        rgba(167, 91, 18, 0.04) 85%,
        rgba(167, 91, 18, 0.04) 100%
      ),
      linear-gradient(
        to bottom,
        rgba(155, 44, 44, 0.055) 0%,
        rgba(155, 44, 44, 0.055) 30%,
        rgba(35, 96, 74, 0.09) 30%,
        rgba(35, 96, 74, 0.09) 50%,
        rgba(167, 91, 18, 0.045) 50%,
        rgba(167, 91, 18, 0.045) 100%
      );
    background-repeat: no-repeat;
    background-size: 100% 100%;
  }

  svg[aria-label="Normalizované průběhy opakování"] [class*="targetBand"] {
    fill: rgba(35, 96, 74, 0.12) !important;
  }

  svg[aria-label="Normalizované průběhy opakování"] [class*="gridLine"] {
    stroke: rgba(104, 112, 99, 0.24) !important;
  }

  svg[aria-label="Normalizované průběhy opakování"] [class*="targetLine"] {
    stroke: #161a15 !important;
    stroke-width: 2.2 !important;
    stroke-dasharray: none !important;
  }

  svg[aria-label="Normalizované průběhy opakování"] [class*="axisText"] {
    fill: #687063 !important;
    font-size: 11px !important;
    font-weight: 700;
    paint-order: stroke;
    stroke: #fbfcfa;
    stroke-width: 3px;
    stroke-linejoin: round;
  }

  svg[aria-label="Normalizované průběhy opakování"] path {
    opacity: 0.24;
    vector-effect: non-scaling-stroke;
  }

  svg[aria-label="Normalizované průběhy opakování"] path:nth-last-of-type(2),
  svg[aria-label="Normalizované průběhy opakování"] path:last-of-type {
    opacity: 1;
    stroke-width: 3.6 !important;
    filter: drop-shadow(0 1px 1px rgba(255, 255, 255, 0.9));
  }

  @media (max-width: 720px) {
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
          <p className={styles.eyebrow}>knee.vankotraining.cz</p>
          <h1>Tindeq Repeaters</h1>
          <p className={styles.intro}>
            Nahraj původní ZIP z Tindeq. Výpočet proběhne přímo v prohlížeči a
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
