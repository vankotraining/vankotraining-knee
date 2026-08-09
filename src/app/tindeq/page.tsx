import type { Metadata } from "next";
import Link from "next/link";
import TindeqEnvironmentGuard from "./TindeqEnvironmentGuard";
import TindeqWorkspace from "./TindeqWorkspace";
import navStyles from "./tindeq-nav.module.css";
import styles from "./tindeq.module.css";

export const metadata: Metadata = {
  title: "Tindeq Repeaters | Knee Data",
  description: "Lokální analýza Tindeq Repeaters exportů propojená s historií klienta.",
};

export default function TindeqPage() {
  return (
    <main className={styles.page}>
      <header className={`${styles.header} ${navStyles.mobileHeader}`}>
        <div>
          <p className={styles.eyebrow}>knee.vankotraining.cz</p>
          <h1>Tindeq Repeaters</h1>
          <p className={styles.intro}>
            Vyber klienta, analyzuj původní Tindeq ZIP lokálně v prohlížeči a až
            poté výslovně potvrď uložení strukturovaného výsledku.
          </p>
        </div>
        <nav className={navStyles.nav} aria-label="Navigace Tindeq">
          <Link className={`${styles.backLink} ${navStyles.link}`} href="/tindeq/reports">
            Otevřít reporty
          </Link>
          <Link className={`${styles.backLink} ${navStyles.link}`} href="/">
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
