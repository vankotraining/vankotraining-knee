from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.strip() + "\n", encoding="utf-8")


def apply() -> None:
    package_path = ROOT / "package.json"
    package = json.loads(package_path.read_text(encoding="utf-8"))
    package["scripts"]["check:types"] = "tsc --noEmit"
    package["scripts"]["test"] = (
        "tsc -p tsconfig.test.json && node --test "
        ".test-dist/src/lib/knee-metrics.test.js "
        ".test-dist/src/lib/tindeq/tindeq.test.js"
    )
    package["dependencies"]["@supabase/ssr"] = "0.12.3"
    package["dependencies"]["@supabase/supabase-js"] = "2.110.8"
    package["dependencies"]["fflate"] = "0.8.3"
    package_path.write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8")

    tsconfig_path = ROOT / "tsconfig.test.json"
    tsconfig = json.loads(tsconfig_path.read_text(encoding="utf-8"))
    tsconfig["include"] = [
        "src/lib/knee-metrics.ts",
        "src/lib/knee-metrics.test.ts",
        "src/lib/tindeq/**/*.ts",
    ]
    tsconfig_path.write_text(json.dumps(tsconfig, indent=2) + "\n", encoding="utf-8")

    write(
        "src/proxy.ts",
        r'''
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase-config";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = getSupabaseConfig();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
''',
    )

    write(
        "src/app/auth/callback/route.ts",
        r'''
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextPath = url.searchParams.get("next")?.startsWith("/")
    ? url.searchParams.get("next")!
    : "/";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(nextPath, url.origin));
  }

  return NextResponse.redirect(new URL("/?authError=1", url.origin));
}
''',
    )

    write(
        "src/app/page.tsx",
        r'''
import { redirect } from "next/navigation";
import KneeApp from "./components/KneeApp";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type HomeProps = {
  searchParams: Promise<{ code?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const { code } = await searchParams;

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect("/");
  }

  return <KneeApp />;
}
''',
    )

    write(
        "src/lib/tindeq/types.ts",
        r'''
export type TindeqSample = {
  timeSeconds: number;
  left: number | null;
  right: number | null;
  channels: Record<string, number | null>;
};

export type TindeqInfo = {
  originalTag: string | null;
  normalizedTag: string | null;
  testDatetime: string | null;
  protocolType: string | null;
  leftMvc: number | null;
  rightMvc: number | null;
  workPercentage: number | null;
  leftTarget: number | null;
  rightTarget: number | null;
  workDurationSeconds: number | null;
  restDurationSeconds: number | null;
  plannedRepetitions: number | null;
  unit: string;
  metadata: Record<string, string>;
};

export type ParsedTindeqExport = {
  fileName: string;
  rawZip: Uint8Array;
  info: TindeqInfo;
  samples: TindeqSample[];
  samplingFrequencyHz: number;
};

export type SideMetrics = {
  mean: number | null;
  meanTargetPct: number | null;
  median: number | null;
  standardDeviation: number | null;
  coefficientOfVariationPct: number | null;
  meanAbsoluteTargetError: number | null;
  targetRmse: number | null;
  timeWithinFivePctSeconds: number | null;
  timeWithinTenPctSeconds: number | null;
  timeToNinetyPctSeconds: number | null;
  timeToNinetyFivePctSeconds: number | null;
  maximumOvershoot: number | null;
  maximumUndershoot: number | null;
  linearDriftPerSecond: number | null;
  workDurationSeconds: number;
};

export type RepetitionAnalysis = {
  repetitionNumber: number;
  isValid: boolean;
  workStartSeconds: number;
  workEndSeconds: number;
  leftMetrics: SideMetrics;
  rightMetrics: SideMetrics;
  bilateralMetrics: Record<string, number | null>;
  warnings: string[];
};

export type SeriesAnalysis = {
  repetitions: RepetitionAnalysis[];
  summary: Record<string, unknown>;
};
''',
    )

    write(
        "src/lib/tindeq/config.ts",
        r'''
export const TINDEQ_VERSIONS = {
  parser: "1.0.0",
  segmentation: "1.0.0",
  metrics: "1.0.0",
  analysis: "1.0.0",
} as const;

export const TINDEQ_ANALYSIS_CONFIG = {
  smoothingWindowSeconds: 0.1,
  activationThresholdRelativeToTarget: 0.2,
  maximumInactiveGapSeconds: 0.2,
  minimumWorkIntervalSeconds: 0.5,
  requiredDurationTolerance: 0.9,
  stableStartFraction: 0.25,
  stableEndFraction: 0.85,
  slowRampSeconds: 1,
  targetNotReachedPct: 90,
  overshootWarningPct: 10,
  instabilityCvPct: 10,
} as const;

export const TINDEQ_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
''',
    )

    write(
        "src/lib/tindeq/csv.ts",
        r'''
export function normalizeToken(value: string) {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function normalizeAthleteTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;

  const cleaned = value
    .trim()
    .replace(/\s/g, "")
    .replace(/(?<=\d),(?=\d)/g, ".")
    .replace(/[^0-9+\-.eE]/g, "");
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function delimiterScore(line: string, delimiter: string) {
  let score = 0;
  let quoted = false;
  for (const character of line) {
    if (character === '"') quoted = !quoted;
    else if (!quoted && character === delimiter) score += 1;
  }
  return score;
}

export function detectDelimiter(text: string) {
  const line = text.split(/\r?\n/).find((candidate) => candidate.trim()) ?? "";
  const candidates = [";", ",", "\t"];
  return candidates.sort((a, b) => delimiterScore(line, b) - delimiterScore(line, a))[0];
}

export function parseCsv(text: string): string[][] {
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && character === delimiter) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if (!quoted && (character === "\n" || character === "\r")) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += character;
  }

  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}
''',
    )

    write(
        "src/lib/tindeq/errors.ts",
        r'''
export type TindeqErrorCode =
  | "NO_FILE"
  | "FILE_TOO_LARGE"
  | "INVALID_ZIP"
  | "MISSING_INFO_CSV"
  | "MISSING_DATA_CSV"
  | "INVALID_CSV"
  | "UNAUTHORIZED"
  | "IMPORT_FAILED";

const USER_MESSAGES: Record<TindeqErrorCode, string> = {
  NO_FILE: "Vyber Tindeq ZIP soubor.",
  FILE_TOO_LARGE: "Soubor je příliš velký.",
  INVALID_ZIP: "Soubor není platný ZIP export z Tindeq.",
  MISSING_INFO_CSV: "Soubor neobsahuje info.csv.",
  MISSING_DATA_CSV: "Soubor neobsahuje data_set_1.csv.",
  INVALID_CSV: "CSV data v exportu nelze přečíst.",
  UNAUTHORIZED: "Pro import se nejprve přihlas.",
  IMPORT_FAILED: "Import se nepodařilo dokončit.",
};

export class TindeqImportError extends Error {
  constructor(
    public readonly code: TindeqErrorCode,
    message = USER_MESSAGES[code],
    public readonly status = 400,
  ) {
    super(message);
    this.name = "TindeqImportError";
  }
}
''',
    )

    write(
        "src/lib/tindeq/parser.ts",
        r'''
import { strFromU8, unzipSync } from "fflate";
import { parseCsv, normalizeAthleteTag, normalizeToken, parseNumber } from "./csv";
import { TindeqImportError } from "./errors";
import type { ParsedTindeqExport, TindeqInfo, TindeqSample } from "./types";

function baseName(path: string) {
  return path.replace(/\\/g, "/").split("/").pop()?.toLowerCase() ?? "";
}

function decode(bytes: Uint8Array) {
  return strFromU8(bytes).replace(/^\uFEFF/, "");
}

function valueFor(metadata: Record<string, string>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeToken);
  for (const alias of normalizedAliases) {
    if (metadata[alias] !== undefined) return metadata[alias];
  }
  for (const [key, value] of Object.entries(metadata)) {
    if (normalizedAliases.some((alias) => key.includes(alias))) return value;
  }
  return null;
}

function parseDateTime(metadata: Record<string, string>) {
  const combined = valueFor(metadata, ["datetime", "test datetime", "timestamp", "start time"]);
  const date = valueFor(metadata, ["date", "test date"]);
  const time = valueFor(metadata, ["time", "test time"]);
  const raw = combined ?? [date, time].filter(Boolean).join(" ");
  if (!raw) return null;

  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  const match = raw.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return null;
  const [, day, month, year, hour = "0", minute = "0", second = "0"] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseInfo(text: string): TindeqInfo {
  const rows = parseCsv(text);
  if (rows.length === 0) throw new TindeqImportError("INVALID_CSV");
  const metadata: Record<string, string> = {};

  for (const row of rows) {
    if (row.length >= 2 && row[0].trim()) {
      metadata[normalizeToken(row[0])] = row.slice(1).join(" ").trim();
    }
  }

  if (rows.length >= 2 && rows[0].length === rows[1].length) {
    rows[0].forEach((header, index) => {
      if (header.trim()) metadata[normalizeToken(header)] = rows[1][index]?.trim() ?? "";
    });
  }

  const originalTag = valueFor(metadata, [
    "tag",
    "client tag",
    "athlete tag",
    "user tag",
    "client",
    "athlete",
    "name",
  ])?.trim() || null;
  const workPercentageRaw = parseNumber(valueFor(metadata, [
    "work percentage",
    "percentage mvc",
    "mvc percentage",
    "percent mvc",
    "work percent",
  ]));
  const workPercentage = workPercentageRaw === null
    ? null
    : workPercentageRaw > 0 && workPercentageRaw <= 1
      ? workPercentageRaw * 100
      : workPercentageRaw;
  const leftMvc = parseNumber(valueFor(metadata, ["left mvc", "mvc left", "leva mvc"]));
  const rightMvc = parseNumber(valueFor(metadata, ["right mvc", "mvc right", "prava mvc"]));
  const explicitLeftTarget = parseNumber(valueFor(metadata, ["left target", "target left", "leva target"]));
  const explicitRightTarget = parseNumber(valueFor(metadata, ["right target", "target right", "prava target"]));
  const fraction = workPercentage === null ? null : workPercentage / 100;

  return {
    originalTag,
    normalizedTag: originalTag ? normalizeAthleteTag(originalTag) : null,
    testDatetime: parseDateTime(metadata),
    protocolType: valueFor(metadata, ["protocol type", "protocol", "test type"])?.trim() || null,
    leftMvc,
    rightMvc,
    workPercentage,
    leftTarget: explicitLeftTarget ?? (leftMvc !== null && fraction !== null ? leftMvc * fraction : null),
    rightTarget: explicitRightTarget ?? (rightMvc !== null && fraction !== null ? rightMvc * fraction : null),
    workDurationSeconds: parseNumber(valueFor(metadata, [
      "work duration",
      "contraction duration",
      "hold duration",
      "work time",
    ])),
    restDurationSeconds: parseNumber(valueFor(metadata, ["rest duration", "pause duration", "rest time"])),
    plannedRepetitions: parseNumber(valueFor(metadata, ["repetitions", "reps", "number repetitions"])),
    unit: valueFor(metadata, ["unit", "force unit"])?.trim() || "kg",
    metadata,
  };
}

function findColumn(headers: string[], aliases: string[]) {
  const normalizedAliases = aliases.map(normalizeToken);
  const exact = headers.findIndex((header) => normalizedAliases.includes(header));
  if (exact >= 0) return exact;
  return headers.findIndex((header) => normalizedAliases.some((alias) => header.includes(alias)));
}

function median(values: number[]) {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function parseData(text: string) {
  const rows = parseCsv(text);
  if (rows.length < 3) throw new TindeqImportError("INVALID_CSV");
  const headers = rows[0].map(normalizeToken);
  let timeIndex = findColumn(headers, ["time", "time seconds", "timestamp", "seconds", "sec"]);
  if (timeIndex < 0) timeIndex = 0;
  let leftIndex = findColumn(headers, ["left", "left force", "leva", "force1", "channel1", "sensor1"]);
  let rightIndex = findColumn(headers, ["right", "right force", "prava", "force2", "channel2", "sensor2"]);

  const numericCandidates = headers
    .map((_, index) => index)
    .filter((index) => index !== timeIndex)
    .filter((index) => rows.slice(1, 8).some((row) => parseNumber(row[index]) !== null));
  if (leftIndex < 0) leftIndex = numericCandidates[0] ?? -1;
  if (rightIndex < 0) rightIndex = numericCandidates.find((index) => index !== leftIndex) ?? -1;
  if (leftIndex < 0 && rightIndex < 0) throw new TindeqImportError("INVALID_CSV");

  const raw = rows.slice(1).map((row) => ({
    time: parseNumber(row[timeIndex]),
    left: leftIndex >= 0 ? parseNumber(row[leftIndex]) : null,
    right: rightIndex >= 0 ? parseNumber(row[rightIndex]) : null,
    row,
  })).filter((item) => item.time !== null && (item.left !== null || item.right !== null));
  if (raw.length < 2) throw new TindeqImportError("INVALID_CSV");

  const deltas = raw.slice(1).map((item, index) => item.time! - raw[index].time!).filter((delta) => delta > 0);
  if (deltas.length === 0) throw new TindeqImportError("INVALID_CSV");
  const medianDelta = median(deltas);
  const timeScale = medianDelta > 2 ? 0.001 : 1;
  const start = raw[0].time! * timeScale;
  const samples: TindeqSample[] = raw.map((item) => {
    const channels: Record<string, number | null> = {};
    headers.forEach((header, index) => {
      if (index !== timeIndex) channels[header || `channel${index}`] = parseNumber(item.row[index]);
    });
    return {
      timeSeconds: item.time! * timeScale - start,
      left: item.left,
      right: item.right,
      channels,
    };
  });
  const scaledDeltas = samples.slice(1)
    .map((sample, index) => sample.timeSeconds - samples[index].timeSeconds)
    .filter((delta) => delta > 0);
  const samplingFrequencyHz = 1 / median(scaledDeltas);
  return { samples, samplingFrequencyHz };
}

function unzip(bytes: Uint8Array) {
  try {
    return unzipSync(bytes);
  } catch {
    throw new TindeqImportError("INVALID_ZIP");
  }
}

function parseDirect(fileName: string, rawZip: Uint8Array): ParsedTindeqExport | null {
  const entries = unzip(rawZip);
  const infoPath = Object.keys(entries).find((path) => baseName(path) === "info.csv");
  const dataPath = Object.keys(entries).find((path) => baseName(path) === "data_set_1.csv");
  if (!infoPath && !dataPath) return null;
  if (!infoPath) throw new TindeqImportError("MISSING_INFO_CSV");
  if (!dataPath) throw new TindeqImportError("MISSING_DATA_CSV");
  const info = parseInfo(decode(entries[infoPath]));
  const { samples, samplingFrequencyHz } = parseData(decode(entries[dataPath]));
  return { fileName, rawZip, info, samples, samplingFrequencyHz };
}

export function parseTindeqZip(bytes: Uint8Array, fileName = "tindeq.zip"): ParsedTindeqExport[] {
  const direct = parseDirect(fileName, bytes);
  if (direct) return [direct];

  const entries = unzip(bytes);
  const nested = Object.entries(entries).filter(([path]) => baseName(path).endsWith(".zip"));
  if (nested.length === 0) {
    const hasInfo = Object.keys(entries).some((path) => baseName(path) === "info.csv");
    throw new TindeqImportError(hasInfo ? "MISSING_DATA_CSV" : "MISSING_INFO_CSV");
  }

  const exports = nested.flatMap(([path, nestedBytes]) => {
    const parsed = parseDirect(baseName(path), nestedBytes);
    if (!parsed) throw new TindeqImportError("INVALID_ZIP");
    return parsed;
  });
  if (exports.length === 0) throw new TindeqImportError("INVALID_ZIP");
  return exports;
}
''',
    )

    write(
        "src/lib/tindeq/analysis.ts",
        r'''
import { TINDEQ_ANALYSIS_CONFIG } from "./config";
import type {
  ParsedTindeqExport,
  RepetitionAnalysis,
  SeriesAnalysis,
  SideMetrics,
  TindeqSample,
} from "./types";

function finite(values: Array<number | null>) {
  return values.filter((value): value is number => value !== null && Number.isFinite(value));
}

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function standardDeviation(values: number[]) {
  const average = mean(values);
  if (average === null || values.length < 2) return values.length ? 0 : null;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
}

function slope(times: number[], values: number[]) {
  if (times.length < 2 || times.length !== values.length) return null;
  const meanTime = mean(times)!;
  const meanValue = mean(values)!;
  const denominator = times.reduce((sum, time) => sum + (time - meanTime) ** 2, 0);
  if (denominator === 0) return null;
  return times.reduce(
    (sum, time, index) => sum + (time - meanTime) * (values[index] - meanValue),
    0,
  ) / denominator;
}

function smooth(values: Array<number | null>, windowSize: number) {
  const radius = Math.max(0, Math.floor(windowSize / 2));
  return values.map((_, index) => mean(finite(values.slice(
    Math.max(0, index - radius),
    Math.min(values.length, index + radius + 1),
  ))));
}

function durationWithinBand(
  times: number[],
  values: number[],
  target: number,
  tolerance: number,
) {
  let duration = 0;
  for (let index = 0; index < values.length - 1; index += 1) {
    if (Math.abs(values[index] - target) <= target * tolerance) {
      duration += Math.max(0, times[index + 1] - times[index]);
    }
  }
  return duration;
}

function timeToFraction(times: number[], values: number[], target: number, fraction: number) {
  const index = values.findIndex((value) => value >= target * fraction);
  return index < 0 ? null : times[index] - times[0];
}

function sideMetrics(
  samples: TindeqSample[],
  side: "left" | "right",
  target: number | null,
): SideMetrics {
  const config = TINDEQ_ANALYSIS_CONFIG;
  const start = Math.floor(samples.length * config.stableStartFraction);
  const end = Math.max(start + 1, Math.ceil(samples.length * config.stableEndFraction));
  const stable = samples.slice(start, end);
  const values = finite(stable.map((sample) => sample[side]));
  const times = stable
    .filter((sample) => sample[side] !== null)
    .map((sample) => sample.timeSeconds);
  const average = mean(values);
  const deviation = standardDeviation(values);
  const workDurationSeconds = samples.length > 1
    ? samples[samples.length - 1].timeSeconds - samples[0].timeSeconds
    : 0;

  if (!values.length || average === null) {
    return {
      mean: null,
      meanTargetPct: null,
      median: null,
      standardDeviation: null,
      coefficientOfVariationPct: null,
      meanAbsoluteTargetError: null,
      targetRmse: null,
      timeWithinFivePctSeconds: null,
      timeWithinTenPctSeconds: null,
      timeToNinetyPctSeconds: null,
      timeToNinetyFivePctSeconds: null,
      maximumOvershoot: null,
      maximumUndershoot: null,
      linearDriftPerSecond: null,
      workDurationSeconds,
    };
  }

  return {
    mean: average,
    meanTargetPct: target && target > 0 ? (average / target) * 100 : null,
    median: median(values),
    standardDeviation: deviation,
    coefficientOfVariationPct: deviation !== null && average !== 0 ? (deviation / Math.abs(average)) * 100 : null,
    meanAbsoluteTargetError: target === null ? null : mean(values.map((value) => Math.abs(value - target))),
    targetRmse: target === null
      ? null
      : Math.sqrt(mean(values.map((value) => (value - target) ** 2)) ?? 0),
    timeWithinFivePctSeconds: target && target > 0 ? durationWithinBand(times, values, target, 0.05) : null,
    timeWithinTenPctSeconds: target && target > 0 ? durationWithinBand(times, values, target, 0.1) : null,
    timeToNinetyPctSeconds: target && target > 0
      ? timeToFraction(samples.map((sample) => sample.timeSeconds), finite(samples.map((sample) => sample[side])), target, 0.9)
      : null,
    timeToNinetyFivePctSeconds: target && target > 0
      ? timeToFraction(samples.map((sample) => sample.timeSeconds), finite(samples.map((sample) => sample[side])), target, 0.95)
      : null,
    maximumOvershoot: target === null ? null : Math.max(...values.map((value) => value - target)),
    maximumUndershoot: target === null ? null : Math.max(...values.map((value) => target - value)),
    linearDriftPerSecond: slope(times, values),
    workDurationSeconds,
  };
}

function warningSet(
  left: SideMetrics,
  right: SideMetrics,
  duration: number,
  requiredDuration: number | null,
  endedWithoutRelaxation: boolean,
) {
  const config = TINDEQ_ANALYSIS_CONFIG;
  const warnings: string[] = [];
  const metrics = [left, right];
  if (requiredDuration !== null && duration < requiredDuration * config.requiredDurationTolerance) {
    warnings.push("incomplete_work_interval");
  }
  if (endedWithoutRelaxation && (requiredDuration === null || duration >= requiredDuration * config.requiredDurationTolerance)) {
    warnings.push("recording_ended_without_relaxation");
  }
  if (metrics.some((metric) => metric.timeToNinetyFivePctSeconds !== null && metric.timeToNinetyFivePctSeconds > config.slowRampSeconds)) {
    warnings.push("slow_ramp");
  }
  if (metrics.some((metric) => metric.meanTargetPct !== null && metric.meanTargetPct < config.targetNotReachedPct)) {
    warnings.push("target_not_reached");
  }
  if (metrics.some((metric) => metric.maximumOvershoot !== null && metric.mean !== null && metric.maximumOvershoot > Math.abs(metric.mean) * config.overshootWarningPct / 100)) {
    warnings.push("target_overshoot");
  }
  if (metrics.some((metric) => metric.coefficientOfVariationPct !== null && metric.coefficientOfVariationPct > config.instabilityCvPct)) {
    warnings.push("unstable_force");
  }
  return warnings;
}

function coefficientOfVariation(values: number[]) {
  const average = mean(values);
  const deviation = standardDeviation(values);
  return average && deviation !== null ? (deviation / Math.abs(average)) * 100 : null;
}

export function analyzeTindeqExport(parsed: ParsedTindeqExport): SeriesAnalysis {
  const config = TINDEQ_ANALYSIS_CONFIG;
  const windowSize = Math.max(1, Math.round(parsed.samplingFrequencyHz * config.smoothingWindowSeconds));
  const leftSmoothed = smooth(parsed.samples.map((sample) => sample.left), windowSize);
  const rightSmoothed = smooth(parsed.samples.map((sample) => sample.right), windowSize);
  const smoothed = parsed.samples.map((sample, index) => ({
    ...sample,
    left: leftSmoothed[index],
    right: rightSmoothed[index],
  }));
  const leftReference = parsed.info.leftTarget ?? Math.max(...finite(leftSmoothed), 0);
  const rightReference = parsed.info.rightTarget ?? Math.max(...finite(rightSmoothed), 0);
  const active = smoothed.map((sample) => {
    const leftRatio = sample.left !== null && leftReference > 0 ? sample.left / leftReference : 0;
    const rightRatio = sample.right !== null && rightReference > 0 ? sample.right / rightReference : 0;
    return Math.max(leftRatio, rightRatio) >= config.activationThresholdRelativeToTarget;
  });
  const maxGapSamples = Math.max(1, Math.round(parsed.samplingFrequencyHz * config.maximumInactiveGapSeconds));
  const segments: Array<{ start: number; end: number; endedWithoutRelaxation: boolean }> = [];
  let start: number | null = null;
  let lastActive = -1;
  let gap = 0;

  active.forEach((isActive, index) => {
    if (isActive) {
      if (start === null) start = index;
      lastActive = index;
      gap = 0;
    } else if (start !== null) {
      gap += 1;
      if (gap > maxGapSamples) {
        segments.push({ start, end: lastActive, endedWithoutRelaxation: false });
        start = null;
        lastActive = -1;
        gap = 0;
      }
    }
  });
  if (start !== null) {
    segments.push({ start, end: smoothed.length - 1, endedWithoutRelaxation: true });
  }

  const repetitions: RepetitionAnalysis[] = segments
    .filter((segment) => smoothed[segment.end].timeSeconds - smoothed[segment.start].timeSeconds >= config.minimumWorkIntervalSeconds)
    .map((segment, index) => {
      const samples = smoothed.slice(segment.start, segment.end + 1);
      const duration = samples[samples.length - 1].timeSeconds - samples[0].timeSeconds;
      const leftMetrics = sideMetrics(samples, "left", parsed.info.leftTarget);
      const rightMetrics = sideMetrics(samples, "right", parsed.info.rightTarget);
      const warnings = warningSet(
        leftMetrics,
        rightMetrics,
        duration,
        parsed.info.workDurationSeconds,
        segment.endedWithoutRelaxation,
      );
      const bilateralTargetPcts = finite([leftMetrics.meanTargetPct, rightMetrics.meanTargetPct]);
      return {
        repetitionNumber: index + 1,
        isValid: !warnings.includes("incomplete_work_interval"),
        workStartSeconds: samples[0].timeSeconds,
        workEndSeconds: samples[samples.length - 1].timeSeconds,
        leftMetrics,
        rightMetrics,
        bilateralMetrics: {
          meanTargetPct: mean(bilateralTargetPcts),
          relativeSideDifferencePct: bilateralTargetPcts.length === 2
            ? Math.abs(bilateralTargetPcts[0] - bilateralTargetPcts[1])
            : null,
          rampTimeDifferenceSeconds:
            leftMetrics.timeToNinetyPctSeconds !== null && rightMetrics.timeToNinetyPctSeconds !== null
              ? Math.abs(leftMetrics.timeToNinetyPctSeconds - rightMetrics.timeToNinetyPctSeconds)
              : null,
        },
        warnings,
      };
    });

  const completion = finite(repetitions.flatMap((repetition) => [
    repetition.leftMetrics.meanTargetPct,
    repetition.rightMetrics.meanTargetPct,
  ]));
  const bandTime = finite(repetitions.flatMap((repetition) => [
    repetition.leftMetrics.timeWithinTenPctSeconds,
    repetition.rightMetrics.timeWithinTenPctSeconds,
  ]));
  const perRepetition = repetitions.map((repetition) => repetition.bilateralMetrics.meanTargetPct).filter(
    (value): value is number => typeof value === "number",
  );
  const trend = slope(perRepetition.map((_, index) => index + 1), perRepetition);
  const firstLastChangePct = perRepetition.length >= 2 && perRepetition[0] !== 0
    ? ((perRepetition[perRepetition.length - 1] - perRepetition[0]) / perRepetition[0]) * 100
    : null;
  const allWarnings = Array.from(new Set(repetitions.flatMap((repetition) => repetition.warnings)));

  return {
    repetitions,
    summary: {
      detectedRepetitions: repetitions.length,
      validRepetitions: repetitions.filter((repetition) => repetition.isValid).length,
      averageTargetCompletionPct: mean(completion),
      averageTimeWithinTenPctSeconds: mean(bandTime),
      betweenRepetitionCvPct: coefficientOfVariation(perRepetition),
      targetCompletionTrendPerRepetition: trend,
      firstToLastChangePct,
      probableFatigueDecline: firstLastChangePct !== null && firstLastChangePct < -5,
      warnings: allWarnings,
      quality: {
        targetFulfilment: mean(completion),
        controlAndStability: coefficientOfVariation(perRepetition),
        performanceMaintenance: firstLastChangePct,
      },
      heuristicNotice: "Prahové hodnoty jsou pracovní heuristiky, nikoliv klinicky validované cut-off hodnoty.",
    },
  };
}
''',
    )

    write(
        "src/lib/tindeq/validation.ts",
        r'''
export function validateClinicalScale(value: unknown, field: "pain" | "rpe") {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10) {
    throw new Error(`${field} must be an integer from 0 to 10 or null`);
  }
  return parsed;
}

export function isReadableTag(value: string | null) {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length >= 2 && /[\p{L}\p{N}]/u.test(trimmed);
}
''',
    )

    write(
        "src/lib/tindeq/tindeq.test.ts",
        r'''
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { strToU8, zipSync } from "fflate";
import { analyzeTindeqExport } from "./analysis";
import { normalizeAthleteTag } from "./csv";
import { TindeqImportError } from "./errors";
import { parseTindeqZip } from "./parser";
import { validateClinicalScale } from "./validation";

function dataCsv(endSeconds = 5, includeRelaxation = true) {
  const rows = ["time;left;right"];
  const step = 0.02;
  const total = includeRelaxation ? endSeconds + 1 : endSeconds;
  for (let time = 0; time <= total + 0.0001; time += step) {
    const active = time >= 0.2 && time <= endSeconds;
    const left = active ? 50 : 0;
    const right = active ? 52 : 0;
    rows.push(`${time.toFixed(2)};${left};${right}`);
  }
  return rows.join("\n");
}

function exportZip(options: {
  tag?: string | null;
  includeInfo?: boolean;
  includeData?: boolean;
  workDuration?: number;
  data?: string;
} = {}) {
  const entries: Record<string, Uint8Array> = {};
  if (options.includeInfo !== false) {
    entries["info.csv"] = strToU8([
      `tag;${options.tag === undefined ? "Rosová Štěpánka" : options.tag ?? ""}`,
      "date;2026-08-01",
      "protocol;Repeaters",
      "left mvc;100",
      "right mvc;104",
      "work percentage;50",
      `work duration;${options.workDuration ?? 4.8}`,
      "rest duration;3",
      "repetitions;1",
    ].join("\n"));
  }
  if (options.includeData !== false) {
    entries["data_set_1.csv"] = strToU8(options.data ?? dataCsv());
  }
  return zipSync(entries);
}

describe("Tindeq Repeaters parser and analysis", () => {
  it("normalizes names with diacritics and separators", () => {
    assert.equal(normalizeAthleteTag(" Rosová  Štěpánka "), "rosova-stepanka");
    assert.equal(normalizeAthleteTag("Rosova_Stepanka"), "rosova-stepanka");
  });

  it("parses one valid bilateral Tindeq ZIP and calculates sampling frequency", () => {
    const parsed = parseTindeqZip(exportZip());
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].info.normalizedTag, "rosova-stepanka");
    assert.ok(parsed[0].samplingFrequencyHz > 49 && parsed[0].samplingFrequencyHz < 51);
    assert.equal(parsed[0].samples[20].left, 50);
    assert.equal(parsed[0].samples[20].right, 52);
  });

  it("parses an outer ZIP containing multiple original exports", () => {
    const outer = zipSync({
      "first.zip": exportZip({ tag: "První Klient" }),
      "second.zip": exportZip({ tag: "Druhý Klient" }),
    });
    const parsed = parseTindeqZip(outer, "batch.zip");
    assert.equal(parsed.length, 2);
  });

  it("returns stable errors for missing info.csv and data_set_1.csv", () => {
    assert.throws(
      () => parseTindeqZip(exportZip({ includeInfo: false })),
      (error) => error instanceof TindeqImportError && error.code === "MISSING_INFO_CSV",
    );
    assert.throws(
      () => parseTindeqZip(exportZip({ includeData: false })),
      (error) => error instanceof TindeqImportError && error.code === "MISSING_DATA_CSV",
    );
  });

  it("rejects a damaged CSV time series", () => {
    assert.throws(
      () => parseTindeqZip(exportZip({ data: "time;left\nnot-a-time;bad" })),
      (error) => error instanceof TindeqImportError && error.code === "INVALID_CSV",
    );
  });

  it("keeps a missing tag as an unassigned measurement", () => {
    const parsed = parseTindeqZip(exportZip({ tag: null }))[0];
    assert.equal(parsed.info.originalTag, null);
    assert.equal(parsed.info.normalizedTag, null);
  });

  it("detects a complete repetition that ends without relaxation", () => {
    const parsed = parseTindeqZip(exportZip({
      workDuration: 4.8,
      data: dataCsv(5, false),
    }))[0];
    const analysis = analyzeTindeqExport(parsed);
    assert.equal(analysis.repetitions.length, 1);
    assert.equal(analysis.repetitions[0].isValid, true);
    assert.ok(analysis.repetitions[0].warnings.includes("recording_ended_without_relaxation"));
  });

  it("marks an incomplete work interval invalid", () => {
    const parsed = parseTindeqZip(exportZip({
      workDuration: 5,
      data: dataCsv(2, true),
    }))[0];
    const analysis = analyzeTindeqExport(parsed);
    assert.equal(analysis.repetitions[0].isValid, false);
    assert.ok(analysis.repetitions[0].warnings.includes("incomplete_work_interval"));
  });

  it("distinguishes pain null, zero and values 1-10", () => {
    assert.equal(validateClinicalScale(null, "pain"), null);
    assert.equal(validateClinicalScale("", "pain"), null);
    assert.equal(validateClinicalScale(0, "pain"), 0);
    assert.equal(validateClinicalScale(7, "pain"), 7);
    assert.throws(() => validateClinicalScale(11, "pain"));
  });
});
''',
    )


if __name__ == "__main__":
    apply()
