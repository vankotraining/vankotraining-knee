import type { Metadata } from "next";
import Link from "next/link";
import styles from "../tindeq.module.css";
import TindeqReports from "./TindeqReports";

export const metadata: Metadata = {
  title: "Tindeq reporty | Knee Data",
  description: "Pravidlové reporty nad uloženými normalizovanými Tindeq výsledky.",
};

export default function TindeqReportsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>knee.vankotraining.cz</p>
          <h1>Tindeq reporty</h1>
          <p className={styles.intro}>
            Vyhodnocení cíle, stability, únavy, rozdílu stran a transparentní doporučení pro další trénink.
          </p>
        </div>
        <nav aria-label="Navigace Tindeq">
          <Link className={styles.backLink} href="/tindeq/reports/demo">Ukázkový report</Link>{" "}
          <Link className={styles.backLink} href="/tindeq">Import a historie</Link>{" "}
          <Link className={styles.backLink} href="/">Zpět na klienty</Link>
        </nav>
      </header>
      <TindeqReports />
    </main>
  );
}
