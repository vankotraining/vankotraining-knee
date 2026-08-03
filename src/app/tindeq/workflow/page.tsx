import type { Metadata } from "next";
import Link from "next/link";
import TindeqEnvironmentGuard from "../TindeqEnvironmentGuard";
import styles from "../tindeq.module.css";
import TindeqClientWorkflow from "./TindeqClientWorkflow";

export const metadata: Metadata = {
  title: "Klientské Tindeq workflow | Knee Data",
  description:
    "Klient, maximální extenze kolene, předpis procenta maxima a potvrzený import Tindeq cvičení.",
};

export default function TindeqWorkflowPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>knee.vankotraining.cz</p>
          <h1>Klientské Tindeq workflow</h1>
          <p className={styles.intro}>
            Od antropometrie a ručně zapsaného maxima přes předpis intenzity až po
            potvrzený import normalizovaného výsledku. Živé Bluetooth měření není
            součástí tohoto workflow.
          </p>
        </div>
        <nav aria-label="Navigace Tindeq workflow">
          <Link className={styles.backLink} href="/tindeq">
            Obecná analýza
          </Link>{" "}
          <Link className={styles.backLink} href="/">
            Zpět na klienty
          </Link>
        </nav>
      </header>
      <TindeqEnvironmentGuard>
        <TindeqClientWorkflow />
      </TindeqEnvironmentGuard>
    </main>
  );
}
