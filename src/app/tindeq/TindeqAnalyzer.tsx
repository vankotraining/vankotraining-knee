"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { importTindeqArchive, type TindeqSession } from "@/lib/tindeq-browser";
import { attachTindeqNativeShareReceiver } from "@/lib/tindeq-native-share-client";
import type { SaveTindeqSessionResult } from "@/lib/tindeq-persistence";
import TindeqSessionResult from "./TindeqSessionResult";
import { formatTindeqDate } from "./tindeq-presentation";
import styles from "./tindeq.module.css";

type LoadState = "idle" | "loading" | "ready" | "error";
type SaveState = "idle" | "saving" | "success" | "partial" | "error";

type SelectedAthlete = {
  id: string;
  displayName: string;
};

type TindeqAnalyzerProps = {
  athletePicker: ReactNode;
  selectedAthlete: SelectedAthlete | null;
  onSaveSessions: (sessions: TindeqSession[]) => Promise<SaveTindeqSessionResult[]>;
};

function normalizeIdentity(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("cs-CZ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tagMatchesAthlete(tag: string, athleteName: string) {
  const normalizedTag = normalizeIdentity(tag);
  const normalizedAthlete = normalizeIdentity(athleteName);
  if (!normalizedTag || !normalizedAthlete) return true;
  return normalizedTag.includes(normalizedAthlete) || normalizedAthlete.includes(normalizedTag);
}

export default function TindeqAnalyzer({ athletePicker, selectedAthlete, onSaveSessions }: TindeqAnalyzerProps) {
  const [state, setState] = useState<LoadState>("idle");
  const [sessions, setSessions] = useState<TindeqSession[]>([]);
  const [errors, setErrors] = useState<Array<{ file: string; error: string }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveResults, setSaveResults] = useState<Record<string, {
    athlete: SelectedAthlete;
    result: SaveTindeqSessionResult;
  }>>({});
  const [reviewed, setReviewed] = useState<Record<string, string>>({});
  const savingRef = useRef(false);
  const [saveAthleteId, setSaveAthleteId] = useState<string | null>(null);
  const [nativeShareStatus, setNativeShareStatus] = useState<string | null>(null);
  const [nativeShareError, setNativeShareError] = useState<string | null>(null);
  const activeSaveState = saveAthleteId === selectedAthlete?.id ? saveState : "idle";
  const activeSaveResults = Object.fromEntries(
    Object.values(saveResults)
      .filter((entry) => entry.athlete.id === selectedAthlete?.id)
      .map((entry) => [entry.result.sourceSessionId, entry.result]),
  );

  const selected = sessions.find((session) => session.id === selectedId) ?? sessions[0] ?? null;

  const handleFile = useCallback(async (file: File | null): Promise<string | null> => {
    if (!file || savingRef.current) return null;
    setState("loading");
    setMessage(null);
    setNativeShareError(null);
    setSessions([]);
    setErrors([]);
    setSaveState("idle");
    setSaveResults({});
    setReviewed({});
    setSaveAthleteId(null);
    try {
      const result = await importTindeqArchive(file);
      if (result.sessions.length === 0) {
        throw new Error("V archivu nebylo možné načíst žádné měření.");
      }
      setSessions(result.sessions);
      setErrors(result.errors);
      setSelectedId(result.sessions[0].id);
      setState("ready");
      return null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Soubor se nepodařilo zpracovat.";
      setMessage(errorMessage);
      setState("error");
      return errorMessage;
    }
  }, []);

  useEffect(() => attachTindeqNativeShareReceiver({
    onFile: handleFile,
    onStatus: setNativeShareStatus,
    onError: (error) => setNativeShareError(error || null),
  }), [handleFile]);

  async function handleSave() {
    if (!selectedAthlete || savingRef.current) return;
    const sessionsToSave = sessions.filter((session) =>
      !activeSaveResults[session.id]?.ok && reviewed[session.id] === selectedAthlete.id,
    );
    if (sessionsToSave.length === 0) return;

    savingRef.current = true;
    setSaveAthleteId(selectedAthlete.id);
    setSaveState("saving");
    try {
      const results = await onSaveSessions(sessionsToSave);
      setSaveResults((current) => {
        const next = { ...current };
        results.forEach((result) => {
          if (result.sourceSessionId) next[`${selectedAthlete.id}:${result.sourceSessionId}`] = {
            athlete: selectedAthlete, result,
          };
        });
        return next;
      });
      const succeeded = results.filter((result) => result.ok).length;
      if (succeeded === results.length) setSaveState("success");
      else if (succeeded > 0) setSaveState("partial");
      else setSaveState("error");
    } catch (error) {
      setSaveState("error");
      const errorMessage = error instanceof Error ? error.message : "Uložení se nepodařilo.";
      setSaveResults((current) => ({
        ...current,
        ...Object.fromEntries(
          sessionsToSave.map((session) => [
            `${selectedAthlete.id}:${session.id}`,
            {
              athlete: selectedAthlete,
              result: {
                ok: false as const,
                sourceSessionId: session.id,
                sourceTag: session.metadata.tag,
                error: errorMessage,
              },
            },
          ]),
        ),
      }));
    } finally {
      savingRef.current = false;
    }
  }

  const savedCount = sessions.filter((session) => activeSaveResults[session.id]?.ok).length;
  const duplicateCount = sessions.filter((session) => {
    const result = activeSaveResults[session.id];
    return result?.ok === true && result.duplicate;
  }).length;
  const remainingCount = sessions.length - savedCount;
  const reviewedCount = sessions.filter((session) =>
    Boolean(selectedAthlete && reviewed[session.id] === selectedAthlete.id) && !activeSaveResults[session.id]?.ok,
  ).length;
  const mismatchedSessions = selectedAthlete
    ? sessions.filter((session) => reviewed[session.id] === selectedAthlete.id && !activeSaveResults[session.id]?.ok && !tagMatchesAthlete(session.metadata.tag, selectedAthlete.displayName))
    : [];

  return (
    <div className={styles.analyzer}>
      {nativeShareStatus ? (
        <p className={styles.privacyNote} role="status">{nativeShareStatus}</p>
      ) : null}
      {nativeShareError ? <div className={styles.errorBox}>{nativeShareError}</div> : null}

      {sessions.length === 0 ? (
        <section className={styles.uploadCard}>
          <label className={styles.uploadLabel}>
            <input
              accept=".zip,application/zip,application/x-zip-compressed"
              disabled={state === "loading" || saveState === "saving"}
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            <span className={styles.uploadIcon} aria-hidden="true">＋</span>
            <strong>{state === "loading" ? "Analyzuji soubor…" : "Nahrát Tindeq ZIP"}</strong>
            <small>Jednotlivý export nebo ZIP s více exporty</small>
          </label>
          <p className={styles.privacyNote}>
            ZIP zůstává v zařízení. Strukturovaný výsledek se uloží až po výslovném potvrzení.
          </p>
        </section>
      ) : (
        <div className={styles.reuploadBar}>
          <label className={styles.reuploadLabel}>
            <input
              accept=".zip,application/zip,application/x-zip-compressed"
              disabled={state === "loading" || saveState === "saving"}
              onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
              type="file"
            />
            <span aria-hidden="true">↻</span>
            <strong>Nahrát jiný Tindeq ZIP</strong>
          </label>
        </div>
      )}

      {state === "error" && <div className={styles.errorBox}>{message}</div>}


      {sessions.length > 0 && <p className={styles.reviewLink}><a href="#save-tindeq">Přejít na přiřazení a uložení měření ↓</a></p>}

      {sessions.length > 1 && (
        <nav className={styles.sessionTabs} aria-label="Importovaná měření">
          {sessions.map((session) => (
            <button
              aria-current={session.id === selected?.id ? "true" : undefined}
              className={session.id === selected?.id ? styles.activeTab : ""}
              key={session.id}
              onClick={() => setSelectedId(session.id)}
              type="button"
            >
              {session.metadata.tag}
              <small>{formatTindeqDate(session.metadata.measuredAt)}</small>
            </button>
          ))}
        </nav>
      )}

      {errors.length > 0 && (
        <div className={styles.errorBox}>
          <strong>Některé soubory se nepodařilo načíst:</strong>
          <ul>
            {errors.map((error) => (
              <li key={`${error.file}-${error.error}`}>
                {error.file}: {error.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && <>
        <p className={styles.eyebrow}>2. Analyzovaná měření</p>
        <TindeqSessionResult key={selected.id} session={selected} />
      </>}

      <section className={styles.savePanel} id="save-tindeq" tabIndex={-1} aria-labelledby="save-tindeq-title">
        <p className={styles.eyebrow}>3. Kontrola a uložení</p>
        <fieldset className={styles.assignmentControls} disabled={saveState === "saving"}>
          <legend className={styles.assignmentLegend}>Přiřazení a uložení měření</legend>
          {athletePicker}
          <div className={styles.savePanelHeader}>
            <div>
              <h2 id="save-tindeq-title">Uložit měření ke klientovi</h2>
              <p>
                {selectedAthlete
                  ? `Vybraný klient: ${selectedAthlete.displayName}`
                  : "Nejprve vyber klienta z databáze."}
              </p>
            </div>
          </div>

          {mismatchedSessions.length > 0 ? (
            <div className={styles.matchWarning} role="status">
              <strong>Zkontroluj přiřazení klienta.</strong>
              <p>
                Tag v exportu ({mismatchedSessions.map((session) => session.metadata.tag).join(", ")})
                neodpovídá přesně vybranému klientovi. Uložení není blokováno.
              </p>
            </div>
          ) : null}

          {sessions.length > 0 ? (
            <ul className={styles.assignmentList} aria-label="Kontrola měření před uložením">
              {sessions.map((session) => {
                const result = activeSaveResults[session.id];
                const isSaving = saveState === "saving" && reviewed[session.id] === selectedAthlete?.id && !result?.ok;
                const savedEntries = Object.values(saveResults).filter((entry) =>
                  entry.result.sourceSessionId === session.id && entry.result.ok,
                );
                return (
                  <li key={session.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={Boolean(selectedAthlete && reviewed[session.id] === selectedAthlete.id)}
                        disabled={!selectedAthlete || result?.ok === true}
                        onChange={(event) => setReviewed((current) => ({
                          ...current, [session.id]: event.target.checked ? selectedAthlete!.id : "",
                        }))}
                        aria-label={`Přiřadit ${session.metadata.tag} (${session.datasetName}) vybranému klientovi`}
                      />
                      <span>
                        <strong>{session.metadata.tag}</strong>
                        <small>{formatTindeqDate(session.metadata.measuredAt)} · {session.datasetName}</small>
                        <small>{selectedAthlete && reviewed[session.id] === selectedAthlete.id
                          ? `Přiřazeno: ${selectedAthlete.displayName}` : "Nepřiřazeno k vybranému klientovi"}</small>
                      </span>
                    </label>
                    <div role="status" className={!isSaving && result && !result.ok ? styles.saveError : result?.ok ? styles.saveSuccess : styles.assignmentPending}>
                      {savedEntries.map((entry) => (
                        <small key={entry.athlete.id}>{entry.athlete.displayName}: {entry.result.ok && entry.result.duplicate ? "již dříve uloženo – nevytvořen nový záznam" : "uloženo"}</small>
                      ))}
                      {isSaving ? <small>Ukládám…</small>
                        : result && !result.ok ? <small>Chyba: {result.error}</small>
                          : !result?.ok ? <small>Neuloženo k vybranému klientovi</small> : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : <p>Nejprve nahraj Tindeq ZIP.</p>}
          <p className={styles.privacyNote}>Označ pouze měření patřící vybranému klientovi. Uloží se jen označené položky; ostatní můžeš přiřadit dalšímu klientovi.</p>

          <button
            className={styles.saveButton}
            disabled={!selectedAthlete || saveState === "saving" || reviewedCount === 0}
            onClick={handleSave}
            type="button"
          >
            {saveState === "saving"
              ? "Ukládám…"
              : sessions.length > 0 && remainingCount === 0
                ? duplicateCount === sessions.length
                  ? "Měření již uloženo"
                  : "Měření uloženo"
                : sessions.length > 1
                  ? `Uložit ${reviewedCount} měření ke klientovi`
                  : "Uložit měření ke klientovi"}
          </button>
        </fieldset>
        <div aria-live="polite" className={styles.saveStatus}>
          {activeSaveState === "success" ? (
            <p className={styles.saveSuccess}>
              {duplicateCount === sessions.length
                ? "Všechna měření už byla dříve uložena. Nevznikl žádný nový záznam."
                : duplicateCount > 0
                  ? `${savedCount - duplicateCount} měření bylo nově uloženo, ${duplicateCount} už bylo v databázi.`
                  : "Vybraná měření byla uložena."}
            </p>
          ) : null}
          {activeSaveState === "partial" ? (
            <p className={styles.savePartial}>
              Část měření byla uložena. Znovu se odešlou pouze neúspěšné položky.
            </p>
          ) : null}
          {activeSaveState === "error" ? (
            <p className={styles.saveError}>Uložení selhalo. Analyzovaný výsledek zůstává na obrazovce.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
