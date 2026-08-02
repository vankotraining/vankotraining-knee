import type { Metadata } from "next";
import Link from "next/link";
import { buildTindeqDemoReport } from "@/lib/tindeq-report-demo";
import TindeqReportView from "../../TindeqReportView";
import styles from "../../tindeq.module.css";

export const metadata: Metadata = {
  title: "Ukázkový Tindeq report | Knee Data",
  description: "Anonymní demonstrační Tindeq report bez přihlášení a bez databázových dat.",
};

export default function TindeqDemoReportPage() {
  const report = buildTindeqDemoReport();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>knee.vankotraining.cz</p>
          <h1>Ukázkový Tindeq report</h1>
          <p className={styles.intro}>
            Kompletní report nad anonymními demonstračními daty. Stránka nevyžaduje přihlášení a nečte Supabase.
          </p>
        </div>
        <nav aria-label="Navigace Tindeq">
          <Link className={styles.backLink} href="/tindeq/reports">Zpět na reporty</Link>{" "}
          <Link className={styles.backLink} href="/tindeq">Import a historie</Link>
        </nav>
      </header>

      <section className={styles.authCard} aria-labelledby="demo-report-notice">
        <p className={styles.eyebrow}>Ukázkový režim</p>
        <h2 id="demo-report-notice">Anonymní a smyšlená data</h2>
        <p>
          Výsledek slouží pouze k prohlédnutí struktury, metrik a rozhodovací logiky reportu. Není spojený se skutečným klientem a nic se neukládá.
        </p>
      </section>

      <TindeqReportView report={report} />
    </main>
  );
}
