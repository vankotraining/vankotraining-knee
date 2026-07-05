"use client";

import { useEffect, useMemo, useState } from "react";
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
  if (value === null || value === undefined) {
    return "-";
  }

  return `${value.toFixed(decimals)}${suffix}`;
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
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

export default function KneeDashboard() {
  const [email, setEmail] = useState("martin@vankotraining.cz");
  const [message, setMessage] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [athleteProfiles, setAthleteProfiles] = useState<AthleteProfile[]>([]);
  const [kneeTests, setKneeTests] = useState<KneeExtensionTest[]>([]);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(
    null,
  );
  const [query, setQuery] = useState("");

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
      const error =
        athletesResult.error ?? profilesResult.error ?? testsResult.error;

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
      [
        athlete.display_name,
        athlete.name_key,
        athlete.note,
        athlete.latestTest?.test_date,
      ]
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

  const testedAthleteCount = athleteOverviews.filter(
    (athlete) => athlete.tests.length > 0,
  ).length;
  const latestTestDate = kneeTests[0]?.test_date ?? null;

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

              {loadState === "idle" ? (
                <p className="status">Nacitam knee data...</p>
              ) : null}
              {loadState === "error" ? (
                <p className="status error">{message}</p>
              ) : null}

              <div className="athlete-list">
                {loadState === "ready" && filteredAthletes.length === 0 ? (
                  <p className="status">
                    Zatim tu neni zadny sportovec pro tento filtr.
                  </p>
                ) : null}
                {filteredAthletes.map((athlete) => (
                  <button
                    className={
                      selectedAthlete?.id === athlete.id
                        ? "athlete-card selected"
                        : "athlete-card"
                    }
                    key={athlete.id}
                    type="button"
                    onClick={() => setSelectedAthleteId(athlete.id)}
                  >
                    <div className="athlete-card-header">
                      <div>
                        <h3>{athlete.display_name}</h3>
                        <p>{athlete.tests.length} testu</p>
                      </div>
                      <span className="pill">
                        {formatDate(athlete.latestTest?.test_date)}
                      </span>
                    </div>
                    <dl>
                      <div>
                        <dt>Prava</dt>
                        <dd>
                          {formatNumber(athlete.latestTest?.right_nm_per_kg, 2)}
                        </dd>
                      </div>
                      <div>
                        <dt>Leva</dt>
                        <dd>
                          {formatNumber(athlete.latestTest?.left_nm_per_kg, 2)}
                        </dd>
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
                  <h2>
                    {selectedAthlete
                      ? selectedAthlete.display_name
                      : "Vyber sportovce"}
                  </h2>
                </div>
                <span className="pill">
                  {selectedAthlete?.tests.length ?? 0} testu
                </span>
              </div>

              {selectedAthlete ? (
                <>
                  <div className="profile-grid">
                    <div className="profile-metric">
                      <span>Datum narozeni</span>
                      <strong>
                        {formatDate(selectedAthlete.latestProfile?.birth_date)}
                      </strong>
                    </div>
                    <div className="profile-metric">
                      <span>Vaha</span>
                      <strong>
                        {formatNumber(
                          selectedAthlete.latestProfile?.body_weight_kg,
                          1,
                          " kg",
                        )}
                      </strong>
                    </div>
                    <div className="profile-metric">
                      <span>Delka berce</span>
                      <strong>
                        {formatNumber(
                          selectedAthlete.latestProfile?.shin_length_cm,
                          1,
                          " cm",
                        )}
                      </strong>
                    </div>
                    <div className="profile-metric">
                      <span>Vek v profilu</span>
                      <strong>
                        {formatNumber(selectedAthlete.latestProfile?.age, 0)}
                      </strong>
                    </div>
                  </div>

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
            </section>
          </section>
        </>
      )}
    </main>
  );
}
