"use client";

import { useState } from "react";

type Props = {
  sessionId: string;
  initialPain: number | null;
  initialRpe: number | null;
  initialNote: string | null;
};

export default function TindeqClinicalForm({
  sessionId,
  initialPain,
  initialRpe,
  initialNote,
}: Props) {
  const [pain, setPain] = useState(initialPain === null ? "" : String(initialPain));
  const [rpe, setRpe] = useState(initialRpe === null ? "" : String(initialRpe));
  const [note, setNote] = useState(initialNote ?? "");
  const [status, setStatus] = useState("");

  async function save() {
    setStatus("Ukládání…");
    const response = await fetch(`/api/repeaters/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        painDuring: pain === "" ? null : Number(pain),
        rpe: rpe === "" ? null : Number(rpe),
        clinicalNote: note,
      }),
    });
    const result = await response.json() as { success?: boolean; message?: string };
    setStatus(response.ok && result.success ? "Uloženo" : result.message ?? "Uložení se nepodařilo.");
  }

  const scaleOptions = Array.from({ length: 11 }, (_, value) => value);

  return (
    <section className="tindeq-detail-card">
      <h2>Bolest a RPE</h2>
      <p className="tindeq-detail-note">
        Nehodnoceno je odlišné od hodnoty 0. Bez bolesti a RPE aplikace zobrazuje pouze mechanické hodnocení.
      </p>
      <div className="tindeq-clinical-grid">
        <label>
          Bolest během testu
          <select value={pain} onChange={(event) => setPain(event.target.value)}>
            <option value="">Nehodnoceno</option>
            {scaleOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          RPE
          <select value={rpe} onChange={(event) => setRpe(event.target.value)}>
            <option value="">Nehodnoceno</option>
            {scaleOptions.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </div>
      <label>
        Klinická poznámka
        <textarea rows={3} maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} />
      </label>
      <div className="tindeq-form-footer">
        <button className="tindeq-secondary-button" type="button" onClick={() => void save()}>
          Uložit klinické údaje
        </button>
        <span role="status">{status}</span>
      </div>
    </section>
  );
}
