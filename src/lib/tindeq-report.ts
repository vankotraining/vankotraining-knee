import type { RepetitionResult, SideSummary, TindeqSession } from "./tindeq-browser.js";
import type { StoredRepetitionResult, StoredTindeqSession } from "./tindeq-persistence.js";

export const TINDEQ_REPORT_VERSION = "tindeq-report-v1";
export type TindeqReportStatus = "splněno" | "hraniční" | "nesplněno" | "technicky nehodnotitelné";
export type TindeqRecommendationAction =
  | "progrese"
  | "zachování"
  | "regrese"
  | "opakování měření"
  | "technická úprava provedení"
  | "doplnění údajů před rozhodnutím";
export type TindeqReportClinicalContext = {
  kneeAngleDegrees?: number | null;
  painBefore?: number | null;
  painDuring?: number | null;
  painAfter?: number | null;
};
export type TindeqReportEvidence = { metric: string; value: string; rule: string };
export type TindeqReportFinding = {
  status: TindeqReportStatus;
  title: string;
  summary: string;
  evidence: TindeqReportEvidence[];
};
export type TindeqReportSide = {
  targetForceKg: number | null;
  previousMaxKg: number | null;
  averageForceKg: number | null;
  targetAchievementPct: number | null;
  timeInTargetPct: number | null;
  successfulRepetitions: number;
  evaluableRepetitions: number;
  successRatePct: number | null;
  withinRepCvPct: number | null;
  betweenRepCvPct: number | null;
  undershootRepetitions: number;
  overshootRepetitions: number;
  meanOnsetTo95Seconds: number | null;
  trendPctTargetPerRep: number | null;
  firstToLastChangePctPoints: number | null;
  timeInTargetChangePctPoints: number | null;
};
export type TindeqCanonicalReport = {
  version: typeof TINDEQ_REPORT_VERSION;
  context: {
    athleteName: string | null;
    measuredAt: string;
    protocol: string | null;
    kneeAngleDegrees: number | null;
    previousMaxLeftKg: number | null;
    previousMaxRightKg: number | null;
    prescribedPct: number | null;
    targetForceLeftKg: number | null;
    targetForceRightKg: number | null;
    expectedRepetitions: number;
    detectedRepetitions: number;
    painBefore: number | null;
    painDuring: number | null;
    painAfter: number | null;
    missingData: string[];
  };
  performance: {
    left: TindeqReportSide;
    right: TindeqReportSide;
    normalizedSideDifferencePctPoints: number | null;
    averageForceDifferenceKg: number | null;
    finding: TindeqReportFinding;
  };
  control: {
    meanAbsOnsetDifferenceSeconds: number | null;
    repetitionsWithTechnicalFlags: number;
    technicalFlagRatePct: number | null;
    finding: TindeqReportFinding;
  };
  fatigue: {
    pattern: "bez významného poklesu" | "výkonový průběh odpovídá běžné únavě" | "výrazný pokles výkonu" | "nekonzistentní nebo technický průběh" | "nehodnotitelné";
    finding: TindeqReportFinding;
  };
  reaction: { finding: TindeqReportFinding };
  interpretation: {
    status: TindeqReportStatus;
    headline: string;
    summary: string;
    findings: TindeqReportFinding[];
  };
  recommendation: { action: TindeqRecommendationAction; summary: string; reasons: string[] };
  limitations: string[];
};

type SideRep = {
  meanForceKg: number | null;
  meanPctTarget: number | null;
  cvPct: number | null;
  timeIn5Pct: number | null;
  timeTo95Seconds: number | null;
};
type Rep = { incompleteEnd: boolean; flags: string[]; left: SideRep; right: SideRep };
type Source = {
  athleteName: string | null;
  measuredAt: string;
  protocol: string | null;
  previousMaxLeftKg: number | null;
  previousMaxRightKg: number | null;
  prescribedPct: number | null;
  targetForceLeftKg: number | null;
  targetForceRightKg: number | null;
  expectedRepetitions: number;
  detectedRepetitions: number;
  leftSummary: SideSummary;
  rightSummary: SideSummary;
  meanAbsOnsetDifferenceSeconds: number | null;
  repetitions: Rep[];
  warnings: string[];
  clinicalContext: TindeqReportClinicalContext;
};

type NormalizedClinicalContext = Required<{ [K in keyof TindeqReportClinicalContext]: number | null }>;
const LOW = 95;
const HIGH = 105;

function finite(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
function round(value: number | null, digits = 1): number | null {
  if (value === null) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
function mean(values: Array<number | null | undefined>): number | null {
  const valid = values.map(finite).filter((value): value is number => value !== null);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
}
function percent(part: number, whole: number): number | null {
  return whole > 0 ? round((part / whole) * 100, 0) : null;
}
function metric(value: number | null, suffix: string, digits = 1) {
  return value === null ? "neuvedeno" : `${value.toFixed(digits).replace(".", ",")}${suffix}`;
}
function forceToKg(value: number | null | undefined, unit: string): number | null {
  const number = finite(value);
  if (number === null) return null;
  const key = unit.trim().toLowerCase().replace(/\s+/g, "");
  if (["kg", "kgf", "kilogram", "kilograms"].includes(key)) return number;
  if (["n", "newton", "newtons"].includes(key)) return number / 9.80665;
  if (["lb", "lbs", "lbf", "pound", "pounds"].includes(key)) return number * 0.45359237;
  return null;
}
function context(value?: TindeqReportClinicalContext | null): NormalizedClinicalContext {
  const pain = (input: number | null | undefined) => {
    const number = finite(input);
    return number !== null && number >= 0 && number <= 10 ? number : null;
  };
  return {
    kneeAngleDegrees: finite(value?.kneeAngleDegrees),
    painBefore: pain(value?.painBefore),
    painDuring: pain(value?.painDuring),
    painAfter: pain(value?.painAfter),
  };
}
function currentRep(rep: RepetitionResult, unit: string): Rep {
  const side = (value: RepetitionResult["left"]): SideRep => ({
    meanForceKg: forceToKg(value.meanForce, unit),
    meanPctTarget: finite(value.meanPctTarget),
    cvPct: finite(value.cvPct),
    timeIn5Pct: finite(value.timeIn5Pct),
    timeTo95Seconds: finite(value.timeTo95Seconds),
  });
  return { incompleteEnd: rep.incompleteEnd, flags: [...rep.flags], left: side(rep.left), right: side(rep.right) };
}
function storedRep(rep: StoredRepetitionResult): Rep {
  const side = (value: StoredRepetitionResult["left"]): SideRep => ({
    meanForceKg: finite(value.meanForceKg),
    meanPctTarget: finite(value.meanPctTarget),
    cvPct: finite(value.cvPct),
    timeIn5Pct: finite(value.timeIn5Pct),
    timeTo95Seconds: finite(value.timeTo95Seconds),
  });
  return { incompleteEnd: rep.incompleteEnd, flags: [...rep.flags], left: side(rep.left), right: side(rep.right) };
}
function worst(statuses: TindeqReportStatus[]): TindeqReportStatus {
  if (statuses.includes("technicky nehodnotitelné")) return "technicky nehodnotitelné";
  if (statuses.includes("nesplněno")) return "nesplněno";
  if (statuses.includes("hraniční")) return "hraniční";
  return "splněno";
}

function sideReport(
  key: "left" | "right",
  targetForceKg: number | null,
  previousMaxKg: number | null,
  summary: SideSummary,
  reps: Rep[],
): TindeqReportSide {
  const values = reps.map((rep) => rep[key]);
  const evaluable = values.filter((rep) => rep.meanPctTarget !== null && rep.timeIn5Pct !== null);
  const successful = evaluable.filter((rep) =>
    (rep.meanPctTarget as number) >= LOW &&
    (rep.meanPctTarget as number) <= HIGH &&
    (rep.timeIn5Pct as number) >= 60,
  );
  const firstTime = evaluable[0]?.timeIn5Pct ?? null;
  const lastTime = evaluable.at(-1)?.timeIn5Pct ?? null;
  const summaryPct = finite(summary.meanPctTarget);
  const averageForce = mean(values.map((rep) => rep.meanForceKg)) ??
    (targetForceKg !== null && summaryPct !== null ? targetForceKg * summaryPct / 100 : null);
  return {
    targetForceKg: round(targetForceKg),
    previousMaxKg: round(previousMaxKg),
    averageForceKg: round(averageForce),
    targetAchievementPct: round(summaryPct),
    timeInTargetPct: round(finite(summary.meanTimeIn5Pct), 0),
    successfulRepetitions: successful.length,
    evaluableRepetitions: evaluable.length,
    successRatePct: percent(successful.length, evaluable.length),
    withinRepCvPct: round(finite(summary.medianWithinRepCvPct)),
    betweenRepCvPct: round(finite(summary.betweenRepCvPct)),
    undershootRepetitions: values.filter((rep) => rep.meanPctTarget !== null && rep.meanPctTarget < LOW).length,
    overshootRepetitions: values.filter((rep) => rep.meanPctTarget !== null && rep.meanPctTarget > HIGH).length,
    meanOnsetTo95Seconds: round(mean(values.map((rep) => rep.timeTo95Seconds)), 2),
    trendPctTargetPerRep: round(finite(summary.trendPctTargetPerRep), 2),
    firstToLastChangePctPoints: round(finite(summary.firstToLastChangePctPoints)),
    timeInTargetChangePctPoints: firstTime !== null && lastTime !== null ? round(lastTime - firstTime) : null,
  };
}
function performanceStatus(side: TindeqReportSide): TindeqReportStatus {
  const { targetAchievementPct: target, timeInTargetPct: time, successRatePct: success } = side;
  if (target === null || time === null || success === null) return "technicky nehodnotitelné";
  if (target >= 95 && target <= 105 && time >= 60 && success >= 70) return "splněno";
  if (target >= 90 && target <= 110 && time >= 40 && success >= 50) return "hraniční";
  return "nesplněno";
}
function performanceFinding(left: TindeqReportSide, right: TindeqReportSide): TindeqReportFinding {
  const status = worst([performanceStatus(left), performanceStatus(right)]);
  return {
    status,
    title: "Dosažení předepsaného cíle",
    summary: status === "splněno"
      ? "Obě strany dosáhly cíle s dostatečným časem v pásmu a většinou úspěšných opakování."
      : status === "hraniční"
        ? "Alespoň jedna strana je blízko cíli, ale má omezený čas v pásmu nebo nižší úspěšnost."
        : status === "nesplněno"
          ? "Alespoň jedna strana nesplnila pracovní hranici výkonu."
          : "Chybí klíčová výkonová metrika.",
    evidence: [left, right].map((side, index) => ({
      metric: index === 0 ? "Levá strana" : "Pravá strana",
      value: `${metric(side.targetAchievementPct, " %", 0)}, ${metric(side.timeInTargetPct, " % času v pásmu", 0)}, ${metric(side.successRatePct, " % úspěšných opakování", 0)}`,
      rule: "Splněno: 95–105 % cíle, ≥60 % času v pásmu a ≥70 % úspěšných opakování.",
    })),
  };
}
function controlStatus(side: TindeqReportSide): TindeqReportStatus {
  if (side.withinRepCvPct === null || side.betweenRepCvPct === null) return "technicky nehodnotitelné";
  if (side.withinRepCvPct <= 5 && side.betweenRepCvPct <= 8) return "splněno";
  if (side.withinRepCvPct <= 8 && side.betweenRepCvPct <= 12) return "hraniční";
  return "nesplněno";
}
function controlFinding(left: TindeqReportSide, right: TindeqReportSide, flagRate: number | null): TindeqReportFinding {
  let status = worst([controlStatus(left), controlStatus(right)]);
  if (flagRate !== null && flagRate > 30) status = "nesplněno";
  else if (flagRate !== null && flagRate > 10 && status === "splněno") status = "hraniční";
  return {
    status,
    title: "Kontrola a stabilita",
    summary: status === "splněno"
      ? "Síla byla stabilní uvnitř kontrakcí i mezi opakováními."
      : status === "hraniční"
        ? "Variabilita nebo technická upozornění vyžadují kontrolu provedení."
        : status === "nesplněno"
          ? "Průběh je příliš variabilní nebo obsahuje častá technická upozornění."
          : "Stabilitu nelze spolehlivě vyhodnotit.",
    evidence: [
      { metric: "Levá variabilita", value: `${metric(left.withinRepCvPct, " % CV uvnitř")}, ${metric(left.betweenRepCvPct, " % CV mezi")}`, rule: "Splněno: CV uvnitř ≤5 % a mezi ≤8 %." },
      { metric: "Pravá variabilita", value: `${metric(right.withinRepCvPct, " % CV uvnitř")}, ${metric(right.betweenRepCvPct, " % CV mezi")}`, rule: "Hraniční: CV uvnitř ≤8 % a mezi ≤12 %." },
      { metric: "Opakování s upozorněním", value: metric(flagRate, " %", 0), rule: "Více než 30 % je nesplněno." },
    ],
  };
}
function fatigueFinding(left: TindeqReportSide, right: TindeqReportSide, control: TindeqReportStatus) {
  const worstTrend = Math.min(...[left.trendPctTargetPerRep, right.trendPctTargetPerRep].filter((v): v is number => v !== null));
  const worstChange = Math.min(...[left.firstToLastChangePctPoints, right.firstToLastChangePctPoints].filter((v): v is number => v !== null));
  const timeValues = [left.timeInTargetChangePctPoints, right.timeInTargetChangePctPoints].filter((v): v is number => v !== null);
  const worstTime = timeValues.length ? Math.min(...timeValues) : null;
  let status: TindeqReportStatus;
  let pattern: TindeqCanonicalReport["fatigue"]["pattern"];
  if (!Number.isFinite(worstTrend) || !Number.isFinite(worstChange)) [status, pattern] = ["technicky nehodnotitelné", "nehodnotitelné"];
  else if (control === "nesplněno") [status, pattern] = ["hraniční", "nekonzistentní nebo technický průběh"];
  else if (worstTrend >= -0.75 && worstChange >= -5 && (worstTime === null || worstTime >= -15)) [status, pattern] = ["splněno", "bez významného poklesu"];
  else if (worstTrend >= -1.5 && worstChange >= -15 && (worstTime === null || worstTime >= -30)) [status, pattern] = ["hraniční", "výkonový průběh odpovídá běžné únavě"];
  else [status, pattern] = ["nesplněno", "výrazný pokles výkonu"];
  const summary = pattern === "bez významného poklesu"
    ? "Výkon a čas v cílovém pásmu se zásadně nezhoršovaly."
    : pattern === "výkonový průběh odpovídá běžné únavě"
      ? "Pokles je mírný a při zachované kontrole odpovídá očekávané únavě."
      : pattern === "výrazný pokles výkonu"
        ? "Pokles přesahuje pracovní hranice běžné únavy."
        : pattern === "nekonzistentní nebo technický průběh"
          ? "Kvůli vysoké variabilitě nelze pokles bezpečně připsat únavě."
          : "Trend nelze vypočítat.";
  return {
    pattern,
    finding: {
      status,
      title: "Únava a vývoj série",
      summary,
      evidence: [
        { metric: "Nejhorší trend", value: metric(round(Number.isFinite(worstTrend) ? worstTrend : null, 2), " p. b./opak.", 2), rule: "Bez poklesu ≥−0,75; běžná únava ≥−1,5." },
        { metric: "První–poslední", value: metric(round(Number.isFinite(worstChange) ? worstChange : null), " p. b."), rule: "Bez poklesu ≥−5; běžná únava ≥−15." },
        { metric: "Změna času v pásmu", value: metric(round(worstTime), " p. b."), rule: "Pokles pod −30 podporuje nesplnění." },
      ],
    } satisfies TindeqReportFinding,
  };
}
function reactionFinding(clinical: NormalizedClinicalContext): TindeqReportFinding {
  const complete = clinical.painBefore !== null && clinical.painDuring !== null && clinical.painAfter !== null;
  if (!complete) return {
    status: "technicky nehodnotitelné",
    title: "Reakce kolene",
    summary: "Bolestivou reakci nelze posoudit, protože chybí bolest před, během nebo po cvičení.",
    evidence: [{ metric: "Bolest před / během / po", value: `${metric(clinical.painBefore, "/10", 0)} / ${metric(clinical.painDuring, "/10", 0)} / ${metric(clinical.painAfter, "/10", 0)}`, rule: "Potřebné jsou všechny tři hodnoty 0–10." }],
  };
  const increase = clinical.painAfter! - clinical.painBefore!;
  const concern = clinical.painDuring! >= 5 || (clinical.painAfter! >= 4 && increase >= 2);
  const acceptable = clinical.painDuring! <= 3 && increase <= 1;
  const status: TindeqReportStatus = concern ? "nesplněno" : acceptable ? "splněno" : "hraniční";
  return {
    status,
    title: "Reakce kolene",
    summary: status === "splněno"
      ? "Bolest během a po cvičení zůstala v pracovním tolerančním pravidle."
      : status === "hraniční"
        ? "Bolestivá reakce je zvýšená, ale nepřekročila pravidlo pro automatickou regresi."
        : "Bolest během nebo po cvičení překročila pracovní pravidlo pro regresi.",
    evidence: [
      { metric: "Bolest před / během / po", value: `${clinical.painBefore}/10 / ${clinical.painDuring}/10 / ${clinical.painAfter}/10`, rule: "Splněno: během ≤3/10 a po nejvýše +1 bod." },
      { metric: "Změna po cvičení", value: `${increase >= 0 ? "+" : ""}${increase} bodu`, rule: "Nesplněno: během ≥5/10 nebo po ≥4/10 a vzestup ≥2." },
    ],
  };
}

function build(source: Source): TindeqCanonicalReport {
  const clinical = context(source.clinicalContext);
  const left = sideReport("left", source.targetForceLeftKg, source.previousMaxLeftKg, source.leftSummary, source.repetitions);
  const right = sideReport("right", source.targetForceRightKg, source.previousMaxRightKg, source.rightSummary, source.repetitions);
  const performance = performanceFinding(left, right);
  const flagged = source.repetitions.filter((rep) => rep.flags.length > 0).length;
  const flagRate = percent(flagged, source.repetitions.length);
  const control = controlFinding(left, right, flagRate);
  const fatigue = fatigueFinding(left, right, control.status);
  const reaction = reactionFinding(clinical);
  const minimumDetected = Math.max(3, Math.ceil(source.expectedRepetitions * 0.75));
  const incomplete = source.repetitions.filter((rep) => rep.incompleteEnd).length;
  const technicalReasons = [
    ...(source.detectedRepetitions < minimumDetected ? [`Detekováno pouze ${source.detectedRepetitions} z ${source.expectedRepetitions} opakování.`] : []),
    ...(source.repetitions.length && incomplete / source.repetitions.length > 0.25 ? ["Více než čtvrtina opakování má neúplný konec."] : []),
    ...(finite(source.leftSummary.meanPctTarget) === null || finite(source.rightSummary.meanPctTarget) === null ? ["Chybí souhrnné dosažení cíle."] : []),
  ];
  const painComplete = reaction.status !== "technicky nehodnotitelné";
  const status = technicalReasons.length
    ? "technicky nehodnotitelné"
    : worst([performance.status, control.status, fatigue.finding.status, ...(painComplete ? [reaction.status] : [])]);
  const progressionReady = status === "splněno" && reaction.status === "splněno" &&
    (left.successRatePct ?? 0) >= 80 && (right.successRatePct ?? 0) >= 80 &&
    (left.timeInTargetPct ?? 0) >= 70 && (right.timeInTargetPct ?? 0) >= 70;
  let action: TindeqRecommendationAction;
  let summary: string;
  let reasons: string[];
  if (technicalReasons.length) [action, summary, reasons] = ["opakování měření", "Zopakuj měření po odstranění technického omezení záznamu.", technicalReasons];
  else if (reaction.status === "nesplněno") [action, summary, reasons] = ["regrese", "Sniž zatížení nebo objem a znovu zkontroluj bolestivou reakci.", [reaction.summary]];
  else if (control.status === "nesplněno" || (flagRate ?? 0) > 30) [action, summary, reasons] = ["technická úprava provedení", "Nejprve uprav provedení, nastavení nebo instrukce; zatížení nezvyšuj.", [control.summary]];
  else if (status === "nesplněno") [action, summary, reasons] = ["regrese", "Sniž cíl, počet opakování nebo délku intervalu podle dominantního kritéria.", [performance.summary, fatigue.finding.summary]];
  else if (status === "hraniční") [action, summary, reasons] = ["zachování", "Zachovej parametry a sleduj hraniční metriku při dalším tréninku.", [performance, control, fatigue.finding, reaction].filter((f) => f.status === "hraniční").map((f) => f.summary)];
  else if (!painComplete) [action, summary, reasons] = ["doplnění údajů před rozhodnutím", "Výkon umožňuje uvažovat o progresi, ale nejprve doplň bolest před, během a po cvičení.", ["Bez úplné bolestivé reakce nelze posoudit toleranci zátěže."]];
  else if (progressionReady) [action, summary, reasons] = ["progrese", "Progresi proveď malým krokem a zachovej stejný způsob měření i techniku.", ["Obě strany splnily výkon, stabilitu, únavu i bolestivé kritérium."]];
  else [action, summary, reasons] = ["zachování", "Parametry zatím zachovej; výsledek nesplňuje přísnější pravidlo pro progresi.", ["Alespoň jedna progresní podmínka nebyla splněna."]];
  const missingData = [
    ...(clinical.kneeAngleDegrees === null ? ["úhel kolene"] : []),
    ...(!painComplete ? ["bolest před, během a po cvičení"] : []),
    ...(source.previousMaxLeftKg === null || source.previousMaxRightKg === null ? ["předchozí maximum / MVIC pro obě strany"] : []),
  ];
  const headline = status === "splněno" ? "Předepsaný cíl série byl splněn."
    : status === "hraniční" ? "Série je hodnotitelná, ale alespoň jedna metrika je hraniční."
      : status === "nesplněno" ? "Série nesplnila alespoň jedno rozhodovací kritérium."
        : "Záznam není dostatečně kvalitní pro spolehlivé rozhodnutí.";
  return {
    version: TINDEQ_REPORT_VERSION,
    context: {
      athleteName: source.athleteName,
      measuredAt: source.measuredAt,
      protocol: source.protocol,
      kneeAngleDegrees: clinical.kneeAngleDegrees,
      previousMaxLeftKg: round(source.previousMaxLeftKg),
      previousMaxRightKg: round(source.previousMaxRightKg),
      prescribedPct: round(source.prescribedPct, 0),
      targetForceLeftKg: round(source.targetForceLeftKg),
      targetForceRightKg: round(source.targetForceRightKg),
      expectedRepetitions: source.expectedRepetitions,
      detectedRepetitions: source.detectedRepetitions,
      painBefore: clinical.painBefore,
      painDuring: clinical.painDuring,
      painAfter: clinical.painAfter,
      missingData,
    },
    performance: {
      left,
      right,
      normalizedSideDifferencePctPoints: left.targetAchievementPct !== null && right.targetAchievementPct !== null ? round(Math.abs(left.targetAchievementPct - right.targetAchievementPct)) : null,
      averageForceDifferenceKg: left.averageForceKg !== null && right.averageForceKg !== null ? round(Math.abs(left.averageForceKg - right.averageForceKg)) : null,
      finding: performance,
    },
    control: { meanAbsOnsetDifferenceSeconds: round(source.meanAbsOnsetDifferenceSeconds, 2), repetitionsWithTechnicalFlags: flagged, technicalFlagRatePct: flagRate, finding: control },
    fatigue,
    reaction: { finding: reaction },
    interpretation: { status, headline, summary: `${performance.summary} ${control.summary} ${fatigue.finding.summary} ${reaction.summary}`, findings: [performance, control, fatigue.finding, reaction] },
    recommendation: { action, summary, reasons: [...new Set(reasons)] },
    limitations: [
      "Prahové hodnoty jsou transparentní pracovní pravidla reportu, nikoli validované diagnostické cut-off hodnoty.",
      "Report popisuje konkrétní sérii; neurčuje diagnózu ani zdravotní způsobilost.",
      ...(!painComplete ? ["Nepřiměřenou reakci kolene nelze bez úplných údajů o bolesti spolehlivě posoudit."] : []),
      ...(source.warnings.length ? [`Zdrojová analýza obsahuje ${source.warnings.length} souhrnné technické upozornění.`] : []),
    ],
  };
}

export function buildTindeqReportFromSession(
  session: TindeqSession,
  options: { athleteName?: string | null; clinicalContext?: TindeqReportClinicalContext | null } = {},
): TindeqCanonicalReport {
  const unit = session.metadata.unit;
  return build({
    athleteName: options.athleteName ?? null,
    measuredAt: session.metadata.measuredAt,
    protocol: session.metadata.type.trim() || null,
    previousMaxLeftKg: forceToKg(session.metadata.mvcLeft, unit),
    previousMaxRightKg: forceToKg(session.metadata.mvcRight, unit),
    prescribedPct: finite(session.metadata.workLevelPct),
    targetForceLeftKg: forceToKg(session.analysis.targets.left, unit),
    targetForceRightKg: forceToKg(session.analysis.targets.right, unit),
    expectedRepetitions: session.analysis.expectedRepetitions,
    detectedRepetitions: session.analysis.detectedRepetitions,
    leftSummary: session.analysis.summary.left,
    rightSummary: session.analysis.summary.right,
    meanAbsOnsetDifferenceSeconds: session.analysis.summary.meanAbsOnsetDifferenceSeconds,
    repetitions: session.analysis.repetitions.map((rep) => currentRep(rep, unit)),
    warnings: [...session.analysis.warnings],
    clinicalContext: context(options.clinicalContext),
  });
}

export function buildTindeqReportFromStoredSession(
  session: StoredTindeqSession,
  options: { athleteName?: string | null; clinicalContext?: TindeqReportClinicalContext | null } = {},
): TindeqCanonicalReport {
  const storedContext = (session.raw_metadata as typeof session.raw_metadata & { reportContext?: TindeqReportClinicalContext }).reportContext;
  return build({
    athleteName: options.athleteName ?? null,
    measuredAt: session.measured_at,
    protocol: session.protocol_name,
    previousMaxLeftKg: finite(session.raw_metadata.mvcLeftKg),
    previousMaxRightKg: finite(session.raw_metadata.mvcRightKg),
    prescribedPct: finite(session.raw_metadata.workLevelPct),
    targetForceLeftKg: finite(session.target_force_left_kg),
    targetForceRightKg: finite(session.target_force_right_kg),
    expectedRepetitions: session.expected_repetitions,
    detectedRepetitions: session.detected_repetitions,
    leftSummary: session.left_summary,
    rightSummary: session.right_summary,
    meanAbsOnsetDifferenceSeconds: session.overall_summary.meanAbsOnsetDifferenceSeconds,
    repetitions: session.repetitions.map(storedRep),
    warnings: [...session.warnings],
    clinicalContext: context(options.clinicalContext ?? storedContext),
  });
}
