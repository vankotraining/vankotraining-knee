"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  createBrowserSupabaseClient,
  hasSupabaseConfig,
} from "@/lib/supabase-browser";

type LoadState = "idle" | "ready" | "error";
type ActivePanel = "athlete" | "test" | null;
type MobileTab = "measurements" | "compare" | "client";

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

type LegNormGap = {
  key: "left" | "right";
  label: string;
  forceKg: number | null;
  nmPerKg: number | null;
  targetForceKg: number | null;
  missingKg: number | null;
  missingPct: number | null;
  isDeficit: boolean;
};

type TestPayload = {
  test_date: string;
  right_force_kg: number;
  left_force_kg: number;
  asymmetry_pct: number;
  weaker_side: "right" | "left" | "none";
  right_nm_per_kg: number;
  left_nm_per_kg: number;
  body_weight_kg: number;
  shin_length_cm: number;
  age_at_test_years: number | null;
  note: string | null;
  source?: string;
};

const GRAVITY = 9.80665;
const NORM_NM_PER_KG = 3;
const TEST_SELECT =
  "id,athlete_id,test_date,right_force_kg,left_force_kg,asymmetry_pct,weaker_side,right_nm_per_kg,left_nm_per_kg,body_weight_kg,shin_length_cm,age_at_test_years,note,source,source_row";

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

function forceKgToNmPerKg(forceKg: number, shinLengthCm: number, bodyWeightKg: number) {
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

function formatNumber(value: number | null | undefined, decimals = 1, suffix = "") {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${value.toFixed(decimals)}${suffix}`;
}

function getAsymmetryValue(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return Math.abs(value) <= 1 ? Math.abs(value) * 100 : Math.abs(value);
}

function formatPercent(value: number | null | undefined) {
  const normalized = getAsymmetryValue(value);

  if (normalized === null) {
    return "-";
  }

  return `${normalized.toFixed(1)} %`;
}

function getAsymmetryTone(value: number | null | undefined) {
  const normalized = getAsymmetryValue(value);

  if (normalized === null) {
    return "unknown";
  }

  if (normalized < 10) {
    return "ok";
  }

  if (normalized <= 20) {
    return "warning";
  }

  return "problem";
}

function getAsymmetryClass(value: number | null | undefined) {
  return `asymmetry-badge ${getAsymmetryTone(value)}`;
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

function testToForm(test: KneeExtensionTest): TestForm {
  return {
    test_date: test.test_date || todayIsoDate(),
    right_force_kg: test.right_force_kg?.toString() ?? "",
    left_force_kg: test.left_force_kg?.toString() ?? "",
    body_weight_kg: test.body_weight_kg?.toString() ?? "",
    shin_length_cm: test.shin_length_cm?.toString() ?? "33",
    note: test.note ?? "",
  };
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

function getLegNormGaps(test: KneeExtensionTest): LegNormGap[] {
  const targetKg = targetForceKg(test.shin_length_cm, test.body_weight_kg);
  const legs = [
    {
      key: "left" as const,
      label: "Leva noha",
      forceKg: test.left_force_kg,
      nmPerKg: test.left_nm_per_kg,
    },
    {
      key: "right" as const,
      label: "Prava noha",
      forceKg: test.right_force_kg,
      nmPerKg: test.right_nm_per_kg,
    },
  ];

  return legs.map((leg) => {
    const missingKg =
      targetKg === null || leg.forceKg === null
        ? null
        : Math.max(0, targetKg - leg.forceKg);
    const missingPct =
      leg.nmPerKg === null
        ? null
        : Math.max(0, ((NORM_NM_PER_KG - leg.nmPerKg) / NORM_NM_PER_KG) * 100);

    return {
      ...leg,
      targetForceKg: targetKg,
      missingKg,
      missingPct,
      isDeficit: (missingKg ?? 0) > 0 || (missingPct ?? 0) > 0,
    };
  });
}

function buildTestPayload(
  form: TestForm,
  athlete: AthleteOverview,
  includeSource = false,
): { payload: TestPayload | null; error: string | null } {
  const bodyWeight = toNumber(form.body_weight_kg);
  const shinLength = toNumber(form.shin_length_cm);
  const rightForce = toNumber(form.right_force_kg);
  const leftForce = toNumber(form.left_force_kg);
  const testDate = form.test_date || todayIsoDate();
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
    return {
      payload: null,
      error: "Vypln kladne hodnoty pro vahu, bercovou paku a obe strany.",
    };
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
  const birthDate = athlete.latestProfile?.birth_date ?? null;

  return {
    error: null,
    payload: {
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
      note: form.note.trim() || null,
      ...(includeSource ? { source: "manual" } : {}),
    },
  };
}

function KneeProgressChart({ tests }: { tests: KneeExtensionTest[] }) {
  const [visibleSeries, setVisibleSeries] = useState<
    Record<"left" | "right" | "asymmetry", boolean>
  >({ left: true, right: true, asymmetry: true });
  const points = tests
    .slice()
    .reverse()
    .filter(
      (test) =>
        test.left_nm_per_kg !== null ||
        test.right_nm_per_kg !== null ||
        test.asymmetry_pct !== null,
    );

  if (points.length === 0) {
    return <p className="status">Zatim tu neni zadny test pro graf.</p>;
  }

  const width = 560;
  const height = 250;
  const leftPadding = 44;
  const rightPadding = 46;
  const plotTop = 30;
  const plotHeight = 160;
  const plotBottom = plotTop + plotHeight;
  const chartWidth = width - leftPadding - rightPadding;
  const maxStrength = Math.max(
    NORM_NM_PER_KG,
    ...points.flatMap((test) => [test.left_nm_per_kg ?? 0, test.right_nm_per_kg ?? 0]),
  );
  const strengthMax = Math.max(3.5, Math.ceil((maxStrength + 0.2) * 10) / 10);
  const maxAsymmetry = Math.max(
    ...points.map((test) => getAsymmetryValue(test.asymmetry_pct) ?? 0),
  );
  const asymmetryMax = Math.max(25, Math.ceil((maxAsymmetry + 5) / 5) * 5);
  const xForIndex = (index: number) =>
    points.length === 1
      ? leftPadding + chartWidth / 2
      : leftPadding + (index / (points.length - 1)) * chartWidth;
  const yForStrength = (value: number) => plotTop + (1 - value / strengthMax) * plotHeight;
  const yForAsymmetry = (value: number) => plotTop + (1 - value / asymmetryMax) * plotHeight;
  const pathForStrength = (side: "left" | "right") =>
    points
      .map((test, index) => {
        const value = side === "left" ? test.left_nm_per_kg : test.right_nm_per_kg;
        return value === null ? null : `${xForIndex(index)},${yForStrength(value)}`;
      })
      .filter(Boolean)
      .join(" ");
  const asymmetryPath = points
    .map((test, index) => {
      const value = getAsymmetryValue(test.asymmetry_pct);
      return value === null ? null : `${xForIndex(index)},${yForAsymmetry(value)}`;
    })
    .filter(Boolean)
    .join(" ");
  const toggleSeries = (key: "left" | "right" | "asymmetry") => {
    setVisibleSeries((current) => ({ ...current, [key]: !current[key] }));
  };
  const seriesToggles = [
    { key: "left" as const, label: "Leva", color: "var(--accent)" },
    { key: "right" as const, label: "Prava", color: "var(--blue)" },
    { key: "asymmetry" as const, label: "Asymetrie", color: "var(--warning)" },
  ];

  return (
    <div className="chart-card clean-chart">
      <div className="chart-legend" aria-label="Zobrazeni grafu">
        {seriesToggles.map((item) => {
          const isActive = visibleSeries[item.key];

          return (
            <button
              aria-pressed={isActive}
              key={item.key}
              onClick={() => toggleSeries(item.key)}
              style={{
                alignItems: "center",
                background: isActive ? "var(--surface)" : "var(--surface-subtle)",
                border: "1px solid",
                borderColor: isActive ? item.color : "var(--border)",
                borderRadius: "999px",
                color: isActive ? "var(--foreground)" : "var(--muted)",
                display: "inline-flex",
                fontSize: "12px",
                fontWeight: 800,
                gap: "5px",
                lineHeight: 1,
                opacity: isActive ? 1 : 0.55,
                padding: "5px 8px",
              }}
              type="button"
            >
              <span
                aria-hidden="true"
                style={{
                  background: item.key === "asymmetry" ? "transparent" : item.color,
                  border: `2px solid ${item.color}`,
                  borderRadius: "999px",
                  display: "inline-block",
                  height: "10px",
                  width: "10px",
                }}
              />
              {item.label}
            </button>
          );
        })}
        <span className="legend-item target">Norma</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Vyvoj knee extension testu a asymetrie">
        {[0, NORM_NM_PER_KG, strengthMax].map((value) => (
          <line
            className="chart-grid-line"
            key={value}
            x1={leftPadding}
            x2={width - rightPadding}
            y1={yForStrength(value)}
            y2={yForStrength(value)}
          />
        ))}
        <line className="chart-axis" x1={leftPadding} x2={leftPadding} y1={plotTop} y2={plotBottom} />
        {visibleSeries.asymmetry ? (
          <>
            <line className="chart-axis" x1={width - rightPadding} x2={width - rightPadding} y1={plotTop} y2={plotBottom} />
            <text className="chart-axis-title right" x={width - rightPadding} y="15">Asym %</text>
            <text className="chart-axis-label right" x={width - rightPadding + 8} y={plotBottom + 4}>0%</text>
            <text className="chart-axis-label right" x={width - rightPadding + 8} y={yForAsymmetry(asymmetryMax) + 4}>{formatNumber(asymmetryMax, 0, "%")}</text>
            <line className="chart-asymmetry-threshold warning" x1={leftPadding} x2={width - rightPadding} y1={yForAsymmetry(10)} y2={yForAsymmetry(10)} />
            <line className="chart-asymmetry-threshold problem" x1={leftPadding} x2={width - rightPadding} y1={yForAsymmetry(20)} y2={yForAsymmetry(20)} />
            <text className="chart-axis-label right" x={width - rightPadding + 8} y={yForAsymmetry(10) + 4}>10%</text>
            <text className="chart-axis-label right" x={width - rightPadding + 8} y={yForAsymmetry(20) + 4}>20%</text>
          </>
        ) : null}
        <text className="chart-axis-title left" x={leftPadding} y="15">Nm/kg</text>
        <text className="chart-axis-label left" x={leftPadding - 8} y={plotBottom + 4}>0</text>
        <text className="chart-axis-label left" x={leftPadding - 8} y={yForStrength(strengthMax) + 4}>{formatNumber(strengthMax, 1)}</text>
        <line className="chart-target" x1={leftPadding} x2={width - rightPadding} y1={yForStrength(NORM_NM_PER_KG)} y2={yForStrength(NORM_NM_PER_KG)} />
        <text x={leftPadding + 6} y={yForStrength(NORM_NM_PER_KG) - 7}>{formatNumber(NORM_NM_PER_KG, 1)} Nm/kg</text>
        {visibleSeries.left ? <polyline className="chart-line left" points={pathForStrength("left")} /> : null}
        {visibleSeries.right ? <polyline className="chart-line right" points={pathForStrength("right")} /> : null}
        {visibleSeries.asymmetry ? <polyline className="chart-line asymmetry" points={asymmetryPath} /> : null}
        {points.map((test, index) => {
          const asymmetryValue = getAsymmetryValue(test.asymmetry_pct);

          return (
            <g key={test.id}>
              {visibleSeries.left && test.left_nm_per_kg !== null ? <circle className="chart-dot left" cx={xForIndex(index)} cy={yForStrength(test.left_nm_per_kg)} r="4" /> : null}
              {visibleSeries.right && test.right_nm_per_kg !== null ? <circle className="chart-dot right" cx={xForIndex(index)} cy={yForStrength(test.right_nm_per_kg)} r="4" /> : null}
              {visibleSeries.asymmetry && asymmetryValue !== null ? <circle className={`chart-dot asymmetry ${getAsymmetryTone(test.asymmetry_pct)}`} cx={xForIndex(index)} cy={yForAsymmetry(asymmetryValue)} r="4" /> : null}
              <text className="chart-date" x={xForIndex(index)} y={height - 12}>
                {new Date(`${test.test_date}T00:00:00`).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" })}
              </text>
            </g>
          );
        })}
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
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("measurements");
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [athleteForm, setAthleteForm] = useState<AthleteForm>({ display_name: "", birth_date: "", body_weight_kg: "", shin_length_cm: "33", note: "" });
  const [testForm, setTestForm] = useState<TestForm>({ test_date: todayIsoDate(), right_force_kg: "", left_force_kg: "", body_weight_kg: "", shin_length_cm: "33", note: "" });
  const [editTestForm, setEditTestForm] = useState<TestForm>({ test_date: todayIsoDate(), right_force_kg: "", left_force_kg: "", body_weight_kg: "", shin_length_cm: "33", note: "" });
  const [isSavingAthlete, setIsSavingAthlete] = useState(false);
  const [isSavingTest, setIsSavingTest] = useState(false);
  const [isUpdatingTest, setIsUpdatingTest] = useState(false);

  const isConfigured = hasSupabaseConfig();
  const supabase = useMemo(() => isConfigured ? createBrowserSupabaseClient() : null, [isConfigured]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !session) return;

    Promise.all([
      supabase.from("athletes").select("id,display_name,name_key,note").order("display_name"),
      supabase.from("athlete_profiles").select("id,athlete_id,birth_date,shin_length_cm,body_weight_kg,age,profile_date,updated_at").order("profile_date", { ascending: false, nullsFirst: false }).order("updated_at", { ascending: false, nullsFirst: false }),
      supabase.from("knee_extension_tests").select(TEST_SELECT).order("test_date", { ascending: false }).order("source_row", { ascending: false, nullsFirst: false }),
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
      if (!profilesByAthlete.has(profile.athlete_id)) profilesByAthlete.set(profile.athlete_id, profile);
    });

    kneeTests.forEach((test) => {
      const current = testsByAthlete.get(test.athlete_id) ?? [];
      current.push(test);
      testsByAthlete.set(test.athlete_id, current);
    });

    return athletes.map((athlete) => {
      const tests = (testsByAthlete.get(athlete.id) ?? []).sort((a, b) => {
        const dateDiff = new Date(b.test_date).getTime() - new Date(a.test_date).getTime();
        return dateDiff !== 0 ? dateDiff : (b.source_row ?? 0) - (a.source_row ?? 0);
      });

      return { ...athlete, latestProfile: profilesByAthlete.get(athlete.id) ?? null, latestTest: tests[0] ?? null, tests };
    });
  }, [athleteProfiles, athletes, kneeTests]);

  const filteredAthletes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return athleteOverviews;

    return athleteOverviews.filter((athlete) =>
      [athlete.display_name, athlete.name_key, athlete.note, athlete.latestTest?.test_date]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedQuery)),
    );
  }, [athleteOverviews, query]);

  const selectedAthlete = useMemo(
    () => filteredAthletes.find((athlete) => athlete.id === selectedAthleteId) ?? filteredAthletes[0] ?? athleteOverviews[0] ?? null,
    [athleteOverviews, filteredAthletes, selectedAthleteId],
  );

  useEffect(() => {
    if (!selectedAthlete) return;

    setExpandedTestId(null);
    setEditingTestId(null);
    setTestForm((current) => ({
      ...current,
      body_weight_kg: selectedAthlete.latestProfile?.body_weight_kg?.toString() ?? current.body_weight_kg,
      shin_length_cm: selectedAthlete.latestProfile?.shin_length_cm?.toString() ?? current.shin_length_cm,
    }));
  }, [selectedAthlete]);

  const testedAthleteCount = athleteOverviews.filter((athlete) => athlete.tests.length > 0).length;
  const latestTestDate = kneeTests[0]?.test_date ?? null;
  const latestNormGap = getNormGap(selectedAthlete?.latestTest);

  function updateAthleteForm(key: keyof AthleteForm, value: string) {
    setAthleteForm((current) => ({ ...current, [key]: value }));
  }

  function updateTestForm(key: keyof TestForm, value: string) {
    setTestForm((current) => ({ ...current, [key]: value }));
  }

  function updateEditTestForm(key: keyof TestForm, value: string) {
    setEditTestForm((current) => ({ ...current, [key]: value }));
  }

  function openEditTest(test: KneeExtensionTest) {
    setEditingTestId(test.id);
    setEditTestForm(testToForm(test));
    setExpandedTestId(test.id);
    setActivePanel(null);
    setMobileTab("measurements");
    setMessage("");
  }

  function closeEditTest() {
    setEditingTestId(null);
  }

  function openCreateAthlete() {
    setActivePanel(activePanel === "athlete" ? null : "athlete");
    setMobileTab("client");
  }

  function openCreateTest() {
    setActivePanel(activePanel === "test" ? null : "test");
    setMobileTab("measurements");
  }

  async function handleMagicLink() {
    if (!supabase) return;

    setMessage("Posilam prihlasovaci odkaz...");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    setMessage(error ? error.message : "Hotovo. Zkontroluj e-mail a klikni na prihlasovaci odkaz.");
  }

  async function handleSignOut() {
    await supabase?.auth.signOut();
  }

  async function handleCreateAthlete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !athleteForm.display_name.trim()) return;

    setIsSavingAthlete(true);
    setMessage("");

    const { data: athlete, error } = await supabase
      .from("athletes")
      .insert({ display_name: athleteForm.display_name.trim(), name_key: nameKey(athleteForm.display_name), note: athleteForm.note.trim() || null })
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
      body_weight_kg: athleteForm.body_weight_kg ? toNumber(athleteForm.body_weight_kg) : null,
      shin_length_cm: athleteForm.shin_length_cm ? toNumber(athleteForm.shin_length_cm) : null,
      age: calculateAge(athleteForm.birth_date || null, todayIsoDate()),
      profile_date: todayIsoDate(),
    };

    if (profilePayload.birth_date || profilePayload.body_weight_kg || profilePayload.shin_length_cm) {
      const { data: profile } = await supabase
        .from("athlete_profiles")
        .insert(profilePayload)
        .select("id,athlete_id,birth_date,shin_length_cm,body_weight_kg,age,profile_date,updated_at")
        .single();

      if (profile) setAthleteProfiles((current) => [profile as AthleteProfile, ...current]);
    }

    setIsSavingAthlete(false);
    setAthletes((current) => [athlete as Athlete, ...current]);
    setSelectedAthleteId((athlete as Athlete).id);
    setAthleteForm({ display_name: "", birth_date: "", body_weight_kg: "", shin_length_cm: "33", note: "" });
    setActivePanel(null);
    setMobileTab("measurements");
    setMessage("Klient je zalozeny.");
  }

  async function handleCreateTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedAthlete) return;

    const { payload, error: payloadError } = buildTestPayload(testForm, selectedAthlete, true);
    if (!payload) {
      setMessage(payloadError ?? "Test se nepodarilo pripravit.");
      return;
    }

    setIsSavingTest(true);
    setMessage("");

    const { data, error } = await supabase
      .from("knee_extension_tests")
      .insert({ athlete_id: selectedAthlete.id, ...payload })
      .select(TEST_SELECT)
      .single();

    setIsSavingTest(false);

    if (error || !data) {
      setMessage(error?.message ?? "Test se nepodarilo ulozit.");
      return;
    }

    setKneeTests((current) => [data as KneeExtensionTest, ...current]);
    setExpandedTestId((data as KneeExtensionTest).id);
    setTestForm((current) => ({ ...current, test_date: todayIsoDate(), right_force_kg: "", left_force_kg: "", note: "" }));
    setActivePanel(null);
    setMobileTab("measurements");
    setMessage("Knee extension test je ulozeny.");
  }

  async function handleUpdateTest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedAthlete || !editingTestId) return;

    const { payload, error: payloadError } = buildTestPayload(editTestForm, selectedAthlete);
    if (!payload) {
      setMessage(payloadError ?? "Test se nepodarilo pripravit.");
      return;
    }

    setIsUpdatingTest(true);
    setMessage("");

    const { data, error } = await supabase
      .from("knee_extension_tests")
      .update(payload)
      .eq("id", editingTestId)
      .select(TEST_SELECT)
      .single();

    setIsUpdatingTest(false);

    if (error || !data) {
      setMessage(error?.message ?? "Test se nepodarilo upravit.");
      return;
    }

    setKneeTests((current) => current.map((test) => test.id === editingTestId ? (data as KneeExtensionTest) : test));
    setExpandedTestId(editingTestId);
    setEditingTestId(null);
    setMobileTab("measurements");
    setMessage("Knee extension test je upraveny.");
  }

  async function handleDeleteTest(test: KneeExtensionTest) {
    if (!supabase) return;

    const confirmed = window.confirm(`Opravdu smazat mereni z ${formatDate(test.test_date)}?`);
    if (!confirmed) return;

    setDeletingTestId(test.id);
    setMessage("");

    const { error } = await supabase.from("knee_extension_tests").delete().eq("id", test.id);
    setDeletingTestId(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    setKneeTests((current) => current.filter((item) => item.id !== test.id));
    if (expandedTestId === test.id) setExpandedTestId(null);
    if (editingTestId === test.id) setEditingTestId(null);
    setMessage("Knee extension test je smazany.");
  }

  function renderAthleteForm() {
    return (
      <form className="stack-form compact-form" onSubmit={handleCreateAthlete}>
        <label>Jmeno<input value={athleteForm.display_name} onChange={(event) => updateAthleteForm("display_name", event.target.value)} placeholder="Milos Merta" required /></label>
        <label>Datum narozeni<input type="date" value={athleteForm.birth_date} onChange={(event) => updateAthleteForm("birth_date", event.target.value)} /></label>
        <div className="form-row">
          <label>Vaha kg<input inputMode="decimal" value={athleteForm.body_weight_kg} onChange={(event) => updateAthleteForm("body_weight_kg", event.target.value)} placeholder="82" /></label>
          <label>Bercova paka cm<input inputMode="decimal" value={athleteForm.shin_length_cm} onChange={(event) => updateAthleteForm("shin_length_cm", event.target.value)} placeholder="33" /></label>
        </div>
        <label>Poznamka<textarea value={athleteForm.note} onChange={(event) => updateAthleteForm("note", event.target.value)} placeholder="Interni poznamka" /></label>
        <div className="form-actions">
          <button disabled={isSavingAthlete}>{isSavingAthlete ? "Ukladam..." : "Zalozit klienta"}</button>
          <button className="ghost-button" type="button" onClick={() => setActivePanel(null)}>Zrusit</button>
        </div>
      </form>
    );
  }

  function renderTestForm({
    form,
    onChange,
    onSubmit,
    isSaving,
    submitLabel,
    savingLabel,
    onCancel,
  }: {
    form: TestForm;
    onChange: (key: keyof TestForm, value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    isSaving: boolean;
    submitLabel: string;
    savingLabel: string;
    onCancel?: () => void;
  }) {
    return (
      <form className="stack-form compact-form test-form" onSubmit={onSubmit}>
        <div className="form-row">
          <label>
            Datum mereni
            <input type="date" value={form.test_date} onChange={(event) => onChange("test_date", event.target.value)} required />
          </label>
          <label>
            Vaha pri mereni kg
            <input inputMode="decimal" value={form.body_weight_kg} onChange={(event) => onChange("body_weight_kg", event.target.value)} required />
          </label>
        </div>
        <div className="form-row">
          <label>
            Bercova paka cm
            <input inputMode="decimal" value={form.shin_length_cm} onChange={(event) => onChange("shin_length_cm", event.target.value)} required />
          </label>
          <label>
            Norma
            <input value={`${NORM_NM_PER_KG.toFixed(1)} Nm/kg`} readOnly />
          </label>
        </div>
        <div className="form-row">
          <label>
            Namerena sila leva kg
            <input inputMode="decimal" value={form.left_force_kg} onChange={(event) => onChange("left_force_kg", event.target.value)} placeholder="35" required />
          </label>
          <label>
            Namerena sila prava kg
            <input inputMode="decimal" value={form.right_force_kg} onChange={(event) => onChange("right_force_kg", event.target.value)} placeholder="42" required />
          </label>
        </div>
        <label>
          Poznamka k testu
          <textarea value={form.note} onChange={(event) => onChange("note", event.target.value)} placeholder="Bolest, setup, poznamka k mereni..." />
        </label>
        <div className="form-actions">
          <button disabled={isSaving}>{isSaving ? savingLabel : submitLabel}</button>
          {onCancel ? <button className="ghost-button" type="button" onClick={onCancel}>Zrusit</button> : null}
        </div>
      </form>
    );
  }

  function renderMeasurementDetail(
    test: KneeExtensionTest,
    legGaps: LegNormGap[],
    deficitLegs: LegNormGap[],
    isEditing: boolean,
  ) {
    if (isEditing) {
      return (
        <div>
          <div className="test-detail-header">
            <div>
              <strong>Upravit mereni {formatDate(test.test_date)}</strong>
              <p>Odemceno: datum, vaha pri mereni, bercova paka a namerena sila leve/prave nohy.</p>
            </div>
            <span className="pill">editace</span>
          </div>
          {renderTestForm({
            form: editTestForm,
            onChange: updateEditTestForm,
            onSubmit: handleUpdateTest,
            isSaving: isUpdatingTest,
            submitLabel: "Ulozit zmeny",
            savingLabel: "Ukladam zmeny...",
            onCancel: closeEditTest,
          })}
        </div>
      );
    }

    return (
      <>
        <div className="test-detail-header">
          <div>
            <strong>Detail testu {formatDate(test.test_date)}</strong>
            <p>
              Norma {formatNumber(NORM_NM_PER_KG, 1)} Nm/kg{" · asymetrie "}
              <span className={getAsymmetryClass(test.asymmetry_pct)}>{formatPercent(test.asymmetry_pct)}</span>
              {deficitLegs.length > 0 ? ` · deficit: ${deficitLegs.map((leg) => leg.label.toLowerCase()).join(", ")}` : " · obe nohy splnuji normu"}
            </p>
          </div>
          <span className="pill">cil {formatNumber(legGaps[0]?.targetForceKg, 1, " kg")}</span>
        </div>
        <div className="test-detail-grid">
          {legGaps.map((leg) => (
            <article className={leg.isDeficit ? "leg-detail-card deficit" : "leg-detail-card ok"} key={leg.key}>
              <div className="leg-detail-title"><h3>{leg.label}</h3><span>{leg.isDeficit ? "Pod normou" : "Norma splnena"}</span></div>
              <dl>
                <div><dt>Aktualne</dt><dd>{formatNumber(leg.forceKg, 1, " kg")}</dd></div>
                <div><dt>Nm/kg</dt><dd>{formatNumber(leg.nmPerKg, 2)}</dd></div>
                <div><dt>Cilova sila</dt><dd>{formatNumber(leg.targetForceKg, 1, " kg")}</dd></div>
                <div><dt>Chybi kg</dt><dd>{formatNumber(leg.missingKg, 1, " kg")}</dd></div>
                <div><dt>Chybi %</dt><dd>{formatPercent(leg.missingPct)}</dd></div>
              </dl>
            </article>
          ))}
        </div>
        {test.note ? <p className="test-note">Poznamka: {test.note}</p> : null}
      </>
    );
  }

  if (!isConfigured) {
    return (
      <main className="shell">
        <section className="empty-state">
          <p className="eyebrow">Knee Data</p>
          <h1>Chybi Supabase konfigurace</h1>
          <p>Ve Vercelu dopln <code>NEXT_PUBLIC_SUPABASE_URL</code> a <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">knee.vankotraining.cz</p>
          <h1>Knee extension</h1>
        </div>
        {session ? <button className="ghost-button" onClick={handleSignOut}>Odhlasit</button> : null}
      </header>

      {!session ? (
        <section className="login-panel">
          <div>
            <h2>Prihlaseni trenera</h2>
            <p>Posleme magic link na e-mail s pristupem do Supabase.</p>
          </div>
          <div className="login-row">
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="martin@vankotraining.cz" />
            <button onClick={handleMagicLink}>Poslat link</button>
          </div>
          {message ? <p className="status">{message}</p> : null}
        </section>
      ) : (
        <>
          <section className="stats-grid">
            <div className="metric"><span>Sportovci</span><strong>{athletes.length}</strong></div>
            <div className="metric"><span>Knee testy</span><strong>{kneeTests.length}</strong></div>
            <div className="metric"><span>S testem</span><strong>{testedAthleteCount}</strong></div>
            <div className="metric"><span>Posledni test</span><strong>{formatDate(latestTestDate)}</strong></div>
          </section>

          <section className="mobile-workbench">
            <div className="mobile-client-toolbar">
              <label className="mobile-search">Hledat<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jmeno klienta" /></label>
              <button className="mobile-small-action" type="button" onClick={openCreateAthlete}>+ Klient</button>
              <label className="mobile-client-select">
                Klient
                <select value={selectedAthlete?.id ?? ""} onChange={(event) => setSelectedAthleteId(event.target.value)}>
                  {filteredAthletes.length === 0 ? <option value="">Zadny vysledek</option> : null}
                  {filteredAthletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.display_name}</option>)}
                </select>
              </label>
            </div>

            {selectedAthlete ? (
              <div className="mobile-client-summary">
                <div>
                  <span>Klient</span>
                  <strong>{selectedAthlete.display_name}</strong>
                </div>
                <div>
                  <span>Posledni</span>
                  <strong>{formatDate(selectedAthlete.latestTest?.test_date)}</strong>
                </div>
                <div>
                  <span>Asym</span>
                  <strong><span className={getAsymmetryClass(selectedAthlete.latestTest?.asymmetry_pct)}>{formatPercent(selectedAthlete.latestTest?.asymmetry_pct)}</span></strong>
                </div>
                <div>
                  <span>Chybi</span>
                  <strong>{formatPercent(latestNormGap?.missingPct)}</strong>
                </div>
              </div>
            ) : null}

            <div className="mobile-tabs" role="tablist" aria-label="Mobilni zobrazeni">
              <button className={mobileTab === "measurements" ? "mobile-tab active" : "mobile-tab"} type="button" onClick={() => setMobileTab("measurements")}>Mereni</button>
              <button className={mobileTab === "compare" ? "mobile-tab active" : "mobile-tab"} type="button" onClick={() => setMobileTab("compare")}>Porovnani</button>
              <button className={mobileTab === "client" ? "mobile-tab active" : "mobile-tab"} type="button" onClick={() => setMobileTab("client")}>Klient</button>
            </div>

            {loadState === "idle" ? <p className="status">Nacitam knee data...</p> : null}
            {loadState === "error" ? <p className="status error">{message}</p> : null}
            {loadState === "ready" && filteredAthletes.length === 0 ? <p className="status">Zatim tu neni zadny sportovec pro tento filtr.</p> : null}

            {activePanel === "athlete" ? (
              <section className="panel mobile-form-panel">
                <div className="panel-header"><div><p className="eyebrow">Novy klient</p><h2>Zalozit klienta</h2></div></div>
                {renderAthleteForm()}
              </section>
            ) : null}

            {activePanel === "test" && selectedAthlete ? (
              <section className="panel mobile-form-panel">
                <div className="panel-header"><div><p className="eyebrow">Nove mereni</p><h2>{selectedAthlete.display_name}</h2></div></div>
                {renderTestForm({ form: testForm, onChange: updateTestForm, onSubmit: handleCreateTest, isSaving: isSavingTest, submitLabel: "Ulozit test", savingLabel: "Ukladam...", onCancel: () => setActivePanel(null) })}
              </section>
            ) : null}
          </section>

          <section className="dashboard-layout">
            <section className="panel control-panel athlete-picker-panel desktop-control">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">Klient</p>
                  <h2>Vyber klienta</h2>
                </div>
                <span className="pill">{filteredAthletes.length}</span>
              </div>

              <div className="athlete-picker">
                <label>Hledat<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jmeno, poznamka nebo datum" /></label>
                <label>
                  Vybrany klient
                  <select value={selectedAthlete?.id ?? ""} onChange={(event) => setSelectedAthleteId(event.target.value)}>
                    {filteredAthletes.length === 0 ? <option value="">Zadny vysledek</option> : null}
                    {filteredAthletes.map((athlete) => <option key={athlete.id} value={athlete.id}>{athlete.display_name}</option>)}
                  </select>
                </label>
              </div>

              {loadState === "idle" ? <p className="status">Nacitam knee data...</p> : null}
              {loadState === "error" ? <p className="status error">{message}</p> : null}
              {loadState === "ready" && filteredAthletes.length === 0 ? <p className="status">Zatim tu neni zadny sportovec pro tento filtr.</p> : null}

              {selectedAthlete ? (
                <dl className="selected-athlete-meta">
                  <div><dt>Testy</dt><dd>{selectedAthlete.tests.length}</dd></div>
                  <div><dt>Posledni</dt><dd>{formatDate(selectedAthlete.latestTest?.test_date)}</dd></div>
                  <div><dt>Asym</dt><dd><span className={getAsymmetryClass(selectedAthlete.latestTest?.asymmetry_pct)}>{formatPercent(selectedAthlete.latestTest?.asymmetry_pct)}</span></dd></div>
                </dl>
              ) : null}
            </section>

            <section className="panel control-panel action-panel desktop-control">
              <div className="panel-header">
                <div><p className="eyebrow">Pracovni akce</p><h2>Mereni a klienti</h2></div>
              </div>
              <div className="quick-actions">
                <button className={activePanel === "test" ? "" : "ghost-button"} disabled={!selectedAthlete} type="button" onClick={openCreateTest}>+ Nove mereni</button>
                <button className={activePanel === "athlete" ? "" : "ghost-button"} type="button" onClick={openCreateAthlete}>+ Novy klient</button>
              </div>

              {activePanel === "athlete" ? renderAthleteForm() : null}

              {activePanel === "test" && selectedAthlete
                ? renderTestForm({ form: testForm, onChange: updateTestForm, onSubmit: handleCreateTest, isSaving: isSavingTest, submitLabel: "Ulozit test", savingLabel: "Ukladam...", onCancel: () => setActivePanel(null) })
                : null}

              {!activePanel ? <p className="status compact-hint">Vyber klienta, pridej mereni a hotova mereni uprav primo v historii.</p> : null}
            </section>

            <section className="panel detail-panel">
              <div className="panel-header">
                <div><p className="eyebrow">Knee extension</p><h2>{selectedAthlete ? selectedAthlete.display_name : "Vyber klienta"}</h2></div>
                <span className="pill">{selectedAthlete?.tests.length ?? 0} testu</span>
              </div>

              {selectedAthlete ? (
                <>
                  <section className={mobileTab === "client" ? "mobile-tab-page client-page is-active" : "mobile-tab-page client-page"}>
                    <div className="profile-grid">
                      <div className="profile-metric"><span>Datum narozeni</span><strong>{formatDate(selectedAthlete.latestProfile?.birth_date)}</strong></div>
                      <div className="profile-metric"><span>Vaha</span><strong>{formatNumber(selectedAthlete.latestProfile?.body_weight_kg, 1, " kg")}</strong></div>
                      <div className="profile-metric"><span>Delka berce</span><strong>{formatNumber(selectedAthlete.latestProfile?.shin_length_cm, 1, " cm")}</strong></div>
                      <div className="profile-metric"><span>Vek v profilu</span><strong>{formatNumber(selectedAthlete.latestProfile?.age, 0)}</strong></div>
                    </div>
                  </section>

                  <section className={mobileTab === "compare" ? "mobile-tab-page compare-page is-active" : "mobile-tab-page compare-page"}>
                    {selectedAthlete.latestTest ? (
                      <div className="norm-grid">
                        <div className="profile-metric highlight"><span>Leva</span><strong>{formatNumber(selectedAthlete.latestTest.left_nm_per_kg, 2)}</strong><small>Nm/kg</small></div>
                        <div className="profile-metric highlight"><span>Prava</span><strong>{formatNumber(selectedAthlete.latestTest.right_nm_per_kg, 2)}</strong><small>Nm/kg</small></div>
                        <div className="profile-metric highlight"><span>Asymetrie</span><strong>{formatPercent(selectedAthlete.latestTest.asymmetry_pct)}</strong><small>{formatSide(selectedAthlete.latestTest.weaker_side)} slabsi</small></div>
                        <div className="profile-metric highlight"><span>Chybi do normy</span><strong>{formatPercent(latestNormGap?.missingPct)}</strong><small>{formatNumber(latestNormGap?.missingKg, 1, " kg")} na slabsi strane</small></div>
                      </div>
                    ) : null}

                    <KneeProgressChart tests={selectedAthlete.tests} />
                  </section>

                  <section className={mobileTab === "measurements" ? "mobile-tab-page measurements-page is-active" : "mobile-tab-page measurements-page"}>
                    <div className="mobile-test-list">
                      {selectedAthlete.tests.length === 0 ? <p className="status">Zatim tu neni zadne mereni.</p> : null}
                      {selectedAthlete.tests.map((test) => {
                        const legGaps = getLegNormGaps(test);
                        const deficitLegs = legGaps.filter((leg) => leg.isDeficit);
                        const isExpanded = expandedTestId === test.id;
                        const isEditing = editingTestId === test.id;
                        const isDeleting = deletingTestId === test.id;

                        return (
                          <article className={isEditing ? "measurement-card editing" : "measurement-card"} key={test.id}>
                            <div className="measurement-card-header">
                              <div>
                                <span>Mereni</span>
                                <strong>{formatDate(test.test_date)}</strong>
                              </div>
                              <span className={getAsymmetryClass(test.asymmetry_pct)}>{formatPercent(test.asymmetry_pct)}</span>
                            </div>
                            <dl className="measurement-values">
                              <div><dt>Leva kg</dt><dd>{formatNumber(test.left_force_kg, 1)}</dd></div>
                              <div><dt>Prava kg</dt><dd>{formatNumber(test.right_force_kg, 1)}</dd></div>
                              <div><dt>Leva Nm/kg</dt><dd>{formatNumber(test.left_nm_per_kg, 2)}</dd></div>
                              <div><dt>Prava Nm/kg</dt><dd>{formatNumber(test.right_nm_per_kg, 2)}</dd></div>
                            </dl>
                            <div className="measurement-actions">
                              <button className="detail-button" type="button" onClick={() => setExpandedTestId(isExpanded && !isEditing ? null : test.id)}>{isExpanded && !isEditing ? "Zavrit" : "Detail"}</button>
                              <button className="detail-button" type="button" onClick={() => openEditTest(test)}>{isEditing ? "Odemceno" : "Upravit"}</button>
                              <button className="detail-button danger-button" disabled={isDeleting} type="button" onClick={() => handleDeleteTest(test)}>{isDeleting ? "Mazu..." : "Smazat"}</button>
                            </div>
                            {isExpanded || isEditing ? (
                              <div className="measurement-detail">
                                {renderMeasurementDetail(test, legGaps, deficitLegs, isEditing)}
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>

                    <div className="table-wrap desktop-table">
                      <table>
                        <thead>
                          <tr><th>Datum</th><th>Prava kg</th><th>Leva kg</th><th>Prava Nm/kg</th><th>Leva Nm/kg</th><th>Asym</th><th>Slabsi</th><th>Vek</th><th>Akce</th></tr>
                        </thead>
                        <tbody>
                          {selectedAthlete.tests.map((test) => {
                            const legGaps = getLegNormGaps(test);
                            const deficitLegs = legGaps.filter((leg) => leg.isDeficit);
                            const isExpanded = expandedTestId === test.id;
                            const isEditing = editingTestId === test.id;
                            const isDeleting = deletingTestId === test.id;

                            return (
                              <Fragment key={test.id}>
                                <tr>
                                  <td>{formatDate(test.test_date)}</td>
                                  <td>{formatNumber(test.right_force_kg, 1)}</td>
                                  <td>{formatNumber(test.left_force_kg, 1)}</td>
                                  <td>{formatNumber(test.right_nm_per_kg, 2)}</td>
                                  <td>{formatNumber(test.left_nm_per_kg, 2)}</td>
                                  <td><span className={getAsymmetryClass(test.asymmetry_pct)}>{formatPercent(test.asymmetry_pct)}</span></td>
                                  <td>{formatSide(test.weaker_side)}</td>
                                  <td>{formatNumber(test.age_at_test_years, 1)}</td>
                                  <td>
                                    <div className="table-actions">
                                      <button className="detail-button" type="button" onClick={() => setExpandedTestId(isExpanded && !isEditing ? null : test.id)}>{isExpanded && !isEditing ? "Zavrit" : "Detail"}</button>
                                      <button className="detail-button" type="button" onClick={() => openEditTest(test)}>{isEditing ? "Odemceno" : "Upravit"}</button>
                                      <button className="detail-button danger-button" disabled={isDeleting} type="button" onClick={() => handleDeleteTest(test)}>{isDeleting ? "Mazu..." : "Smazat"}</button>
                                    </div>
                                  </td>
                                </tr>
                                {isExpanded ? (
                                  <tr className="expanded-row">
                                    <td colSpan={9}>{renderMeasurementDetail(test, legGaps, deficitLegs, isEditing)}</td>
                                  </tr>
                                ) : null}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              ) : <p className="status">Zatim neni vybran zadny klient.</p>}
              {message ? <p className="status footer-status">{message}</p> : null}
            </section>
          </section>

          {selectedAthlete && activePanel !== "test" ? (
            <button className="mobile-add-test" type="button" onClick={openCreateTest}>+ Pridat mereni</button>
          ) : null}
        </>
      )}
    </main>
  );
}
