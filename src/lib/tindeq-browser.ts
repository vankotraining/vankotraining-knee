export type SideMetrics = {
  meanForce: number | null;
  meanPctTarget: number | null;
  cvPct: number | null;
  meanAbsErrorPctPoints: number | null;
  timeIn5Pct: number | null;
  timeIn10Pct: number | null;
  peakPctTarget: number | null;
  overshootPctPoints: number | null;
  driftPctTargetPerSecond: number | null;
  timeTo95Seconds: number | null;
};

export type RepetitionResult = {
  repetition: number;
  onsetSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  incompleteEnd: boolean;
  releaseRecorded: boolean;
  rightMinusLeftOnsetSeconds: number | null;
  left: SideMetrics;
  right: SideMetrics;
  flags: string[];
  curveLeftPct: Array<number | null>;
  curveRightPct: Array<number | null>;
};

export type SideSummary = {
  meanPctTarget: number | null;
  betweenRepCvPct: number | null;
  medianWithinRepCvPct: number | null;
  meanTimeIn5Pct: number | null;
  meanTimeIn10Pct: number | null;
  meanAbsErrorPctPoints: number | null;
  trendPctTargetPerRep: number | null;
  firstToLastChangePctPoints: number | null;
};

export type TindeqSession = {
  id: string;
  sourceName: string;
  datasetName: string;
  metadata: {
    measuredAt: string;
    tag: string;
    tagKey: string;
    comment: string;
    unit: string;
    repetitions: number;
    workDurationSeconds: number;
    pauseBetweenRepetitionsSeconds: number;
    sets: number;
    pauseBetweenSetsSeconds: number;
    type: string;
    mvcLeft: number;
    mvcRight: number;
    workLevelPct: number;
    restLevelPct: number;
  };
  analysis: {
    samplingHz: number | null;
    targets: { left: number | null; right: number | null };
    restTargets: { left: number | null; right: number | null };
    detectedRepetitions: number;
    expectedRepetitions: number;
    repetitions: RepetitionResult[];
    summary: {
      left: SideSummary;
      right: SideSummary;
      meanAbsOnsetDifferenceSeconds: number | null;
      meanSignedOnsetDifferenceSeconds: number | null;
      domains: {
        accuracy: string;
        control: string;
        maintenance: string;
      };
    };
    warnings: string[];
  };
};

export type ImportResult = {
  sessions: TindeqSession[];
  errors: Array<{ file: string; error: string }>;
};

type ZipEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
};

type ParsedDataset = {
  timeLeft: number[];
  forceLeft: number[];
  timeRight: number[];
  forceRight: number[];
};

const INFO_REQUIRED = [
  "date",
  "tag",
  "reps",
  "work dur.",
  "pause btw. reps",
  "mvc left",
  "mvc right",
  "Work Level (% of mvc)",
] as const;

const textDecoder = new TextDecoder("utf-8");

function round(value: number | null | undefined, digits = 2): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(String(value ?? "").trim().replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toInteger(value: unknown, fallback = 0): number {
  return Math.round(toNumber(value, fallback));
}

function median(values: number[]): number | null {
  const finite = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (finite.length === 0) return null;
  const middle = Math.floor(finite.length / 2);
  return finite.length % 2 === 0
    ? (finite[middle - 1] + finite[middle]) / 2
    : finite[middle];
}

function mean(values: number[]): number | null {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return null;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function standardDeviation(values: number[]): number | null {
  const finite = values.filter(Number.isFinite);
  if (finite.length < 2) return 0;
  const avg = mean(finite);
  if (avg === null) return null;
  const variance = finite.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (finite.length - 1);
  return Math.sqrt(variance);
}

function linearSlope(x: number[], y: number[]): number | null {
  const pairs = x
    .map((value, index) => ({ x: value, y: y[index] }))
    .filter((pair) => Number.isFinite(pair.x) && Number.isFinite(pair.y));
  if (pairs.length < 3) return null;
  const meanX = mean(pairs.map((pair) => pair.x));
  const meanY = mean(pairs.map((pair) => pair.y));
  if (meanX === null || meanY === null) return null;
  const numerator = pairs.reduce((sum, pair) => sum + (pair.x - meanX) * (pair.y - meanY), 0);
  const denominator = pairs.reduce((sum, pair) => sum + (pair.x - meanX) ** 2, 0);
  return denominator > 0 ? numerator / denominator : null;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  row.push(cell);
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function normalizeTag(tag: string): { display: string; key: string } {
  const display = tag.trim().replace(/\s+/g, " ") || "Bez tagu";
  const key = display
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("cs-CZ")
    .replace(/\s+/g, " ")
    .trim();
  return { display, key };
}

function parseTindeqDate(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw new Error("info.csv datum nelze bezpečně určit: očekáván Tindeq formát YYYY-DD-MM HH:mm[:ss].");
  }

  const [, yearValue, dayValue, monthValue, hourValue, minuteValue, secondValue = "00"] = match;
  const year = Number(yearValue);
  const day = Number(dayValue);
  const month = Number(monthValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const second = Number(secondValue);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysPerMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const valid =
    month >= 1 && month <= 12 &&
    day >= 1 && day <= (daysPerMonth[month - 1] ?? 0) &&
    hour >= 0 && hour <= 23 &&
    minute >= 0 && minute <= 59 &&
    second >= 0 && second <= 59;

  if (!valid) {
    throw new Error("info.csv datum nelze bezpečně určit: hodnota není platné datum v Tindeq formátu YYYY-DD-MM HH:mm[:ss].");
  }

  return `${yearValue}-${monthValue}-${dayValue}T${hourValue}:${minuteValue}:${secondValue}`;
}

function parseInfo(raw: Uint8Array): TindeqSession["metadata"] {
  const rows = parseCsv(textDecoder.decode(raw));
  if (rows.length < 2) throw new Error("info.csv nemá očekávané dva řádky.");
  const headers = rows[0].map((header) => header.trim());
  const values = [...rows[1]];
  while (values.length < headers.length) values.push("");
  const info = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  const missing = INFO_REQUIRED.filter((field) => !(field in info));
  if (missing.length > 0) throw new Error(`info.csv postrádá pole: ${missing.join(", ")}.`);
  const tag = normalizeTag(info.tag ?? "");
  return {
    measuredAt: parseTindeqDate(info.date ?? ""),
    tag: tag.display,
    tagKey: tag.key,
    comment: (info.comment ?? "").trim(),
    unit: (info.unit ?? "").trim(),
    repetitions: toInteger(info.reps),
    workDurationSeconds: toNumber(info["work dur."]),
    pauseBetweenRepetitionsSeconds: toNumber(info["pause btw. reps"]),
    sets: Math.max(1, toInteger(info.sets, 1)),
    pauseBetweenSetsSeconds: toNumber(info["pause btw. sets"]),
    type: (info.type ?? "").trim(),
    mvcLeft: toNumber(info["mvc left"]),
    mvcRight: toNumber(info["mvc right"]),
    workLevelPct: toNumber(info["Work Level (% of mvc)"]),
    restLevelPct: toNumber(info["Rest level (% of mvc)"]),
  };
}

function parseDataset(raw: Uint8Array): ParsedDataset {
  const rows = parseCsv(textDecoder.decode(raw));
  const headerIndex = rows.findIndex((row) => {
    const normalized = row.map((cell) => cell.trim().toLocaleLowerCase("en-US"));
    return normalized.length >= 4 && normalized[0] === "time left" && normalized[1] === "weight left" && normalized[2] === "time right" && normalized[3] === "weight right";
  });
  if (headerIndex < 0) throw new Error("data_set CSV neobsahuje hlavičku časových řad.");
  const timeLeft: number[] = [];
  const forceLeft: number[] = [];
  const timeRight: number[] = [];
  const forceRight: number[] = [];
  for (const row of rows.slice(headerIndex + 1)) {
    if (row.length < 4) continue;
    const cells = row.slice(0, 4).map((cell) => cell.trim());
    if (cells.some((cell) => cell === "")) continue;
    const values = cells.map((cell) => Number(cell.replace(",", ".")));
    if (!values.every(Number.isFinite)) continue;
    timeLeft.push(values[0]);
    forceLeft.push(values[1]);
    timeRight.push(values[2]);
    forceRight.push(values[3]);
  }
  if (timeLeft.length < 20) throw new Error("Časová řada je příliš krátká.");
  return { timeLeft, forceLeft, timeRight, forceRight };
}

function findEndOfCentralDirectory(view: DataView): number {
  const minimum = Math.max(0, view.byteLength - 65_557);
  for (let offset = view.byteLength - 22; offset >= minimum; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  throw new Error("ZIP nemá platný centrální adresář.");
}

function listZipEntries(bytes: Uint8Array): ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEndOfCentralDirectory(view);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  let offset = view.getUint32(eocdOffset + 16, true);
  const entries: ZipEntry[] = [];
  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error("ZIP má poškozený centrální adresář.");
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const name = textDecoder.decode(bytes.subarray(offset + 46, offset + 46 + fileNameLength));
    if (!name.endsWith("/")) entries.push({ name, compressionMethod, compressedSize, uncompressedSize, localHeaderOffset });
    offset += 46 + fileNameLength + extraLength + commentLength;
  }
  return entries;
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  if (!("DecompressionStream" in globalThis)) throw new Error("Prohlížeč nepodporuje rozbalení ZIPu. Použij aktuální Chrome.");
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw" as CompressionFormat));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readZipEntry(archive: Uint8Array, entry: ZipEntry): Promise<Uint8Array> {
  const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
  const offset = entry.localHeaderOffset;
  if (view.getUint32(offset, true) !== 0x04034b50) throw new Error(`ZIP položka ${entry.name} má neplatnou lokální hlavičku.`);
  const fileNameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = archive.subarray(dataStart, dataStart + entry.compressedSize);
  if (entry.compressionMethod === 0) return compressed.slice();
  if (entry.compressionMethod === 8) {
    const output = await inflateRaw(compressed);
    if (entry.uncompressedSize > 0 && output.byteLength !== entry.uncompressedSize) throw new Error(`ZIP položku ${entry.name} se nepodařilo korektně rozbalit.`);
    return output;
  }
  throw new Error(`ZIP používá nepodporovanou kompresi (${entry.compressionMethod}).`);
}

async function unzip(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  const result = new Map<string, Uint8Array>();
  for (const entry of listZipEntries(bytes)) result.set(entry.name, await readZipEntry(bytes, entry));
  return result;
}

function runs(mask: boolean[]): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  let start: number | null = null;
  for (let index = 0; index <= mask.length; index += 1) {
    const active = index < mask.length ? mask[index] : false;
    if (active && start === null) start = index;
    if (!active && start !== null) {
      result.push([start, index - 1]);
      start = null;
    }
  }
  return result;
}

function closeShortGaps(mask: boolean[], maxGap: number): boolean[] {
  const output = [...mask];
  for (const [start, end] of runs(mask.map((value) => !value))) {
    if (start === 0 || end === mask.length - 1) continue;
    if (end - start + 1 <= maxGap) for (let index = start; index <= end; index += 1) output[index] = true;
  }
  return output;
}

function removeShortRuns(mask: boolean[], minimumRun: number): boolean[] {
  const output = [...mask];
  for (const [start, end] of runs(mask)) {
    if (end - start + 1 < minimumRun) for (let index = start; index <= end; index += 1) output[index] = false;
  }
  return output;
}

function interpolate(sourceTime: number[], sourceValues: number[], targetTime: number[]): number[] {
  const result = new Array<number>(targetTime.length).fill(Number.NaN);
  let sourceIndex = 0;
  for (let targetIndex = 0; targetIndex < targetTime.length; targetIndex += 1) {
    const time = targetTime[targetIndex];
    while (sourceIndex + 1 < sourceTime.length && sourceTime[sourceIndex + 1] < time) sourceIndex += 1;
    if (time < sourceTime[0] || time > sourceTime[sourceTime.length - 1]) continue;
    const nextIndex = Math.min(sourceIndex + 1, sourceTime.length - 1);
    const startTime = sourceTime[sourceIndex];
    const endTime = sourceTime[nextIndex];
    const startValue = sourceValues[sourceIndex];
    const endValue = sourceValues[nextIndex];
    result[targetIndex] = endTime === startTime ? startValue : startValue + ((time - startTime) / (endTime - startTime)) * (endValue - startValue);
  }
  return result;
}

function movingAverage(values: number[], windowSize: number): number[] {
  const size = Math.max(1, windowSize);
  const radius = Math.floor(size / 2);
  const result = new Array<number>(values.length).fill(Number.NaN);
  const prefix = new Array<number>(values.length + 1).fill(0);
  const counts = new Array<number>(values.length + 1).fill(0);
  for (let index = 0; index < values.length; index += 1) {
    const finite = Number.isFinite(values[index]);
    prefix[index + 1] = prefix[index] + (finite ? values[index] : 0);
    counts[index + 1] = counts[index] + (finite ? 1 : 0);
  }
  for (let index = 0; index < values.length; index += 1) {
    const start = Math.max(0, index - radius);
    const end = Math.min(values.length, index + radius + 1);
    const count = counts[end] - counts[start];
    if (count > 0) result[index] = (prefix[end] - prefix[start]) / count;
  }
  return result;
}

function firstThresholdTime(time: number[], relative: number[], start: number, end: number, threshold = 0.35): number | null {
  for (let index = 0; index < time.length; index += 1) {
    if (time[index] >= start && time[index] <= end && Number.isFinite(relative[index]) && relative[index] >= threshold) return time[index];
  }
  return null;
}

function sideMetrics(time: number[], force: number[], target: number, onset: number, segmentEnd: number, expectedWork: number): SideMetrics {
  const empty: SideMetrics = { meanForce: null, meanPctTarget: null, cvPct: null, meanAbsErrorPctPoints: null, timeIn5Pct: null, timeIn10Pct: null, peakPctTarget: null, overshootPctPoints: null, driftPctTargetPerSecond: null, timeTo95Seconds: null };
  if (!(target > 0)) return empty;
  const stableStart = onset + 0.25 * expectedWork;
  const stableEnd = Math.min(onset + 0.85 * expectedWork, segmentEnd);
  const workEnd = Math.min(onset + expectedWork, segmentEnd);
  let stableIndices = time.map((value, index) => ({ value, index })).filter(({ value, index }) => value >= stableStart && value <= stableEnd && Number.isFinite(force[index])).map(({ index }) => index);
  const workIndices = time.map((value, index) => ({ value, index })).filter(({ value, index }) => value >= onset && value <= workEnd && Number.isFinite(force[index])).map(({ index }) => index);
  if (stableIndices.length < 3) stableIndices = workIndices;
  const stableForces = stableIndices.map((index) => force[index]);
  const stableRelative = stableForces.map((value) => (value / target) * 100);
  const workRelative = workIndices.map((index) => (force[index] / target) * 100);
  const meanForce = mean(stableForces);
  const meanPctTarget = mean(stableRelative);
  const sd = standardDeviation(stableForces);
  const cvPct = meanForce && sd !== null ? (sd / meanForce) * 100 : null;
  const peakPctTarget = workRelative.length > 0 ? Math.max(...workRelative) : null;
  const reachIndex = workIndices.find((index) => force[index] >= 0.95 * target);
  const drift = linearSlope(stableIndices.map((index) => time[index] - stableStart), stableRelative);
  return {
    meanForce: round(meanForce),
    meanPctTarget: round(meanPctTarget),
    cvPct: round(cvPct),
    meanAbsErrorPctPoints: round(mean(stableRelative.map((value) => Math.abs(value - 100)))),
    timeIn5Pct: round(workRelative.length > 0 ? (workRelative.filter((value) => value >= 95 && value <= 105).length / workRelative.length) * 100 : null),
    timeIn10Pct: round(workRelative.length > 0 ? (workRelative.filter((value) => value >= 90 && value <= 110).length / workRelative.length) * 100 : null),
    peakPctTarget: round(peakPctTarget),
    overshootPctPoints: round(peakPctTarget === null ? null : Math.max(0, peakPctTarget - 100)),
    driftPctTargetPerSecond: round(drift),
    timeTo95Seconds: round(reachIndex === undefined ? null : time[reachIndex] - onset),
  };
}

function resampleCurve(time: number[], force: number[], target: number, onset: number, duration: number): Array<number | null> {
  if (!(target > 0)) return new Array(101).fill(null);
  const x = Array.from({ length: 101 }, (_, index) => onset + (duration * index) / 100);
  return interpolate(time, force, x).map((value) => round((value / target) * 100, 1));
}

function summarizeSide(repetitions: RepetitionResult[], side: "left" | "right"): SideSummary {
  const rows = repetitions.map((repetition) => repetition[side]);
  const means = rows.map((row) => row.meanPctTarget).filter((value): value is number => value !== null);
  const cvs = rows.map((row) => row.cvPct).filter((value): value is number => value !== null);
  const in5 = rows.map((row) => row.timeIn5Pct).filter((value): value is number => value !== null);
  const in10 = rows.map((row) => row.timeIn10Pct).filter((value): value is number => value !== null);
  const errors = rows.map((row) => row.meanAbsErrorPctPoints).filter((value): value is number => value !== null);
  const avg = mean(means);
  const betweenSd = standardDeviation(means);
  return {
    meanPctTarget: round(avg),
    betweenRepCvPct: round(avg && betweenSd !== null ? (betweenSd / avg) * 100 : null),
    medianWithinRepCvPct: round(median(cvs)),
    meanTimeIn5Pct: round(mean(in5)),
    meanTimeIn10Pct: round(mean(in10)),
    meanAbsErrorPctPoints: round(mean(errors)),
    trendPctTargetPerRep: round(means.length >= 2 ? linearSlope(means.map((_, index) => index + 1), means) : null),
    firstToLastChangePctPoints: round(means.length >= 2 ? means[means.length - 1] - means[0] : null),
  };
}

function analyze(metadata: TindeqSession["metadata"], data: ParsedDataset): TindeqSession["analysis"] {
  const targetLeft = (metadata.mvcLeft * metadata.workLevelPct) / 100;
  const targetRight = (metadata.mvcRight * metadata.workLevelPct) / 100;
  const restLeft = (metadata.mvcLeft * metadata.restLevelPct) / 100;
  const restRight = (metadata.mvcRight * metadata.restLevelPct) / 100;
  const workDuration = Math.max(0.5, metadata.workDurationSeconds);
  const leftDeltas = data.timeLeft.slice(1).map((value, index) => value - data.timeLeft[index]);
  const rightDeltas = data.timeRight.slice(1).map((value, index) => value - data.timeRight[index]);
  const delta = median([...leftDeltas, ...rightDeltas].filter((value) => value > 0 && Number.isFinite(value)));
  if (delta === null || !(delta > 0)) throw new Error("Nelze určit vzorkovací frekvenci.");
  const samplingHz = 1 / delta;
  const start = Math.min(data.timeLeft[0], data.timeRight[0]);
  const end = Math.max(data.timeLeft[data.timeLeft.length - 1], data.timeRight[data.timeRight.length - 1]);
  const sampleCount = Math.floor((end - start) / delta) + 1;
  const commonTime = Array.from({ length: sampleCount }, (_, index) => start + index * delta);
  const left = interpolate(data.timeLeft, data.forceLeft, commonTime);
  const right = interpolate(data.timeRight, data.forceRight, commonTime);
  const smoothWindow = Math.max(1, Math.round(0.1 * samplingHz));
  const leftSmooth = movingAverage(left, smoothWindow);
  const rightSmooth = movingAverage(right, smoothWindow);
  const leftRelative = leftSmooth.map((value) => (value - restLeft) / Math.max(targetLeft - restLeft, 1e-9));
  const rightRelative = rightSmooth.map((value) => (value - restRight) / Math.max(targetRight - restRight, 1e-9));
  const combined = commonTime.map((_, index) => mean([leftRelative[index], rightRelative[index]].filter(Number.isFinite)) ?? Number.NaN);
  let active = combined.map((value) => Number.isFinite(value) && value >= 0.35);
  active = closeShortGaps(active, Math.max(1, Math.round(0.35 * samplingHz)));
  active = removeShortRuns(active, Math.max(1, Math.round(Math.min(0.8, workDuration * 0.22) * samplingHz)));
  let intervals = runs(active);
  const expected = Math.max(1, metadata.repetitions);
  if (intervals.length > expected) {
    intervals = intervals.map(([intervalStart, intervalEnd]) => ({ intervalStart, intervalEnd, score: combined.slice(intervalStart, intervalEnd + 1).reduce((sum, value) => sum + Math.max(Number.isFinite(value) ? value : 0, 0), 0) })).sort((a, b) => b.score - a.score).slice(0, expected).sort((a, b) => a.intervalStart - b.intervalStart).map(({ intervalStart, intervalEnd }) => [intervalStart, intervalEnd] as [number, number]);
  }
  const repetitions: RepetitionResult[] = intervals.map(([startIndex, endIndex], index) => {
    const segmentStart = commonTime[startIndex];
    const segmentEnd = commonTime[endIndex];
    const searchStart = Math.max(start, segmentStart - 0.8);
    const leftOnset = firstThresholdTime(commonTime, leftRelative, searchStart, segmentStart + 1.2);
    const rightOnset = firstThresholdTime(commonTime, rightRelative, searchStart, segmentStart + 1.2);
    const onsetCandidates = [leftOnset, rightOnset].filter((value): value is number => value !== null);
    const onset = onsetCandidates.length > 0 ? Math.min(...onsetCandidates) : segmentStart;
    const terminalCutoff = endIndex >= commonTime.length - Math.max(2, Math.round(0.15 * samplingHz));
    const actualDuration = segmentEnd - onset;
    const incompleteEnd = terminalCutoff && actualDuration < 0.9 * workDuration;
    const leftResult = sideMetrics(commonTime, leftSmooth, targetLeft, leftOnset ?? onset, segmentEnd, workDuration);
    const rightResult = sideMetrics(commonTime, rightSmooth, targetRight, rightOnset ?? onset, segmentEnd, workDuration);
    const flags: string[] = [];
    if (incompleteEnd) flags.push("Neúplný konec");
    if (actualDuration < 0.75 * workDuration && !incompleteEnd) flags.push("Krátké opakování");
    for (const [label, result] of [["Levá", leftResult], ["Pravá", rightResult]] as const) {
      if (result.timeTo95Seconds === null) flags.push(`${label}: nedosaženo 95 %`);
      else if (result.timeTo95Seconds > Math.max(1.5, 0.4 * workDuration)) flags.push(`${label}: pomalý náběh`);
      if (result.cvPct !== null && result.cvPct > 7.5) flags.push(`${label}: nestabilní`);
    }
    return {
      repetition: index + 1,
      onsetSeconds: round(onset) ?? onset,
      endSeconds: round(segmentEnd) ?? segmentEnd,
      durationSeconds: round(actualDuration) ?? actualDuration,
      incompleteEnd,
      releaseRecorded: !terminalCutoff,
      rightMinusLeftOnsetSeconds: round(leftOnset !== null && rightOnset !== null ? rightOnset - leftOnset : null),
      left: leftResult,
      right: rightResult,
      flags: [...new Set(flags)],
      curveLeftPct: resampleCurve(commonTime, leftSmooth, targetLeft, leftOnset ?? onset, workDuration),
      curveRightPct: resampleCurve(commonTime, rightSmooth, targetRight, rightOnset ?? onset, workDuration),
    };
  });
  const leftSummary = summarizeSide(repetitions, "left");
  const rightSummary = summarizeSide(repetitions, "right");
  const onsetDifferences = repetitions.map((repetition) => repetition.rightMinusLeftOnsetSeconds).filter((value): value is number => value !== null);
  const warnings: string[] = [];
  if (repetitions.length !== expected) warnings.push(`Detekováno ${repetitions.length} z očekávaných ${expected} opakování.`);
  if (repetitions.some((repetition) => repetition.incompleteEnd)) warnings.push("Poslední opakování má neúplný pracovní interval.");
  if (repetitions.some((repetition) => repetition.flags.some((flag) => flag.includes("pomalý náběh")))) warnings.push("Alespoň jedna strana má v některém opakování pomalý náběh.");
  const errors = [leftSummary.meanAbsErrorPctPoints, rightSummary.meanAbsErrorPctPoints].filter((value): value is number => value !== null);
  const cvs = [leftSummary.medianWithinRepCvPct, rightSummary.medianWithinRepCvPct].filter((value): value is number => value !== null);
  const trends = [leftSummary.trendPctTargetPerRep, rightSummary.trendPctTargetPerRep].filter((value): value is number => value !== null);
  const maxError = errors.length > 0 ? Math.max(...errors) : null;
  const maxCv = cvs.length > 0 ? Math.max(...cvs) : null;
  const minTrend = trends.length > 0 ? Math.min(...trends) : null;
  return {
    samplingHz: round(samplingHz, 1),
    targets: { left: round(targetLeft), right: round(targetRight) },
    restTargets: { left: round(restLeft), right: round(restRight) },
    detectedRepetitions: repetitions.length,
    expectedRepetitions: expected,
    repetitions,
    summary: {
      left: leftSummary,
      right: rightSummary,
      meanAbsOnsetDifferenceSeconds: round(mean(onsetDifferences.map((value) => Math.abs(value)))),
      meanSignedOnsetDifferenceSeconds: round(mean(onsetDifferences)),
      domains: {
        accuracy: maxError === null ? "Nehodnoceno" : maxError <= 5 ? "Dobrá" : maxError <= 10 ? "Ke kontrole" : "Výrazná odchylka",
        control: maxCv === null ? "Nehodnoceno" : maxCv <= 5 ? "Stabilní" : maxCv <= 8 ? "Ke kontrole" : "Nestabilní",
        maintenance: minTrend === null || minTrend >= -0.75 ? "Bez poklesu" : minTrend >= -1.5 ? "Mírný pokles" : "Výrazný pokles",
      },
    },
    warnings,
  };
}

async function digest(bytes: Uint8Array, suffix: string): Promise<string> {
  const combined = new Uint8Array(bytes.length + suffix.length);
  combined.set(bytes, 0);
  combined.set(new TextEncoder().encode(suffix), bytes.length);
  const hash = await crypto.subtle.digest("SHA-256", combined);
  return Array.from(new Uint8Array(hash)).slice(0, 10).map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function sessionsFromZip(bytes: Uint8Array, sourceName: string): Promise<TindeqSession[]> {
  const files = await unzip(bytes);
  const infoRaw = files.get("info.csv");
  if (!infoRaw) throw new Error("Tindeq ZIP neobsahuje info.csv.");
  const metadata = parseInfo(infoRaw);
  const datasetNames = [...files.keys()].filter((name) => /^data_set_\d+\.csv$/i.test(name)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  if (datasetNames.length === 0) throw new Error("Tindeq ZIP neobsahuje data_set_*.csv.");
  return Promise.all(datasetNames.map(async (datasetName) => {
    const raw = files.get(datasetName);
    if (!raw) throw new Error(`Chybí ${datasetName}.`);
    return { id: await digest(bytes, datasetName), sourceName, datasetName, metadata, analysis: analyze(metadata, parseDataset(raw)) };
  }));
}

export async function importTindeqArchive(file: File): Promise<ImportResult> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const rootFiles = await unzip(bytes);
  if (rootFiles.has("info.csv")) return { sessions: await sessionsFromZip(bytes, file.name), errors: [] };
  const innerArchives = [...rootFiles.entries()].filter(([name]) => name.toLocaleLowerCase().endsWith(".zip"));
  if (innerArchives.length === 0) throw new Error("Soubor není Tindeq export ani balík Tindeq ZIPů.");
  const sessions: TindeqSession[] = [];
  const errors: ImportResult["errors"] = [];
  for (const [name, archive] of innerArchives) {
    try {
      sessions.push(...(await sessionsFromZip(archive, name)));
    } catch (error) {
      errors.push({ file: name, error: error instanceof Error ? error.message : "Neznámá chyba" });
    }
  }
  return { sessions, errors };
}
