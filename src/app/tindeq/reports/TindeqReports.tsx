"use client";

import { useEffect, useMemo, useState } from "react";
import { loadTindeqHistory, type StoredTindeqSession } from "@/lib/tindeq-persistence";
import {
  buildTindeqReportFromStoredSession,
  type TindeqReportClinicalContext,
} from "@/lib/tindeq-report";
import { useSupabaseSession } from "@/lib/use-supabase-session";
import TindeqReportView from "../TindeqReportView";
import styles from "../tindeq.module.css";

type Athlete = {
  id: string;
  display_name: string;
  name_key: string | null;
  note: string | null;
};

type LoadState = "idle" | "loading" | "ready" | "error";

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value || "–";
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("cs-CZ")
    .trim();
}

function optionalNumber(value: string, minimum: number, maximum: number) {
  if (value.trim() === "") return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : null;
}

export default function TindeqReports() {
  const { supabase, session, state: authState, error: authError } = useSupabaseSession();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athletesState, setAthletesState] = useState<LoadState>("idle");
  const [athletesError, setAthletesError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [history, setHistory] = useState<StoredTindeqSession[]>([]);
  const [historyState, setHistoryState] = useState<LoadState>("idle");
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [contexts, setContexts] = useState<Record<string, TindeqReportClinicalContext>>({});

  useEffect(() => {
    if (!supabase || !session) return;
    let active = true;
    setAthletesState("loading");
    setAthletesError(null);
    supabase
      .from("athletes")
      .select("id,display_name,name_key,note")
      .order("display_name")
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setAthletesState("error");
          setAthletesError(error.message);
          return;
        }
        const records = (data ?? []) as Athlete[];
        setAthletes(records);
        setSelectedAthleteId((current) =>
          current && records.some((athlete) => athlete.id === current)
            ? current
            : records[0]?.id ?? null,
        );
        setAthletesState("ready");
      });
    return () => {
      active = false;
    };
  }, [session, supabase]);

  useEffect(() => {
    if (!supabase || !session || !selectedAthleteId) return;
    let active = true;
    setHistoryState("loading");
    setHistoryError(null);
    loadTindeqHistory(supabase, selectedAthleteId)
      .then((records) => {
        if (!active) return;
        setHistory(records);
        setSelectedSessionId(records[0]?.id ?? null);
        setHistoryState("ready");
      })
      .catch((error) => {
        if (!active) return;
        setHistory([]);
        setSelectedSessionId(null);
        setHistoryState("error");
        setHistoryError(error instanceof Error ? error.message : "Historii se nepodařilo načíst.");
      });
    return () => {
      active = false;
    };
  }, [selectedAthleteId, session, supabase]);

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
  const selectedSession = useMemo(
    () => history.find((record) => record.id === selectedSessionId) ?? history[0] ?? null,
    [history, selectedSessionId],
  );
  const context = selectedSession ? contexts[selectedSession.id] ?? {} : {};
  const report = selectedSession
    ? buildTindeqReportFromStoredSession(selectedSession, {
        athleteName: selectedAthlete?.display_name ?? null,
        clinicalContext: context,
      })
    : null;

  function updateContext(key: keyof TindeqReportClinicalContext, value: number | null) {
    if (!selectedSession) return;
    setContexts((current) => ({
      ...current,
      [selectedSession.id]: {
        ...current[selectedSession.id],
        [key]: value,
      },
    }));
  }

  if (authState === "loading") {
    return <div className={styles.authState} role="status">Ověřuji přihlášení…</div>;
  }
  if (authState === "unconfigured") {
    return <div className={styles.errorBox}>Chybí Supabase konfigurace.</div>;
  }
  if (authState === "error") {
    return <div className={styles.errorBox}>{authError || "Přihlášení se nepodařilo ověřit."}</div>;
  }
  if (authState === "signed-out") {
    return (
      <section className={styles.authCard}>
        <p className={styles.eyebrow}>Chráněný přístup</p>
        <h2>Pro reporty je nutné přihlášení</h2>
        <p>Přihlas se v hlavním Tindeq modulu. Tato stránka neposílá nový magic link.</p>
      </section>
    );
  }

  return (
    <div className={styles.workspace}>
      <section className={styles.athletePicker} aria-labelledby="report-athlete-title">
        <div className={styles.pickerHeading}>
          <div>
            <p className={styles.eyebrow}>1. Klient</p>
            <h2 id="report-athlete-title">Vyber klienta pro report</h2>
          </div>
        </div>
        <label className={styles.athleteSearch}>
          Hledat podle jména
          <input
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Začni psát jméno klienta"
            type="search"
            value={query}
          />
        </label>
        {athletesState === "loading" ? <p role="status">Načítám klienty…</p> : null}
        {athletesState === "error" ? <div className={styles.errorBox}>{athletesError}</div> : null}
        {athletesState === "ready" && athletes.length === 0 ? <p>V databázi není aktivní klient.</p> : null}
        {athletesState === "ready" && athletes.length > 0 ? (
          <div className={styles.athletePickerGrid}>
            <div className={styles.athleteList} role="listbox" aria-label="Aktivní klienti">
              {filteredAthletes.map((athlete) => (
                <button
                  aria-selected={athlete.id === selectedAthleteId}
                  className={athlete.id === selectedAthleteId ? styles.selectedAthleteButton : ""}
                  key={athlete.id}
                  onClick={() => setSelectedAthleteId(athlete.id)}
                  role="option"
                  type="button"
                >
                  {athlete.display_name}
                </button>
              ))}
            </div>
            <div className={styles.selectedAthleteCard}>
              <span>Aktuálně vybraný klient</span>
              <strong>{selectedAthlete?.display_name || "Nikdo"}</strong>
            </div>
          </div>
        ) : null}
      </section>

      <section className={styles.historySection} aria-labelledby="report-history-title">
        <div className={styles.sectionTitleBlock}>
          <p className={styles.eyebrow}>2. Měření</p>
          <h2 id="report-history-title">Vyber uložené Tindeq měření</h2>
          <p>Report vzniká z již uloženého normalizovaného výsledku; původní ZIP ani časová řada se nenačítají.</p>
        </div>
        {historyState === "loading" ? <p role="status">Načítám historii…</p> : null}
        {historyState === "error" ? <div className={styles.errorBox}>{historyError}</div> : null}
        {historyState === "ready" && history.length === 0 ? (
          <div className={styles.emptyHistory}>Pro klienta zatím není uložené Tindeq měření.</div>
        ) : null}
        {history.length > 0 ? (
          <div className={styles.historyList} role="listbox" aria-label="Uložená měření">
            {history.map((record) => (
              <button
                aria-selected={record.id === selectedSession?.id}
                className={record.id === selectedSession?.id ? styles.selectedAthleteButton : styles.historyDetailButton}
                key={record.id}
                onClick={() => setSelectedSessionId(record.id)}
                role="option"
                type="button"
              >
                <strong>{record.source_tag || record.protocol_name || "Tindeq měření"}</strong>{" "}
                <span>{formatDate(record.measured_at)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {selectedSession ? (
        <section className={styles.analysisSection} aria-labelledby="report-context-title">
          <div className={styles.sectionTitleBlock}>
            <p className={styles.eyebrow}>3. Volitelný klinický kontext</p>
            <h2 id="report-context-title">Doplň úhel a bolest</h2>
            <p>Údaje se použijí jen pro aktuální výpočet reportu a v této verzi se neukládají do databáze.</p>
          </div>
          <div className={styles.protocolCard}>
            <label className={styles.athleteSearch}>
              Úhel kolene (°)
              <input
                inputMode="decimal"
                max="180"
                min="0"
                onChange={(event) => updateContext("kneeAngleDegrees", optionalNumber(event.target.value, 0, 180))}
                placeholder="např. 60"
                type="number"
                value={context.kneeAngleDegrees ?? ""}
              />
            </label>
            <label className={styles.athleteSearch}>
              Bolest před (0–10)
              <input
                inputMode="decimal"
                max="10"
                min="0"
                onChange={(event) => updateContext("painBefore", optionalNumber(event.target.value, 0, 10))}
                type="number"
                value={context.painBefore ?? ""}
              />
            </label>
            <label className={styles.athleteSearch}>
              Bolest během (0–10)
              <input
                inputMode="decimal"
                max="10"
                min="0"
                onChange={(event) => updateContext("painDuring", optionalNumber(event.target.value, 0, 10))}
                type="number"
                value={context.painDuring ?? ""}
              />
            </label>
            <label className={styles.athleteSearch}>
              Bolest po (0–10)
              <input
                inputMode="decimal"
                max="10"
                min="0"
                onChange={(event) => updateContext("painAfter", optionalNumber(event.target.value, 0, 10))}
                type="number"
                value={context.painAfter ?? ""}
              />
            </label>
          </div>
        </section>
      ) : null}

      {report ? <TindeqReportView report={report} /> : null}
    </div>
  );
}
