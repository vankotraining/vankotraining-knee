import styles from "./tindeq.module.css";

export default function Loading() {
  return (
    <main className={styles.page}>
      <div className={styles.analyzer}>Načítám Tindeq modul…</div>
    </main>
  );
}
