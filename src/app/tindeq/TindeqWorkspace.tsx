"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { TindeqSession } from "@/lib/tindeq-browser";
import {
  loadTindeqHistory,
  saveTindeqSessions,
  type SaveTindeqSessionResult,
  type StoredTindeqSession,
} from "@/lib/tindeq-persistence";
import { useSupabaseSession } from "@/lib/use-supabase-session";
import TindeqAnalyzer from "./TindeqAnalyzer";
import styles from "./tindeq.module.css";

type Athlete = {
  id: string;
  display_name: string;
  name_key: string | null;
  note: string | null;
};

type LoadState = "idle" | "loading" | "ready" | "error";

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("cs-CZ")
    .trim();
}

function formatDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value || "–"
    : new Intl.DateTimeFormat("cs-CZ", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

function HistoryCard({ session }: { session: StoredTindeqSession }) {
  return (
    <article className={styles.historyCard}>
      <div className={styles.historyCardHeader}>
        <div>
          <p className={styles.historyLabel}>Uloženo v historii</p>
          <h3>{session.source_tag || session.protocol_name || "Tindeq měření"}</h3>
          <p>{formatDate(session.measured_at)}</p>
        </div>
      </div>
      <dl className={styles.historySummaryGrid}>
        <div><dt>Protokol</dt><dd>{session.protocol_name || "–"}</dd></div>
        <div><dt>Opakování</dt><dd>{session.detected_repetitions}/{session.expected_repetitions}</dd></div>
        <div><dt>Kontrola</dt><dd>{session.overall_summary.domains.control}</dd></div>
        <div><dt>Udržení</dt><dd>{session.overall_summary.domains.maintenance}</dd></div>
        <div><dt>Analýza</dt><dd>{session.analysis_version}</dd></div>
      </dl>
    </article>
  );
}

export default function TindeqWorkspace() {
  const { supabase, session, state: authState, error: authError } = useSupabaseSession();
  const [email, setEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athletesState, setAthletesState] = useState<LoadState>("idle");
  const [athletesError, setAthletesError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [history, setHistory] = useState<StoredTindeqSession[]>([]);
  const [historyState, setHistoryState] = useState<LoadState>("idle");
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    if (!supabase || !session) return;
    let active = true;
    void (async () => {
      await Promise.resolve();
      if (!active) return;
      setAthletesState("loading");
      setAthletesError(null);
      const { data, error } = await supabase
        .from("athletes")
        .select("id,display_name,name_key,note")
        .order("display_name");
      if (!active) return;
      if (error) {
        setAthletesState("error");
        setAthletesError(error.message);
        return;
      }
      const records = (data ?? []) as Athlete[];
      setAthletes(records);
      setSelectedAthleteId((current) =>
        current && records.some((athlete) => athlete.id === current) ? current : null,
      );
      setAthletesState("ready");
    })();
    return () => { active = false; };
  }, [session, supabase]);

  const filteredAthletes = useMemo(() => {
    const normalized = normalizeSearch(query);
    if (!normalized) return athletes;
    return athletes.filter((athlete) =>
      [athlete.display_name, athlete.name_key, athlete.note]
        .filter((value): value is string => Boolean(value))
        .some((value) => normalizeSearch(value).includes(normalized)),
    );
  }, [athletes, query]);

  const selectedAthlete = useMemo(
    () => athletes.find((athlete) => athlete.id === selectedAthleteId) ?? null,
    [athletes, selectedAthleteId],
  );

  useEffect(() => {
    if (!supabase || !session || !selectedAthleteId) {
      setHistory([]);
      setHistoryState("idle");
      setHistoryError(null);
      return;
    }
    let active = true;
    void (async () => {
      await Promise.resolve();
      if (!active) return;
      setHistoryState("loading");
      setHistoryError(null);
      try {
        const records = await loadTindeqHistory(supabase, selectedAthleteId);
        if (!active) return;
        setHistory(records);
        setHistoryState("ready");
      } catch (error) {
        if (!active) return;
        setHistory([]);
        setHistoryState("error");
        setHistoryError(error instanceof Error ? error.message : "Historii se nepodařilo načíst.");
      }
    })();
    return () => { active = false; };
  }, [historyVersion, selectedAthleteId, session, supabase]);

  async function handleMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !email.trim()) return;
    setAuthMessage("Posílám přihlašovací odkaz…");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: new URL("/tindeq", window.location.origin).toString(),
      },
    });
    setAuthMessage(error ? error.message : "Hotovo. Zkontroluj e-mail a klikni na přihlašovací odkaz.");
  }

  async function handleSave(sessionsToSave: TindeqSession[]): Promise<SaveTindeqSessionResult[]> {
    if (!supabase || !selectedAthlete) {
      return sessionsToSave.map((item) => ({
        ok: false as const,
        sourceSessionId: item.id,
        sourceTag: item.metadata.tag,
        error: "Před uložením explicitně vyber klienta.",
      }));
    }
    const results = await saveTindeqSessions(supabase, sessionsToSave, selectedAthlete.id);
    if (results.some((result) => result.ok)) setHistoryVersion((current) => current + 1);
    return results;
  }

  if (authState === "loading") return <div className={styles.authState} role="status">Ověřuji přihlášení…</div>;
  if (authState === "unconfigured") return <div className={styles.errorBox}>Chybí Supabase konfigurace.</div>;
  if (authState === "error") return <div className={styles.errorBox}>{authError || "Přihlášení se nepodařilo ověřit."}</div>;
  if (authState === "signed-out") {
    return (
      <section className={styles.authCard} aria-labelledby="tindeq-login-title">
        <p className={styles.eyebrow}>Chráněný přístup</p>
        <h2 id="tindeq-login-title">Přihlášení do Knee Data</h2>
        <p>Magic link se vrátí na stejnou Knee doménu a trasu /tindeq.</p>
        <form className={styles.authForm} onSubmit={handleMagicLink}>
          <label>E-mail<input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label>
          <button type="submit">Poslat přihlašovací odkaz</button>
        </form>
        <p aria-live="polite" className={styles.authMessage}>{authMessage}</p>
      </section>
    );
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.analysisSection} aria-labelledby="new-analysis-title">
        <div className={styles.sectionTitleBlock}>
          <p className={styles.eyebrow}>1. ZIP import, analýza a kontrola</p>
          <h2 id="new-analysis-title">Nově analyzováno</h2>
          <p>Podporovaný vstup je pouze ZIP exportovaný z Tindeq. Analýza probíhá lokálně; původní ZIP ani nezpracovaná časová řada se neukládají.</p>
        </div>
        <TindeqAnalyzer
          onSaveSessions={handleSave}
          selectedAthlete={selectedAthlete ? { id: selectedAthlete.id, displayName: selectedAthlete.display_name } : null}
        />
      </section>

      <section className={styles.athletePicker} aria-labelledby="athlete-picker-title">
        <div className={styles.pickerHeading}>
          <div>
            <p className={styles.eyebrow}>2. Explicitní přiřazení klienta</p>
            <h2 id="athlete-picker-title">Vyber klienta z databáze</h2>
          </div>
          <button className={styles.signOutButton} onClick={() => supabase?.auth.signOut()} type="button">Odhlásit</button>
        </div>
        <p>Klient se nikdy neurčuje podle názvu souboru ani tagu. Bez ručního výběru zůstává uložení zablokované.</p>
        <label className={styles.athleteSearch}>Hledat podle jména<input onChange={(event) => setQuery(event.target.value)} placeholder="Začni psát jméno klienta" type="search" value={query} /></label>
        {athletesState === "loading" ? <p role="status">Načítám klienty…</p> : null}
        {athletesState === "error" ? <div className={styles.errorBox}>{athletesError}</div> : null}
        {athletesState === "ready" && athletes.length === 0 ? <p>V databázi není žádný aktivní klient.</p> : null}
        {athletesState === "ready" && athletes.length > 0 ? (
          <div className={styles.athletePickerGrid}>
            <div className={styles.athleteList} role="listbox" aria-label="Aktivní klienti">
              {filteredAthletes.length > 0 ? filteredAthletes.map((athlete) => (
                <button
                  aria-selected={athlete.id === selectedAthleteId}
                  className={athlete.id === selectedAthleteId ? styles.selectedAthleteButton : ""}
                  key={athlete.id}
                  onClick={() => setSelectedAthleteId(athlete.id)}
                  role="option"
                  type="button"
                >{athlete.display_name}</button>
              )) : <p>Žádný klient neodpovídá hledání.</p>}
            </div>
            <div className={styles.selectedAthleteCard} aria-live="polite">
              <span>Potvrzený klient pro uložení</span>
              <strong>{selectedAthlete?.display_name || "Nikdo"}</strong>
              <small>Výběr je vždy ruční a lze jej před uložením změnit.</small>
            </div>
          </div>
        ) : null}
      </section>

      <section className={styles.historySection} aria-labelledby="history-title">
        <div className={styles.sectionTitleBlock}>
          <p className={styles.eyebrow}>3. Historie a report</p>
          <h2 id="history-title">Uložená Tindeq měření</h2>
          <p>{selectedAthlete ? `Klient: ${selectedAthlete.display_name}` : "Nejprve ručně vyber klienta."}</p>
          <p><Link href="/tindeq/reports">Otevřít kanonické reporty</Link></p>
        </div>
        {historyState === "loading" ? <p role="status">Načítám historii…</p> : null}
        {historyState === "error" ? <div className={styles.errorBox}>{historyError}</div> : null}
        {historyState === "ready" && history.length === 0 ? <div className={styles.emptyHistory}>Pro vybraného klienta zatím není uloženo žádné Tindeq měření.</div> : null}
        {history.length > 0 ? <div className={styles.historyList}>{history.map((record) => <HistoryCard key={record.id} session={record} />)}</div> : null}
      </section>
    </div>
  );
}
