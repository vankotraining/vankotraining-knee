"use client";

import { useRef, useState } from "react";

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

  async function upload(file: File) {
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
      </div>
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
    </section>
  );
}
