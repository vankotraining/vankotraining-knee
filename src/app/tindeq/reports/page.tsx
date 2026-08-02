import type { Metadata } from "next";
import Link from "next/link";
import styles from "../tindeq.module.css";
import TindeqReports from "./TindeqReports";

export const metadata: Metadata = {
  title: "Tindeq reporty | Knee Data",
  description: "Pravidlove reporty nad ulozenymi normalizovanymi Tindeq vysledky.",
};

export default function TindeqReportsPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>knee.vankotraining.cz</p>
          <h1>Tindeq reporty</h1>
          <p className={styles.intro}>
            Vyhodnoceni cile, stability, unavy, rozdilu stran a transparentni doporuceni pro dalsi trenink.
          </p>
        </div>
        <nav aria-label="Navigace Tindeq">
          <Link className={styles.backLink} href="/tindeq">Import a historie</Link>{" "}
          <Link className={styles.backLink} href="/">Zpet na klienty</Link>
        </nav>
      </header>
      <TindeqReports />
    </main>
  );
}
