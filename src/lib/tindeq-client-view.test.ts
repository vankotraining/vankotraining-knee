import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildClientChartComment,
  buildClientSideView,
  buildClientSummary,
  buildClientWarningsView,
  clientAccuracyStatus,
  clientMaintenanceStatus,
  clientStabilityStatus,
  clientWarnings,
  CLIENT_VIEW_LABELS,
  DEFAULT_TINDEQ_RESULT_VIEW,
  domainTone,
  overallMaintenance,
  overallStability,
  presentationMeanForce,
} from "./tindeq-client-view.js";

type FixtureOptions = {
  accuracy?: string;
  control?: string;
  maintenance?: string;
  leftMean?: number | null;
  rightMean?: number | null;
  leftCv?: number | null;
  rightCv?: number | null;
  leftTrend?: number | null;
  rightTrend?: number | null;
  flags?: string[];
  warnings?: string[];
};

function fixture(options: FixtureOptions = {}) {
  return {
    analysis: {
      targets: { left: 40, right: 42 },
      repetitions: [{ flags: options.flags ?? [] }],
      summary: {
        left: {
          meanPctTarget: options.leftMean ?? 99,
          medianWithinRepCvPct: options.leftCv ?? 3,
          meanTimeIn5Pct: 90,
          trendPctTargetPerRep: options.leftTrend ?? -0.2,
        },
        right: {
          meanPctTarget: options.rightMean ?? 101,
          medianWithinRepCvPct: options.rightCv ?? 3.5,
          meanTimeIn5Pct: 88,
          trendPctTargetPerRep: options.rightTrend ?? -0.3,
        },
        domains: {
          accuracy: options.accuracy ?? "Dobrá",
          control: options.control ?? "Stabilní",
          maintenance: options.maintenance ?? "Bez poklesu",
        },
      },
      warnings: options.warnings ?? [],
    },
  };
}

test("výchozí režim výsledku je klientský", () => {
  assert.equal(DEFAULT_TINDEQ_RESULT_VIEW, "client");
});

test("přepínač obsahuje oba přístupné režimy bez nové analýzy", () => {
  const source = readFileSync("src/app/tindeq/TindeqSessionResult.tsx", "utf8");
  assert.match(source, /role="tablist"/);
  assert.match(source, /aria-selected=\{viewMode === "client"\}/);
  assert.match(source, /aria-selected=\{viewMode === "trainer"\}/);
  assert.match(source, /setViewMode\("trainer"\)/);
  assert.doesNotMatch(source, /importTindeqArchive/);
});

test("analyzátor pouze orchestruje import a rendering výsledku", () => {
  const source = readFileSync("src/app/tindeq/TindeqAnalyzer.tsx", "utf8");
  assert.match(source, /TindeqSessionResult/);
  assert.doesNotMatch(source, /function OverlayChart/);
  assert.doesNotMatch(source, /function ClientSideCard/);
  assert.doesNotMatch(source, /function TrainerSideCard/);
});

test("vizuální tón vychází z typovaných statusů a kanonického reportu", () => {
  const source = readFileSync("src/app/tindeq/TindeqSessionResult.tsx", "utf8");
  assert.doesNotMatch(source, /toneForStatus/);
  assert.doesNotMatch(source, /toLocaleLowerCase\([^)]*\).*includes/s);
  assert.match(source, /targetAchievementStatus/);
  assert.match(source, /withinRepCvStatus/);
  assert.match(source, /reportFindingStatus/);
  assert.match(source, /buildTindeqReportFromSession/);
  assert.match(source, /TindeqStatusBadge/);
});

test("typované prezentační statusy používají neutral pro nehodnotitelná data", () => {
  assert.deepEqual(clientAccuracyStatus("Dobrá"), { label: "V cíli", tone: "good" });
  assert.deepEqual(clientAccuracyStatus("Ke kontrole"), { label: "Sleduj", tone: "warning" });
  assert.deepEqual(clientAccuracyStatus("Výrazná odchylka"), {
    label: "Mimo cíl",
    tone: "problem",
  });
  assert.deepEqual(clientAccuracyStatus("Nehodnoceno"), {
    label: "Bez hodnocení",
    tone: "neutral",
  });
  assert.deepEqual(clientStabilityStatus(null), { label: "Bez hodnocení", tone: "neutral" });
  assert.deepEqual(clientStabilityStatus(6), { label: "Sleduj", tone: "warning" });
  assert.deepEqual(clientMaintenanceStatus(null), { label: "Bez hodnocení", tone: "neutral" });
  assert.deepEqual(clientMaintenanceStatus(-0.2), {
    label: "Bez výrazného poklesu",
    tone: "good",
  });
  assert.equal(domainTone("Nestabilní"), "problem");
  assert.equal(domainTone("Nehodnoceno"), "neutral");
});

test("klientské názvy nepoužívají dominantní technický žargon", () => {
  assert.deepEqual(CLIENT_VIEW_LABELS, {
    target: "Dosažení cílové síly",
    stability: "Stabilita síly",
    maintenance: "Vývoj série",
    timeInTarget: "Čas v cíli",
    repeatability: "Opakovatelnost",
  });
  const labels = Object.values(CLIENT_VIEW_LABELS).join(" ");
  for (const forbidden of ["CV", "Vzorkování", "lineární trend", "p. b./opak."]) {
    assert.equal(labels.includes(forbidden), false);
  }
});

test("dobrý výsledek vytvoří srozumitelný pozitivní popis série", () => {
  const result = buildClientSummary(fixture());
  assert.equal(result.title, "Velmi dobrá série");
  assert.equal(result.tone, "good");
  assert.match(result.text, /blízko nastavenému cíli/);
  assert.match(result.text, /stabilní/);
  assert.match(result.text, /výrazně nesnižoval/);
});

test("chybějící doména vede k neutrálnímu souhrnu místo falešného problému", () => {
  const result = buildClientSummary(fixture({ maintenance: "Nehodnoceno" }));
  assert.equal(result.title, "Bez úplného hodnocení");
  assert.equal(result.tone, "neutral");
  assert.match(result.text, /nelze spolehlivě vyhodnotit/);
});

test("nedosažení cíle se projeví v hlavním závěru bez diagnózy", () => {
  const result = buildClientSummary(
    fixture({ accuracy: "Výrazná odchylka", leftMean: 82, rightMean: 84 }),
  );
  assert.equal(result.title, "Výraznější odchylka");
  assert.equal(result.tone, "problem");
  assert.match(result.text, /výrazněji odchylovala/);
  assert.doesNotMatch(result.text, /zdrav|diagn|zátěž|připraven/iu);
});

test("vyšší nestabilita rozliší levou a pravou nohu", () => {
  const session = fixture({ leftCv: 9.2, rightCv: 3.1, control: "Nestabilní" });
  assert.equal(overallStability(session), "Vysoká variabilita");
  const comment = buildClientChartComment(session);
  assert.match(comment, /Pravá noha byla stabilnější/);
  assert.match(comment, /levá.*více kolísala/);
});

test("pokles výkonu má klientské slovní hodnocení", () => {
  const session = fixture({ maintenance: "Výrazný pokles", leftTrend: -1.8, rightTrend: -0.2 });
  assert.equal(overallMaintenance(session), "Výraznější pokles");
  assert.match(buildClientSummary(session).text, /výrazněji snižoval/);
  assert.match(buildClientChartComment(session), /u levé nohy.*pokles síly/);
});

test("technická upozornění se převádějí do běžného jazyka", () => {
  const warnings = clientWarnings(
    fixture({
      flags: ["Levá: nedosaženo 95 %", "Pravá: pomalý náběh", "Krátké opakování"],
    }),
  );
  assert.deepEqual(warnings, [
    "Levá noha: cílové síly nebylo dosaženo.",
    "Pravá noha: dosažení cílové síly trvalo déle.",
    "Některé opakování bylo kratší než plán.",
  ]);
});

test("bez upozornění se zobrazí neutrální popis série", () => {
  assert.deepEqual(clientWarnings(fixture()), ["Série proběhla bez výrazných odchylek."]);
  assert.deepEqual(buildClientWarningsView(fixture()), {
    messages: ["Série proběhla bez výrazných odchylek."],
    tone: "neutral",
  });
});

test("chybějící a nevypočitatelná data nevracejí NaN ani Infinity ani červený stav", () => {
  const side = buildClientSideView(0, {
    meanPctTarget: Number.NaN,
    medianWithinRepCvPct: Number.POSITIVE_INFINITY,
    meanTimeIn5Pct: null,
    trendPctTargetPerRep: null,
  });
  assert.equal(side.averageForce, null);
  assert.equal(side.stability, "Bez hodnocení");
  assert.equal(side.stabilityTone, "neutral");
  assert.doesNotMatch(JSON.stringify(side), /NaN|Infinity/);
});

test("prezentační přepočet průměrné síly nemění původní numerické hodnoty", () => {
  const target = 40;
  const meanPct = 98;
  assert.equal(presentationMeanForce(target, meanPct), 39.2);
  assert.equal(target, 40);
  assert.equal(meanPct, 98);
});

test("mobilní klientský obsah zakazuje horizontální overflow mimo graf", () => {
  const css = readFileSync("src/app/tindeq/tindeq.module.css", "utf8");
  assert.match(css, /\.clientPanel\s*\{[^}]*min-width:\s*0/s);
  assert.match(css, /\.result\s*\{[^}]*overflow:\s*hidden/s);
  assert.match(css, /\.chartScroller\s*\{[^}]*overflow-x:\s*auto/s);
  assert.match(css, /@media \(max-width: 720px\)/);

  const metricCss = readFileSync("src/app/tindeq/tindeq-metrics.module.css", "utf8");
  assert.match(metricCss, /\.statusBadge/);
  assert.match(metricCss, /summary:focus-visible/);
  assert.match(metricCss, /@media \(max-width: 720px\)/);
});
