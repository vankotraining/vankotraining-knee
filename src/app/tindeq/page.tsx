import type { Metadata } from "next";
import Link from "next/link";
import TindeqAnalyzer from "./TindeqAnalyzer";
import styles from "./tindeq.module.css";

export const metadata: Metadata = {
  title: "Tindeq Repeaters | Knee Data",
  description: "Lokální analýza Tindeq Repeaters exportů.",
};

export default function TindeqPage() {
  return (
    <main className={styles.page}>
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
