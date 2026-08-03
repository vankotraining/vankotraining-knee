import type { Metadata } from "next";
import Link from "next/link";
import TindeqEnvironmentGuard from "./TindeqEnvironmentGuard";
import TindeqWorkspace from "./TindeqWorkspace";
import styles from "./tindeq.module.css";

export const metadata: Metadata = {
  title: "Tindeq Repeaters | Knee Data",
  description: "Lokální analýza Tindeq Repeaters exportů propojená s historií klienta.",
};

export default function TindeqPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>knee.vankotraining.cz</p>
          <h1>Tindeq Repeaters</h1>
          <p className={styles.intro}>
            Obecný analyzátor Tindeq ZIP. Pro běžné přidání výsledku vyber klienta
            na hlavní Knee stránce a použij akci Přidat Tindeq záznam.
          </p>
        </div>
        <nav aria-label="Navigace Tindeq">
          <Link className={styles.backLink} href="/tindeq/reports">
            Otevřít reporty
          </Link>{" "}
          <Link className={styles.backLink} href="/">
            Zpět na klienty
          </Link>
        </nav>
      </header>
      <TindeqEnvironmentGuard>
        <TindeqWorkspace />
      </TindeqEnvironmentGuard>
    </main>
  );
}
