import {
  domainStatus,
  withinRepCvStatus,
  type TindeqPresentationStatus,
  type TindeqPresentationTone,
} from "./tindeq-metric-presentation";

export type ResultViewMode = "client" | "trainer";

export const DEFAULT_TINDEQ_RESULT_VIEW: ResultViewMode = "client";

export const CLIENT_VIEW_LABELS = {
  target: "Dosažení cílové síly",
  stability: "Stabilita síly",
  maintenance: "Vývoj série",
  timeInTarget: "Čas v cíli",
  repeatability: "Opakovatelnost",
} as const;

export type { TindeqPresentationStatus, TindeqPresentationTone };

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
  title: "Velmi dobrá série" | "Dobrá série" | "Série ke kontrole" | "Výraznější odchylka" | "Bez úplného hodnocení";
  text: string;
  tone: TindeqPresentationTone;
};

export type ClientSideView = {
  targetForce: number | null;
  averageForce: number | null;
  targetAchievementPct: number | null;
  timeInTargetPct: number | null;
  stability: string;
  stabilityTone: TindeqPresentationTone;
};

export type ClientWarningsView = {
  messages: string[];
  tone: "neutral" | "warning";
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

export function clientStabilityStatus(cvPct: NullableNumber): TindeqPresentationStatus {
  return withinRepCvStatus(cvPct);
}

export function clientStabilityLabel(cvPct: NullableNumber): string {
  return clientStabilityStatus(cvPct).label;
}

export function clientMaintenanceStatus(
  trendPctTargetPerRep: NullableNumber,
): TindeqPresentationStatus {
  const value = finite(trendPctTargetPerRep);
  if (value === null) return { label: "Bez hodnocení", tone: "neutral" };
  if (value >= -0.75) return { label: "Bez výrazného poklesu", tone: "good" };
  if (value >= -1.5) return { label: "Mírný pokles", tone: "warning" };
  return { label: "Výraznější pokles", tone: "problem" };
}

export function clientMaintenanceLabel(trendPctTargetPerRep: NullableNumber): string {
  return clientMaintenanceStatus(trendPctTargetPerRep).label;
}

export function clientAccuracyStatus(domain: string): TindeqPresentationStatus {
  const status = domainStatus(domain);
  if (status.tone === "neutral") return status;
  if (domain === "Dobrá") return { label: "V cíli", tone: "good" };
  if (domain === "Ke kontrole") return { label: "Sleduj", tone: "warning" };
  if (domain === "Výrazná odchylka") return { label: "Mimo cíl", tone: "problem" };
  return status;
}

export function clientAccuracyLabel(domain: string): string {
  return clientAccuracyStatus(domain).label;
}

export function domainTone(domain: string): TindeqPresentationTone {
  return domainStatus(domain).tone;
}

function domainSeverity(domain: string, kind: "accuracy" | "control" | "maintenance"): 0 | 1 | 2 | null {
  if (domain === "Nehodnoceno") return null;
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
  const evaluable = severities.filter((value): value is 0 | 1 | 2 => value !== null);
  const warningCount = evaluable.filter((value) => value === 1).length;
  const hasSevere = evaluable.includes(2);
  const hasMissing = evaluable.length !== severities.length;

  let title: ClientSummary["title"];
  let tone: TindeqPresentationTone;
  if (hasSevere) {
    title = "Výraznější odchylka";
    tone = "problem";
  } else if (hasMissing) {
    title = "Bez úplného hodnocení";
    tone = "neutral";
  } else if (warningCount >= 2) {
    title = "Série ke kontrole";
    tone = "warning";
  } else if (warningCount === 1) {
    title = "Dobrá série";
    tone = "good";
  } else {
    title = "Velmi dobrá série";
    tone = "good";
  }

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
          : "vývoj série nelze spolehlivě vyhodnotit";

  const text = `${targetText}, ${stabilityText} a ${maintenanceText}.`;
  return { title, text: text.charAt(0).toUpperCase() + text.slice(1), tone };
}

export function buildClientSideView(
  targetForce: NullableNumber,
  summary: ClientSideSummary,
): ClientSideView {
  const stability = clientStabilityStatus(summary.medianWithinRepCvPct);
  return {
    targetForce: finite(targetForce),
    averageForce: presentationMeanForce(targetForce, summary.meanPctTarget),
    targetAchievementPct: finite(summary.meanPctTarget),
    timeInTargetPct: finite(summary.meanTimeIn5Pct),
    stability: stability.label,
    stabilityTone: stability.tone,
  };
}

export function overallTargetAchievement(session: ClientViewSession): number | null {
  return average([
    session.analysis.summary.left.meanPctTarget,
    session.analysis.summary.right.meanPctTarget,
  ]);
}

export function overallStabilityStatus(session: ClientViewSession): TindeqPresentationStatus {
  const values = [
    finite(session.analysis.summary.left.medianWithinRepCvPct),
    finite(session.analysis.summary.right.medianWithinRepCvPct),
  ].filter((value): value is number => value !== null);
  return clientStabilityStatus(values.length > 0 ? Math.max(...values) : null);
}

export function overallStability(session: ClientViewSession): string {
  return overallStabilityStatus(session).label;
}

export function overallMaintenanceStatus(session: ClientViewSession): TindeqPresentationStatus {
  const values = [
    finite(session.analysis.summary.left.trendPctTargetPerRep),
    finite(session.analysis.summary.right.trendPctTargetPerRep),
  ].filter((value): value is number => value !== null);
  return clientMaintenanceStatus(values.length > 0 ? Math.min(...values) : null);
}

export function overallMaintenance(session: ClientViewSession): string {
  return overallMaintenanceStatus(session).label;
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

export function buildClientWarningsView(session: ClientViewSession): ClientWarningsView {
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
  return unique.length > 0
    ? { messages: unique, tone: "warning" }
    : { messages: ["Série proběhla bez výrazných odchylek."], tone: "neutral" };
}

export function clientWarnings(session: ClientViewSession): string[] {
  return buildClientWarningsView(session).messages;
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