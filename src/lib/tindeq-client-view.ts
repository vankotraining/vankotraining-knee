export type ResultViewMode = "client" | "trainer";

export const DEFAULT_TINDEQ_RESULT_VIEW: ResultViewMode = "client";

export const CLIENT_VIEW_LABELS = {
  target: "Dosažení cílové síly",
  stability: "Stabilita síly",
  maintenance: "Udržení výkonu",
  timeInTarget: "Čas v cíli",
  repeatability: "Opakovatelnost",
} as const;

type NullableNumber = number | null | undefined;

type ClientSideSummary = {
  meanPctTarget: NullableNumber;
  medianWithinRepCvPct: NullableNumber;
  meanTimeIn5Pct: NullableNumber;
  trendPctTargetPerRep: NullableNumber;
};

type ClientViewSession = {
  analysis: {
    targets: { left: NullableNumber; right: NullableNumber };
    repetitions: Array<{ flags: string[] }>;
    summary: {
      left: ClientSideSummary;
      right: ClientSideSummary;
      domains: {
        accuracy: string;
        control: string;
        maintenance: string;
      };
    };
    warnings: string[];
  };
};

export type ClientSummary = {
  title: "Velmi dobrá série" | "Dobrá série" | "Série ke kontrole" | "Výraznější odchylka";
  text: string;
};

export type ClientSideView = {
  targetForce: number | null;
  averageForce: number | null;
  targetAchievementPct: number | null;
  timeInTargetPct: number | null;
  stability: string;
};

function finite(value: NullableNumber): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function average(values: NullableNumber[]): number | null {
  const valid = values.map(finite).filter((value): value is number => value !== null);
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

export function presentationMeanForce(
  targetForce: NullableNumber,
  meanPctTarget: NullableNumber,
): number | null {
  const target = finite(targetForce);
  const percentage = finite(meanPctTarget);
  if (target === null || percentage === null) return null;
  return (target * percentage) / 100;
}

export function clientStabilityLabel(cvPct: NullableNumber): string {
  const value = finite(cvPct);
  if (value === null) return "Nelze vyhodnotit";
  if (value <= 3) return "Velmi stabilní";
  if (value <= 5) return "Stabilní";
  if (value <= 8) return "Mírně kolísavá";
  return "Výrazně kolísavá";
}

export function clientMaintenanceLabel(trendPctTargetPerRep: NullableNumber): string {
  const value = finite(trendPctTargetPerRep);
  if (value === null) return "Nelze vyhodnotit";
  if (value >= -0.75) return "Bez výrazného poklesu";
  if (value >= -1.5) return "Mírný pokles";
  return "Výraznější pokles";
}

export function clientAccuracyLabel(domain: string): string {
  if (domain === "Dobrá") return "Velmi dobře";
  if (domain === "Ke kontrole") return "Ke kontrole";
  if (domain === "Výrazná odchylka") return "Výraznější odchylka";
  return "Nelze vyhodnotit";
}

function domainSeverity(domain: string, kind: "accuracy" | "control" | "maintenance") {
  if (
    (kind === "accuracy" && domain === "Dobrá") ||
    (kind === "control" && domain === "Stabilní") ||
    (kind === "maintenance" && domain === "Bez poklesu")
  ) {
    return 0;
  }
  if (
    (kind === "accuracy" && domain === "Výrazná odchylka") ||
    (kind === "control" && domain === "Nestabilní") ||
    (kind === "maintenance" && domain === "Výrazný pokles")
  ) {
    return 2;
  }
  return 1;
}

export function buildClientSummary(session: ClientViewSession): ClientSummary {
  const { accuracy, control, maintenance } = session.analysis.summary.domains;
  const severities = [
    domainSeverity(accuracy, "accuracy"),
    domainSeverity(control, "control"),
    domainSeverity(maintenance, "maintenance"),
  ];
  const warningCount = severities.filter((value) => value === 1).length;
  const hasSevere = severities.includes(2);

  let title: ClientSummary["title"];
  if (hasSevere) title = "Výraznější odchylka";
  else if (warningCount >= 2) title = "Série ke kontrole";
  else if (warningCount === 1) title = "Dobrá série";
  else title = "Velmi dobrá série";

  const targetText =
    accuracy === "Dobrá"
      ? "Síla byla blízko nastavenému cíli"
      : accuracy === "Ke kontrole"
        ? "síla se od nastaveného cíle místy odchylovala"
        : accuracy === "Výrazná odchylka"
          ? "síla se od nastaveného cíle výrazněji odchylovala"
          : "dosažení cíle nelze spolehlivě vyhodnotit";
  const stabilityText =
    control === "Stabilní"
      ? "průběh byl stabilní"
      : control === "Ke kontrole"
        ? "síla během části série více kolísala"
        : control === "Nestabilní"
          ? "síla během série výrazněji kolísala"
          : "stabilitu nelze spolehlivě vyhodnotit";
  const maintenanceText =
    maintenance === "Bez poklesu"
      ? "výkon se během série výrazně nesnižoval"
      : maintenance === "Mírný pokles"
        ? "v závěru byl patrný mírný pokles výkonu"
        : maintenance === "Výrazný pokles"
          ? "výkon se během série výrazněji snižoval"
          : "udržení výkonu nelze spolehlivě vyhodnotit";

  const text = `${targetText}, ${stabilityText} a ${maintenanceText}.`;
  return { title, text: text.charAt(0).toUpperCase() + text.slice(1) };
}

export function buildClientSideView(
  targetForce: NullableNumber,
  summary: ClientSideSummary,
): ClientSideView {
  return {
    targetForce: finite(targetForce),
    averageForce: presentationMeanForce(targetForce, summary.meanPctTarget),
    targetAchievementPct: finite(summary.meanPctTarget),
    timeInTargetPct: finite(summary.meanTimeIn5Pct),
    stability: clientStabilityLabel(summary.medianWithinRepCvPct),
  };
}

export function overallTargetAchievement(session: ClientViewSession): number | null {
  return average([
    session.analysis.summary.left.meanPctTarget,
    session.analysis.summary.right.meanPctTarget,
  ]);
}

export function overallStability(session: ClientViewSession): string {
  const values = [
    finite(session.analysis.summary.left.medianWithinRepCvPct),
    finite(session.analysis.summary.right.medianWithinRepCvPct),
  ].filter((value): value is number => value !== null);
  return clientStabilityLabel(values.length > 0 ? Math.max(...values) : null);
}

export function overallMaintenance(session: ClientViewSession): string {
  const values = [
    finite(session.analysis.summary.left.trendPctTargetPerRep),
    finite(session.analysis.summary.right.trendPctTargetPerRep),
  ].filter((value): value is number => value !== null);
  return clientMaintenanceLabel(values.length > 0 ? Math.min(...values) : null);
}

function sideName(prefix: string): string {
  return prefix.startsWith("Levá") ? "Levá noha" : "Pravá noha";
}

function translateFlag(flag: string): string {
  if (flag === "Krátké opakování") return "Některé opakování bylo kratší než plán.";
  if (flag === "Neúplný konec") return "Poslední opakování nebylo zaznamenáno celé.";
  if (flag.includes(": nedosaženo 95 %")) {
    return `${sideName(flag)}: cílové síly nebylo dosaženo.`;
  }
  if (flag.includes(": pomalý náběh")) {
    return `${sideName(flag)}: dosažení cílové síly trvalo déle.`;
  }
  if (flag.includes(": nestabilní")) {
    return `${sideName(flag)}: síla během opakování více kolísala.`;
  }
  return flag;
}

export function clientWarnings(session: ClientViewSession): string[] {
  const repetitionMessages = session.analysis.repetitions.flatMap((repetition) =>
    repetition.flags.map(translateFlag),
  );
  const hasSlowOnsetDetail = repetitionMessages.some((message) =>
    message.includes("dosažení cílové síly trvalo déle"),
  );
  const summaryMessages = session.analysis.warnings
    .filter(
      (warning) =>
        !(
          hasSlowOnsetDetail &&
          warning.includes("Alespoň jedna strana má v některém opakování pomalý náběh")
        ),
    )
    .map((warning) => {
      if (warning.includes("neúplný pracovní interval")) {
        return "Poslední opakování nebylo zaznamenáno celé.";
      }
      return warning;
    });
  const unique = [...new Set([...summaryMessages, ...repetitionMessages])];
  return unique.length > 0 ? unique : ["Série proběhla bez výrazných odchylek."];
}

export function buildClientChartComment(session: ClientViewSession): string {
  const left = session.analysis.summary.left;
  const right = session.analysis.summary.right;
  const leftCv = finite(left.medianWithinRepCvPct);
  const rightCv = finite(right.medianWithinRepCvPct);
  const leftTarget = finite(left.meanPctTarget);
  const rightTarget = finite(right.meanPctTarget);
  const sentences: string[] = [];

  if (
    leftTarget !== null &&
    rightTarget !== null &&
    leftTarget >= 95 &&
    leftTarget <= 105 &&
    rightTarget >= 95 &&
    rightTarget <= 105
  ) {
    sentences.push("Obě nohy se většinu času držely blízko nastaveného cíle.");
  } else if (leftTarget !== null && rightTarget !== null) {
    const fartherSide = Math.abs(leftTarget - 100) > Math.abs(rightTarget - 100) ? "Levá" : "Pravá";
    sentences.push(`${fartherSide} noha se od nastaveného cíle odchylovala více.`);
  }

  if (leftCv !== null && rightCv !== null && Math.abs(leftCv - rightCv) >= 2) {
    const lessStable = leftCv > rightCv ? "levá" : "pravá";
    const moreStable = lessStable === "levá" ? "Pravá" : "Levá";
    sentences.push(`${moreStable} noha byla stabilnější, ${lessStable} během některých opakování více kolísala.`);
  }

  const leftTrend = finite(left.trendPctTargetPerRep);
  const rightTrend = finite(right.trendPctTargetPerRep);
  const decliningSides = [
    leftTrend !== null && leftTrend < -0.75 ? "levé" : null,
    rightTrend !== null && rightTrend < -0.75 ? "pravé" : null,
  ].filter((value): value is string => value !== null);
  if (decliningSides.length === 2) {
    sentences.push("V závěru série byl u obou nohou vidět pokles síly.");
  } else if (decliningSides.length === 1) {
    sentences.push(`V závěru série byl u ${decliningSides[0]} nohy vidět pokles síly.`);
  }

  if (sentences.length === 0) {
    return "Průběh série nelze z dostupných dat jednoduše shrnout.";
  }
  return sentences.slice(0, 2).join(" ");
}
