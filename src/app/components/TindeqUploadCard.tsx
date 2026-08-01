"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  createBrowserSupabaseClient,
  hasSupabaseConfig,
} from "@/lib/supabase-browser";

type ImportResponse = {
  success: boolean;
  measurementId?: string;
  detailUrl?: string;
  duplicate?: boolean;
  importedCount?: number;
  code?: string;
  message?: string;
};

type Stage = "idle" | "uploading" | "checking" | "analyzing" | "saving" | "done" | "error";

const STAGE_LABELS: Record<Stage, string> = {
  idle: "Připraveno",
  uploading: "Nahrávání",
  checking: "Kontrola souboru",
  analyzing: "Analýza",
  saving: "Ukládání",
  done: "Hotovo",
  error: "Chyba",
};

function delay(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export default function TindeqUploadCard() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [message, setMessage] = useState("Vyber původní ZIP export z Tindeq.");
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("martin@vankotraining.cz");
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const previewMode = process.env.NEXT_PUBLIC_TINDEQ_PREVIEW_MODE === "1";
  const supabase = useMemo(
    () => (hasSupabaseConfig() ? createBrowserSupabaseClient() : null),
    [],
  );

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handlePasswordLogin() {
    if (!supabase || authBusy) return;

    setAuthBusy(true);
    setAuthMessage("Přihlašuji testovací účet...");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthBusy(false);
    setAuthMessage(error ? error.message : "Přihlášení proběhlo. Můžeš nahrát ZIP.");
  }

  async function upload(file: File) {
    if (previewMode && !session) {
      setStage("error");
      setMessage("Nejdřív se přihlas do testovacího preview.");
      return;
    }

    setStage("uploading");
    setMessage(file.name);
    try {
      const formData = new FormData();
      formData.set("tindeqFile", file);
      await delay(120);
      setStage("checking");
      await delay(120);
      setStage("analyzing");
      const response = await fetch("/api/import/tindeq", {
        method: "POST",
        body: formData,
      });
      const result = await response.json() as ImportResponse;
      if (!response.ok || !result.success || !result.detailUrl) {
        throw new Error(result.message ?? "Import se nepodařil.");
      }
      setStage("saving");
      await delay(100);
      setStage("done");
      setMessage(result.duplicate
        ? "Tento soubor už byl importován. Otevírám existující měření."
        : `Importováno: ${result.importedCount ?? 1}`);
      const separator = result.detailUrl.includes("?") ? "&" : "?";
      window.location.assign(`${result.detailUrl}${separator}duplicate=${result.duplicate ? "1" : "0"}`);
    } catch (error) {
      setStage("error");
      setMessage(error instanceof Error ? error.message : "Import se nepodařil.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="tindeq-upload-shell" aria-labelledby="tindeq-upload-heading">
      <div>
        <p className="eyebrow">Tindeq Repeaters</p>
        <h2 id="tindeq-upload-heading">Rychlý import měření</h2>
        <p className="tindeq-upload-message">{message}</p>
        {previewMode ? (
          <p className="status">
            Izolované testovací prostředí · {session ? "přihlášeno" : "nepřihlášeno"}
          </p>
        ) : null}
      </div>

      {previewMode && !session ? (
        <div style={{ display: "grid", gap: "8px", minWidth: "min(100%, 320px)" }}>
          <strong>Testovací přihlášení</strong>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            aria-label="Testovací e-mail"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handlePasswordLogin();
            }}
            autoComplete="current-password"
            placeholder="Dočasné testovací heslo"
            aria-label="Testovací heslo"
          />
          <button type="button" disabled={authBusy || !password} onClick={() => void handlePasswordLogin()}>
            {authBusy ? "Přihlašuji..." : "Přihlásit do preview"}
          </button>
          {authMessage ? <p className="status">{authMessage}</p> : null}
        </div>
      ) : (
        <div className="tindeq-upload-actions">
          <input
            ref={inputRef}
            className="tindeq-file-input"
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <button
            className="tindeq-upload-button"
            type="button"
            disabled={!(["idle", "done", "error"] as Stage[]).includes(stage)}
            onClick={() => inputRef.current?.click()}
          >
            Nahrát Tindeq ZIP
          </button>
          <span className={`tindeq-stage tindeq-stage-${stage}`} role="status" aria-live="polite">
            {STAGE_LABELS[stage]}
          </span>
        </div>
      )}
    </section>
  );
}
