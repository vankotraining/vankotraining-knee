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
            Vyber klienta, analyzuj původní Tindeq ZIP lokálně v prohlížeči a až
            poté výslovně potvrď uložení strukturovaného výsledku.
          </p>
        </div>
        <Link className={styles.backLink} href="/">
          Zpět na klienty
        </Link>
      </header>
      <TindeqEnvironmentGuard>
        <TindeqWorkspace />
      </TindeqEnvironmentGuard>
    </main>
  );
}
