"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  createBrowserSupabaseClient,
  hasSupabaseConfig,
} from "@/lib/supabase-browser";

type LoadState = "idle" | "ready" | "error";

type Athlete = {
  id: string;
  display_name: string;
  name_key: string | null;
  note: string | null;
};

type AthleteProfile = {
  id: string;
  athlete_id: string;
  birth_date: string | null;
  shin_length_cm: number | null;
  body_weight_kg: number | null;
  age: number | null;
  profile_date: string | null;
  updated_at: string | null;
};

type KneeExtensionTest = {
  id: string;
  athlete_id: string;
  test_date: string;
  right_force_kg: number | null;
  left_force_kg: number | null;
  asymmetry_pct: number | null;
  weaker_side: string | null;
  right_nm_per_kg: number | null;
  left_nm_per_kg: number | null;
  body_weight_kg: number | null;
  shin_length_cm: number | null;
  age_at_test_years: number | null;
  note: string | null;
  source: string | null;
  source_row: number | null;
};

type AthleteOverview = Athlete & {
  latestProfile: AthleteProfile | null;
  latestTest: KneeExtensionTest | null;
  tests: KneeExtensionTest[];
};

type AthleteForm = {
  display_name: string;
  birth_date: string;
  body_weight_kg: string;
  shin_length_cm: string;
  note: string;
};

type TestForm = {
  test_date: string;
  right_force_kg: string;
  left_force_kg: string;
  body_weight_kg: string;
  shin_length_cm: string;
  note: string;
};

const GRAVITY = 9.80665;
const NORM_NM_PER_KG = 3;

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: string) {
  return Number(value.replace(",", "."));
}

function nameKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function calculateAge(birthDate: string | null | undefined, testDate: string) {
  if (!birthDate) {
    return null;
  }

  const birth = new Date(`${birthDate}T00:00:00`);
  const test = new Date(`${testDate}T00:00:00`);

  if (Number.isNaN(birth.getTime()) || Number.isNaN(test.getTime())) {
    return null;
  }

  return (test.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

function forceKgToNmPerKg(
  forceKg: number,
  shinLengthCm: number,
  bodyWeightKg: number,
) {
  if (forceKg <= 0 || shinLengthCm <= 0 || bodyWeightKg <= 0) {
    return null;
  }

  return (forceKg * GRAVITY * (shinLengthCm / 100)) / bodyWeightKg;
}

function targetForceKg(shinLengthCm: number | null, bodyWeightKg: number | null) {
  if (!shinLengthCm || !bodyWeightKg || shinLengthCm <= 0 || bodyWeightKg <= 0) {
    return null;
  }

  return (NORM_NM_PER_KG * bodyWeightKg) / (GRAVITY * (shinLengthCm / 100));
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("cs-CZ").format(date);
}

function formatNumber(
  value: number | null | undefined,
  decimals = 1,
  suffix = "",
) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(decimals)}${suffix}`;
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  const normalized = Math.abs(value) <= 1 ? value * 100 : value;

  return `${normalized.toFixed(1)} %`;
}

function formatSide(value: string | null | undefined) {
  if (value === "right") {
    return "Prava";
  }

  if (value === "left") {
    return "Leva";
  }

  if (value === "none") {
    return "Bez rozdilu";
  }

  return "-";
}

function getNormGap(test: KneeExtensionTest | null | undefined) {
  if (!test) {
    return null;
  }

  const leftNm = test.left_nm_per_kg ?? null;
  const rightNm = test.right_nm_per_kg ?? null;
  const leftForce = test.left_force_kg ?? null;
  const rightForce = test.right_force_kg ?? null;
  const targetKg = targetForceKg(test.shin_length_cm, test.body_weight_kg);

  if (
    leftNm === null ||
    rightNm === null ||
    leftForce === null ||
    rightForce === null ||
    targetKg === null
  ) {
    return null;
  }

  const weakerNm = Math.min(leftNm, rightNm);
  const weakerForce = Math.min(leftForce, rightForce);
  const missingNm = Math.max(0, NORM_NM_PER_KG - weakerNm);

  return {
    missingKg: Math.max(0, targetKg - weakerForce),
    missingNm,
    missingPct: (missingNm / NORM_NM_PER_KG) * 100,
  };
}

function KneeProgressChart({ tests }: { tests: KneeExtensionTest[] }) {
  const points = tests
    .slice()
    .reverse()
    .filter((test) => test.left_nm_per_kg !== null || test.right_nm_per_kg !== null);

  if (points.length === 0) {
    return <p className="status">Zatim tu neni zadny test pro graf.</p>;
  }

  const width = 560;
  const height = 230;
  const padding = 34;
  const maxValue = Math.max(
    NORM_NM_PER_KG,
    ...points.flatMap((test) => [test.left_nm_per_kg ?? 0, test.right_nm_per_kg ?? 0]),
  );
  const chartMax = Math.max(3, Math.ceil(maxValue * 10) / 10);
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const xForIndex = (index: number) =>
    points.length === 1
      ? width / 2
      : padding + (index / (points.length - 1)) * chartWidth;
  const yForValue = (value: number) =>
    padding + (1 - value / chartMax) * chartHeight;
  const pathFor = (side: "left" | "right") =>
    points
      .map((test, index) => {
        const value = side === "left" ? test.left_nm_per_kg : test.right_nm_per_kg;
        return `${xForIndex(index)},${yForValue(value ?? 0)}`;
      })
      .join(" ");

  return (
    <div className="chart-card">
      <div className="chart-legend">
        <span className="legend-item left">Leva</span>
        <span className="legend-item right">Prava</span>
        <span className="legend-item target">Norma</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Vyvoj knee extension testu">
        <line
          className="chart-target"
          x1={padding}
          x2={width - padding}
          y1={yForValue(NORM_NM_PER_KG)}
          y2={yForValue(NORM_NM_PER_KG)}
        />
        <text x={padding} y={yForValue(NORM_NM_PER_KG) - 7}>
          {formatNumber(NORM_NM_PER_KG, 1)} Nm/kg
        </text>
        <polyline className="chart-line left" points={pathFor("left")} />
        <polyline className="chart-line right" points={pathFor("right")} />
        {points.map((test, index) => (
          <g key={test.id}>
            <circle
              className="chart-dot left"
              cx={xForIndex(index)}
              cy={yForValue(test.left_nm_per_kg ?? 0)}
              r="4"
            />
            <circle
              className="chart-dot right"
              cx={xForIndex(index)}
              cy={yForValue(test.right_nm_per_kg ?? 0)}
              r="4"
            />
            <text className="chart-date" x={xForIndex(index)} y={height - 10}>
              {new Date(`${test.test_date}T00:00:00`).toLocaleDateString("cs-CZ", {
                day: "numeric",
                month: "numeric",
              })}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default function KneeDashboard() {
  const [email, setEmail] = useState("martin@vankotraining.cz");
  const [message, setMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athleteProfiles, setAthleteProfiles] = useState<AthleteProfile[]>([]);
  const [kneeTests, setKneeTests] = useState<KneeExtensionTest[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [athleteForm, setAthleteForm] = useState<AthleteForm>({
    display_name: "",
    birth_date: "",
    body_weight_kg: "",
    shin_length_cm: "33",
    note: "",
  });
  const [testForm, setTestForm] = useState<TestForm>({
    test_date: todayIsoDate(),
    right_force_kg: "",
    left_force_kg: "",
    body_weight_kg: "",
    shin_length_cm: "33",
    note: "",
  });
  const [isSavingAthlete, setIsSavingAthlete] = useState(false);
  const [isSavingTest, setIsSavingTest] = useState(false);

  const isConfigured = hasSupabaseConfig();
  const supabase = useMemo(() => {
    if (!isConfigured) {
      return null;
    }

    return createBrowserSupabaseClient();
  }, [isConfigured]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !session) {
      return;
    }

    Promise.all([
      supabase
        .from("athletes")
        .select("id,display_name,name_key,note")
        .order("display_name"),
      supabase
        .from("athlete_profiles")
        .select(
          "id,athlete_id,birth_date,shin_length_cm,body_weight_kg,age,profile_date,updated_at",
        )
        .order("profile_date", { ascending: false, nullsFirst: false })
        .order("updated_at", { ascending: false, nullsFirst: false }),
      supabase
        .from("knee_extension_tests")
        .select(
          "id,athlete_id,test_date,right_force_kg,left_force_kg,asymmetry_pct,weaker_side,right_nm_per_kg,left_nm_per_kg,body_weight_kg,shin_length_cm,age_at_test_years,note,source,source_row",
        )
        .order("test_date", { ascending: false })
        .order("source_row", { ascending: false, nullsFirst: false }),
    ]).then(([athletesResult, profilesResult, testsResult]) => {
      const error = athletesResult.error ?? profilesResult.error ?? testsResult.error;

      if (error) {
        setMessage(error.message);
        setLoadState("error");
        return;
      }

      setAthletes((athletesResult.data ?? []) as Athlete[]);
      setAthleteProfiles((profilesResult.data ?? []) as AthleteProfile[]);
      setKneeTests((testsResult.data ?? []) as KneeExtensionTest[]);
      setMessage("");
      setLoadState("ready");
    });
  }, [session, supabase]);

  const athleteOverviews = useMemo<AthleteOverview[]>(() => {
    const profilesByAthlete = new Map<string, AthleteProfile>();
    const testsByAthlete = new Map<string, KneeExtensionTest[]>();

    athleteProfiles.forEach((profile) => {
      if (!profilesByAthlete.has(profile.athlete_id)) {
        profilesByAthlete.set(profile.athlete_id, profile);
      }
    });

    kneeTests.forEach((test) => {
      const current = testsByAthlete.get(test.athlete_id) ?? [];
      current.push(test);
      testsByAthlete.set(test.athlete_id, current);
    });

    return athletes.map((athlete) => {
      const tests = (testsByAthlete.get(athlete.id) ?? []).sort((a, b) => {
        const dateDiff =
          new Date(b.test_date).getTime() - new Date(a.test_date).getTime();

        if (dateDiff !== 0) {
          return dateDiff;
        }

        return (b.source_row ?? 0) - (a.source_row ?? 0);
      });

      return {
        ...athlete,
        latestProfile: profilesByAthlete.get(athlete.id) ?? null,
        latestTest: tests[0] ?? null,
        tests,
      };
    });
  }, [athleteProfiles, athletes, kneeTests]);

  const filteredAthletes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return athleteOverviews;
    }

    return athleteOverviews.filter((athlete) =>
      [athlete.display_name, athlete.name_key, athlete.note, athlete.latestTest?.test_date]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery)),
    );
  }, [athleteOverviews, query]);

  const selectedAthlete = useMemo(
    () =>
      filteredAthletes.find((athlete) => athlete.id === selectedAthleteId) ??
      filteredAthletes[0] ??
      athleteOverviews[0] ??
      null,
    [athleteOverviews, filteredAthletes, selectedAthleteId],
  );

  useEffect(() => {
    if (!selectedAthlete) {
      return;
    }

    setTestForm((current) => ({
      ...current,
      body_weight_kg:
        selectedAthlete.latestProfile?.body_weight_kg?.toString() ??
        current.body_weight_kg,
      shin_length_cm:
        selectedAthlete.latestProfile?.shin_length_cm?.toString() ??
        current.shin_length_cm,
    }));
  }, [selectedAthlete]);

  const testedAthleteCount = athleteOverviews.filter(
    (athlete) => athlete.tests.length > 0,
  ).length;
  const latestTestDate = kneeTests[0]?.test_date ?? null;
  const latestNormGap = getNormGap(selectedAthlete?.latestTest);

  function updateAthleteForm(key: keyof AthleteForm, value: string) {
    setAthleteForm((current) => ({ ...current, [key]: value }));
  }

  function updateTestForm(key: keyof TestForm, value: string) {
    setTestForm((current) => ({ ...current, [key]: value }));
  }

  async function handleMagicLink() {
    if (!supabase) {
      return;
    }

    setMessage("Posilam prihlasovaci odkaz...");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    setMessage(
      error
        ? error.message
        : "Hotovo. Zkontroluj e-mail a klikni na prihlasovaci odkaz.",
    );
  }

  async function handleSignOut() {
    await supabase?.auth.signOut();
  }

  async function handleCreateAthlete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !athleteForm.display_name.trim()) {
      return;
    }

    setIsSavingAthlete(true);
    setMessage("");

    const { data: athlete, error } = await supabase
      .from("athletes")
      .insert({
        display_name: athleteForm.display_name.trim(),
        name_key: nameKey(athleteForm.display_name),
        note: athleteForm.note.trim() || null,
      })
      .select("id,display_name,name_key,note")
      .single();

    if (error || !athlete) {
      setIsSavingAthlete(false);
      setMessage(error?.message ?? "Klienta se nepodarilo zalozit.");
      return;
    }

    const profilePayload = {
      athlete_id: athlete.id,
      birth_date: athleteForm.birth_date || null,
      body_weight_kg: athleteForm.body_weight_kg
        ? toNumber(athleteForm.body_weight_kg)
        : null,
      shin_length_cm: athleteForm.shin_length_cm
        ? toNumber(athleteForm.shin_length_cm)
        : null,
      age: calculateAge(athleteForm.birth_date || null, todayIsoDate()),
      profile_date: todayIsoDate(),
    };

    if (
      profilePayload.birth_date ||
      profilePayload.body_weight_kg ||
      profilePayload.shin_length_cm
    ) {
      const { data: profile } = await supabase
        .from("athlete_profiles")
        .insert(profilePayload)
        .select("id,athlete_id,birth_date,shin_length_cm,body_weight_kg,age,profile_date,updated_at")
        .single();

      if (profile) {
        setAthleteProfiles((current) => [profile as AthleteProfile, ...current]);
      }
    }

    setIsSavingAthlete(false);
    setAthletes((current) => [athlete as Athlete, ...current]);
    setSelectedAthleteId((athlete as Athlete).id);
    setAthleteForm({
      display_name: "",
      birth_date: "",
      body_weight_kg: "",
      shin_length_cm: "33",
      note: "",
    });
    setMessage("Klient je zalozeny.");
  }

  async function handleCreateTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !selectedAthlete) {
      return;
    }

    const bodyWeight = toNumber(testForm.body_weight_kg);
    const shinLength = toNumber(testForm.shin_length_cm);
    const rightForce = toNumber(testForm.right_force_kg);
    const leftForce = toNumber(testForm.left_force_kg);
    const testDate = testForm.test_date || todayIsoDate();
    const rightNm = forceKgToNmPerKg(rightForce, shinLength, bodyWeight);
    const leftNm = forceKgToNmPerKg(leftForce, shinLength, bodyWeight);

    if (
      !Number.isFinite(bodyWeight) ||
      !Number.isFinite(shinLength) ||
      !Number.isFinite(rightForce) ||
      !Number.isFinite(leftForce) ||
      bodyWeight <= 0 ||
      shinLength <= 0 ||
      rightForce <= 0 ||
      leftForce <= 0 ||
      rightNm === null ||
      leftNm === null
    ) {
      setMessage("Vypln kladne hodnoty pro vahu, bercovou paku a obe strany.");
      return;
    }

    const strongerForce = Math.max(rightForce, leftForce);
    const asymmetryPct =
      strongerForce > 0 ? (Math.abs(rightForce - leftForce) / strongerForce) * 100 : 0;
    const weakerSide =
      Math.abs(rightForce - leftForce) < 0.01
        ? "none"
        : rightForce < leftForce
          ? "right"
          : "left";
    const birthDate = selectedAthlete.latestProfile?.birth_date ?? null;

    setIsSavingTest(true);
    setMessage("");

    const { data, error } = await supabase
      .from("knee_extension_tests")
      .insert({
        athlete_id: selectedAthlete.id,
        test_date: testDate,
        right_force_kg: rightForce,
        left_force_kg: leftForce,
        asymmetry_pct: asymmetryPct,
        weaker_side: weakerSide,
        right_nm_per_kg: rightNm,
        left_nm_per_kg: leftNm,
        body_weight_kg: bodyWeight,
        shin_length_cm: shinLength,
        age_at_test_years: calculateAge(birthDate, testDate),
        note: testForm.note.trim() || null,
        source: "manual",
      })
      .select("id,athlete_id,test_date,right_force_kg,left_force_kg,asymmetry_pct,weaker_side,right_nm_per_kg,left_nm_per_kg,body_weight_kg,shin_length_cm,age_at_test_years,note,source,source_row")
      .single();

    setIsSavingTest(false);

    if (error || !data) {
      setMessage(error?.message ?? "Test se nepodarilo ulozit.");
      return;
    }

    setKneeTests((current) => [data as KneeExtensionTest, ...current]);
    setTestForm((current) => ({
      ...current,
      test_date: todayIsoDate(),
      right_force_kg: "",
      left_force_kg: "",
      note: "",
    }));
    setMessage("Knee extension test je ulozeny.");
  }

  if (!isConfigured) {
    return (
      <main className="shell">
        <section className="empty-state">
          <p className="eyebrow">Knee Data</p>
          <h1>Chybi Supabase konfigurace</h1>
          <p>
            Ve Vercelu dopln <code>NEXT_PUBLIC_SUPABASE_URL</code> a{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">knee.vankotraining.cz</p>
          <h1>Knee extension dashboard</h1>
        </div>
        {session ? (
          <button className="ghost-button" onClick={handleSignOut}>
            Odhlasit
          </button>
        ) : null}
      </header>

      {!session ? (
        <section className="login-panel">
          <div>
            <h2>Prihlaseni trenera</h2>
            <p>Posleme magic link na e-mail s pristupem do Supabase.</p>
          </div>
          <div className="login-row">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="martin@vankotraining.cz"
            />
            <button onClick={handleMagicLink}>Poslat link</button>
          </div>
          {message ? <p className="status">{message}</p> : null}
        </section>
      ) : (
        <>
          <section className="stats-grid">
            <div className="metric">
              <span>Sportovci</span>
              <strong>{athletes.length}</strong>
            </div>
            <div className="metric">
              <span>Knee testy</span>
              <strong>{kneeTests.length}</strong>
            </div>
            <div className="metric">
              <span>S testem</span>
              <strong>{testedAthleteCount}</strong>
            </div>
            <div className="metric">
              <span>Posledni test</span>
              <strong>{formatDate(latestTestDate)}</strong>
            </div>
          </section>

          <section className="dashboard-layout">
            <section className="panel list-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Novy klient</p>
                  <h2>Pridat klienta</h2>
                </div>
              </div>

              <form className="stack-form" onSubmit={handleCreateAthlete}>
                <label>
                  Jmeno
                  <input
                    value={athleteForm.display_name}
                    onChange={(event) => updateAthleteForm("display_name", event.target.value)}
                    placeholder="Milos Merta"
                    required
                  />
                </label>
                <label>
                  Datum narozeni
                  <input
                    type="date"
                    value={athleteForm.birth_date}
                    onChange={(event) => updateAthleteForm("birth_date", event.target.value)}
                  />
                </label>
                <div className="form-row">
                  <label>
                    Vaha kg
                    <input
                      inputMode="decimal"
                      value={athleteForm.body_weight_kg}
                      onChange={(event) => updateAthleteForm("body_weight_kg", event.target.value)}
                      placeholder="82"
                    />
                  </label>
                  <label>
                    Bercova paka cm
                    <input
                      inputMode="decimal"
                      value={athleteForm.shin_length_cm}
                      onChange={(event) => updateAthleteForm("shin_length_cm", event.target.value)}
                      placeholder="33"
                    />
                  </label>
                </div>
                <label>
                  Poznamka
                  <textarea
                    value={athleteForm.note}
                    onChange={(event) => updateAthleteForm("note", event.target.value)}
                    placeholder="Interni poznamka"
                  />
                </label>
                <button disabled={isSavingAthlete}>
                  {isSavingAthlete ? "Ukladam..." : "Zalozit klienta"}
                </button>
              </form>

              <div className="panel-header spaced-header">
                <div>
                  <p className="eyebrow">Sportovci</p>
                  <h2>Prehled mereni</h2>
                </div>
                <span className="pill">{filteredAthletes.length}</span>
              </div>

              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Hledat sportovce"
              />

              {loadState === "idle" ? <p className="status">Nacitam knee data...</p> : null}
              {loadState === "error" ? <p className="status error">{message}</p> : null}

              <div className="athlete-list">
                {loadState === "ready" && filteredAthletes.length === 0 ? (
                  <p className="status">Zatim tu neni zadny sportovec pro tento filtr.</p>
                ) : null}
                {filteredAthletes.map((athlete) => (
                  <button
                    className={selectedAthlete?.id === athlete.id ? "athlete-card selected" : "athlete-card"}
                    key={athlete.id}
                    type="button"
                    onClick={() => setSelectedAthleteId(athlete.id)}
                  >
                    <div className="athlete-card-header">
                      <div>
                        <h3>{athlete.display_name}</h3>
                        <p>{athlete.tests.length} testu</p>
                      </div>
                      <span className="pill">{formatDate(athlete.latestTest?.test_date)}</span>
                    </div>
                    <dl>
                      <div>
                        <dt>Prava</dt>
                        <dd>{formatNumber(athlete.latestTest?.right_nm_per_kg, 2)}</dd>
                      </div>
                      <div>
                        <dt>Leva</dt>
                        <dd>{formatNumber(athlete.latestTest?.left_nm_per_kg, 2)}</dd>
                      </div>
                      <div>
                        <dt>Asym</dt>
                        <dd>{formatPercent(athlete.latestTest?.asymmetry_pct)}</dd>
                      </div>
                    </dl>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel detail-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Knee extension</p>
                  <h2>{selectedAthlete ? selectedAthlete.display_name : "Vyber sportovce"}</h2>
                </div>
                <span className="pill">{selectedAthlete?.tests.length ?? 0} testu</span>
              </div>

              {selectedAthlete ? (
                <>
                  <div className="profile-grid">
                    <div className="profile-metric">
                      <span>Datum narozeni</span>
                      <strong>{formatDate(selectedAthlete.latestProfile?.birth_date)}</strong>
                    </div>
                    <div className="profile-metric">
                      <span>Vaha</span>
                      <strong>{formatNumber(selectedAthlete.latestProfile?.body_weight_kg, 1, " kg")}</strong>
                    </div>
                    <div className="profile-metric">
                      <span>Delka berce</span>
                      <strong>{formatNumber(selectedAthlete.latestProfile?.shin_length_cm, 1, " cm")}</strong>
                    </div>
                    <div className="profile-metric">
                      <span>Vek v profilu</span>
                      <strong>{formatNumber(selectedAthlete.latestProfile?.age, 0)}</strong>
                    </div>
                  </div>

                  {selectedAthlete.latestTest ? (
                    <div className="norm-grid">
                      <div className="profile-metric highlight">
                        <span>Leva</span>
                        <strong>{formatNumber(selectedAthlete.latestTest.left_nm_per_kg, 2)}</strong>
                        <small>Nm/kg</small>
                      </div>
                      <div className="profile-metric highlight">
                        <span>Prava</span>
                        <strong>{formatNumber(selectedAthlete.latestTest.right_nm_per_kg, 2)}</strong>
                        <small>Nm/kg</small>
                      </div>
                      <div className="profile-metric highlight">
                        <span>Chybi do normy</span>
                        <strong>{formatPercent(latestNormGap?.missingPct)}</strong>
                        <small>{formatNumber(latestNormGap?.missingKg, 1, " kg")} na slabsi strane</small>
                      </div>
                    </div>
                  ) : null}

                  <KneeProgressChart tests={selectedAthlete.tests} />

                  <form className="stack-form test-form" onSubmit={handleCreateTest}>
                    <div className="form-row">
                      <label>
                        Datum testu
                        <input
                          type="date"
                          value={testForm.test_date}
                          onChange={(event) => updateTestForm("test_date", event.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Norma
                        <input value={`${NORM_NM_PER_KG.toFixed(1)} Nm/kg`} readOnly />
                      </label>
                    </div>
                    <div className="form-row">
                      <label>
                        Vaha kg
                        <input
                          inputMode="decimal"
                          value={testForm.body_weight_kg}
                          onChange={(event) => updateTestForm("body_weight_kg", event.target.value)}
                          required
                        />
                      </label>
                      <label>
                        Bercova paka cm
                        <input
                          inputMode="decimal"
                          value={testForm.shin_length_cm}
                          onChange={(event) => updateTestForm("shin_length_cm", event.target.value)}
                          required
                        />
                      </label>
                    </div>
                    <div className="form-row">
                      <label>
                        Leva kg
                        <input
                          inputMode="decimal"
                          value={testForm.left_force_kg}
                          onChange={(event) => updateTestForm("left_force_kg", event.target.value)}
                          placeholder="35"
                          required
                        />
                      </label>
                      <label>
                        Prava kg
                        <input
                          inputMode="decimal"
                          value={testForm.right_force_kg}
                          onChange={(event) => updateTestForm("right_force_kg", event.target.value)}
                          placeholder="42"
                          required
                        />
                      </label>
                    </div>
                    <label>
                      Poznamka k testu
                      <textarea
                        value={testForm.note}
                        onChange={(event) => updateTestForm("note", event.target.value)}
                        placeholder="Bolest, setup, poznamka k mereni..."
                      />
                    </label>
                    <button disabled={isSavingTest}>{isSavingTest ? "Ukladam..." : "Ulozit test"}</button>
                  </form>

                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Datum</th>
                          <th>Prava kg</th>
                          <th>Leva kg</th>
                          <th>Prava Nm/kg</th>
                          <th>Leva Nm/kg</th>
                          <th>Asym</th>
                          <th>Slabsi</th>
                          <th>Vek</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedAthlete.tests.map((test) => (
                          <tr key={test.id}>
                            <td>{formatDate(test.test_date)}</td>
                            <td>{formatNumber(test.right_force_kg, 1)}</td>
                            <td>{formatNumber(test.left_force_kg, 1)}</td>
                            <td>{formatNumber(test.right_nm_per_kg, 2)}</td>
                            <td>{formatNumber(test.left_nm_per_kg, 2)}</td>
                            <td>{formatPercent(test.asymmetry_pct)}</td>
                            <td>{formatSide(test.weaker_side)}</td>
                            <td>{formatNumber(test.age_at_test_years, 1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="status">Zatim neni vybran zadny sportovec.</p>
              )}
              {message ? <p className="status footer-status">{message}</p> : null}
            </section>
          </section>
        </>
      )}
    </main>
  );
}
