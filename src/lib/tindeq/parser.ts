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

  if (rows.length >= 2 && rows[0].length > 2 && rows[0].length === rows[1].length) {
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
