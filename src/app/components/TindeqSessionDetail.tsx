import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import TindeqClinicalForm from "./TindeqClinicalForm";

type Props = {
  sessionId: string;
  expectedAthleteId?: string;
  duplicate?: boolean;
};

type Session = {
  id: string;
  athlete_id: string | null;
  original_tag: string | null;
  test_datetime: string | null;
  protocol_type: string | null;
  left_mvc: number | null;
  right_mvc: number | null;
  work_percentage: number | null;
  left_target: number | null;
  right_target: number | null;
  work_duration_seconds: number | null;
  rest_duration_seconds: number | null;
  planned_repetitions: number | null;
  detected_repetitions: number;
  sampling_frequency_hz: number | null;
  unit: string;
  summary_metrics: Record<string, unknown>;
  pain_during: number | null;
  rpe: number | null;
  clinical_note: string | null;
  parser_version: string;
  segmentation_version: string;
  metrics_version: string;
  analyzed_at: string;
};

type Repetition = {
  id: string;
  repetition_number: number;
  is_valid: boolean;
  work_start_seconds: number;
  work_end_seconds: number;
  left_metrics: Record<string, unknown>;
  right_metrics: Record<string, unknown>;
  warnings: string[];
};

function formatNumber(value: unknown, digits = 1) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(value)
    : "–";
}

function formatDate(value: string | null) {
  if (!value) return "Datum neuvedeno";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("cs-CZ", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
}

function metric(record: Record<string, unknown>, key: string) {
  return formatNumber(record[key]);
}

const WARNING_LABELS: Record<string, string> = {
  incomplete_work_interval: "Neúplný pracovní interval",
  recording_ended_without_relaxation: "Záznam skončil bez relaxační fáze",
  slow_ramp: "Pomalý náběh",
  target_not_reached: "Nedosažení cíle",
  target_overshoot: "Přestřelení cíle",
  unstable_force: "Zvýšená variabilita",
};

export default async function TindeqSessionDetail({ sessionId, expectedAthleteId, duplicate }: Props) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data, error } = await supabase
    .from("tindeq_repeaters_sessions")
    .select("id,athlete_id,original_tag,test_datetime,protocol_type,left_mvc,right_mvc,work_percentage,left_target,right_target,work_duration_seconds,rest_duration_seconds,planned_repetitions,detected_repetitions,sampling_frequency_hz,unit,summary_metrics,pain_during,rpe,clinical_note,parser_version,segmentation_version,metrics_version,analyzed_at")
    .eq("id", sessionId)
    .single();
  if (error || !data) notFound();
  const session = data as Session;
  if (expectedAthleteId && session.athlete_id !== expectedAthleteId) notFound();

  const [{ data: athlete }, { data: repetitionsData }] = await Promise.all([
    session.athlete_id
      ? supabase.from("athletes").select("display_name").eq("id", session.athlete_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("tindeq_repetitions")
      .select("id,repetition_number,is_valid,work_start_seconds,work_end_seconds,left_metrics,right_metrics,warnings")
      .eq("session_id", session.id)
      .order("repetition_number"),
  ]);
  const repetitions = (repetitionsData ?? []) as Repetition[];
  const summary = session.summary_metrics ?? {};
  const warnings = Array.isArray(summary.warnings) ? summary.warnings.filter((item): item is string => typeof item === "string") : [];

  return (
    <main className="tindeq-detail-shell">
      <Link className="tindeq-back-link" href="/">← Zpět do Knee</Link>
      {duplicate ? <div className="tindeq-duplicate-note">Tento soubor už byl importován. Zobrazuje se existující měření.</div> : null}
      <header className="tindeq-detail-header">
        <p className="eyebrow">Tindeq Repeaters</p>
        <h1>{athlete?.display_name ?? session.original_tag ?? "Nepřiřazené měření"}</h1>
        <p>{formatDate(session.test_datetime)} · {session.protocol_type ?? "Protokol neuveden"}</p>
      </header>

      <section className="tindeq-metric-grid">
        <article><span>Pracovní intenzita</span><strong>{formatNumber(session.work_percentage)} % MVC</strong></article>
        <article><span>Opakování</span><strong>{formatNumber(summary.validRepetitions, 0)} / {formatNumber(session.detected_repetitions, 0)}</strong></article>
        <article><span>Plnění cíle</span><strong>{formatNumber(summary.averageTargetCompletionPct)} %</strong></article>
        <article><span>Vzorkování</span><strong>{formatNumber(session.sampling_frequency_hz)} Hz</strong></article>
      </section>

      <section className="tindeq-detail-card">
        <h2>Nastavení testu</h2>
        <dl className="tindeq-definition-grid">
          <div><dt>MVC vlevo</dt><dd>{formatNumber(session.left_mvc)} {session.unit}</dd></div>
          <div><dt>MVC vpravo</dt><dd>{formatNumber(session.right_mvc)} {session.unit}</dd></div>
          <div><dt>Cíl vlevo</dt><dd>{formatNumber(session.left_target)} {session.unit}</dd></div>
          <div><dt>Cíl vpravo</dt><dd>{formatNumber(session.right_target)} {session.unit}</dd></div>
          <div><dt>Práce</dt><dd>{formatNumber(session.work_duration_seconds)} s</dd></div>
          <div><dt>Pauza</dt><dd>{formatNumber(session.rest_duration_seconds)} s</dd></div>
          <div><dt>Plán opakování</dt><dd>{formatNumber(session.planned_repetitions, 0)}</dd></div>
          <div><dt>Analýza</dt><dd>{session.parser_version} / {session.segmentation_version} / {session.metrics_version}</dd></div>
        </dl>
      </section>

      <section className="tindeq-detail-card">
        <h2>Mechanický souhrn</h2>
        <p className="tindeq-detail-note">{String(summary.heuristicNotice ?? "Hodnocení je popisné a používá pracovní heuristiky.")}</p>
        {warnings.length ? (
          <ul className="tindeq-warning-list">
            {warnings.map((warning) => <li key={warning}>{WARNING_LABELS[warning] ?? warning}</li>)}
          </ul>
        ) : <p>Bez automaticky detekovaného upozornění.</p>}
      </section>

      <section className="tindeq-detail-card">
        <h2>Opakování</h2>
        <div className="tindeq-repetition-list">
          {repetitions.map((repetition) => (
            <article key={repetition.id} className="tindeq-repetition-card">
              <div>
                <strong>Opakování {repetition.repetition_number}</strong>
                <span>{repetition.is_valid ? "Kompletní" : "Neúplné"}</span>
              </div>
              <dl>
                <div><dt>Průměr vlevo</dt><dd>{metric(repetition.left_metrics, "mean")} {session.unit}</dd></div>
                <div><dt>Průměr vpravo</dt><dd>{metric(repetition.right_metrics, "mean")} {session.unit}</dd></div>
                <div><dt>CV vlevo</dt><dd>{metric(repetition.left_metrics, "coefficientOfVariationPct")} %</dd></div>
                <div><dt>CV vpravo</dt><dd>{metric(repetition.right_metrics, "coefficientOfVariationPct")} %</dd></div>
              </dl>
            </article>
          ))}
          {!repetitions.length ? <p>Nebylo detekováno žádné pracovní opakování.</p> : null}
        </div>
      </section>

      <TindeqClinicalForm
        sessionId={session.id}
        initialPain={session.pain_during}
        initialRpe={session.rpe}
        initialNote={session.clinical_note}
      />
    </main>
  );
}
