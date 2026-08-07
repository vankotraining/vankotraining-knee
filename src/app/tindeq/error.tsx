"use client";

import Link from "next/link";
import styles from "./tindeq.module.css";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className={styles.page}>
      <div className={styles.analyzer}>
        <div className={styles.errorBox}>
          <strong>Tindeq modul se nepodařilo načíst.</strong>
          <p>Zkus stránku načíst znovu. Nahraný soubor se na server neodeslal.</p>
          <button onClick={reset} type="button">Zkusit znovu</button>{" "}
          <Link href="/">Zpět na klienty</Link>
        </div>
      </div>
    </main>
  );
}
