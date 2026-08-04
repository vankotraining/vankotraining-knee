import { strToU8, zipSync } from "fflate";

export type SyntheticArchiveOptions = {
  tag?: string;
  protocol?: string;
  unit?: "kg" | "N" | "lb";
  expectedRepetitions?: number;
  generatedRepetitions?: number;
  datasetCount?: number;
  includeInfo?: boolean;
  includeDataset?: boolean;
};

const workDurationSeconds = 5;
const pauseSeconds = 2;
const sampleIntervalSeconds = 0.05;

function infoCsv(options: SyntheticArchiveOptions) {
  const unit = options.unit ?? "kg";
  const headers = [
    "date", "tag", "comment", "unit", "reps", "work dur.",
    "pause btw. reps", "sets", "pause btw. sets", "type",
    "mvc left", "mvc right", "Work Level (% of mvc)", "Rest level (% of mvc)",
  ];
  const mvcLeft = unit === "N" ? 490.3325 : unit === "lb" ? 110.231 : 50;
  const mvcRight = unit === "N" ? 509.9458 : unit === "lb" ? 114.64 : 52;
  const values = [
    "2026-08-02 10:00:00",
    options.tag ?? "Klient Test",
    "Syntetický test bez osobních dat",
    unit,
    String(options.expectedRepetitions ?? 8),
    String(workDurationSeconds),
    String(pauseSeconds),
    "1",
    "0",
    options.protocol ?? "Repeaters",
    String(mvcLeft),
    String(mvcRight),
    "80",
    "0",
  ];
  return `${headers.join(",")}\n${values.join(",")}\n`;
}

function forceAt(time: number, target: number, repetitions: number, sideOffset: number) {
  const firstStart = 1;
  const cycleDuration = workDurationSeconds + pauseSeconds;
  const repetitionIndex = Math.floor((time - firstStart) / cycleDuration);
  if (repetitionIndex < 0 || repetitionIndex >= repetitions) return 0;
  const localTime = time - firstStart - repetitionIndex * cycleDuration;
  if (localTime < 0 || localTime > workDurationSeconds) return 0;
  const ramp = Math.min(1, localTime / 0.35);
  return target * ramp * (1 + sideOffset + Math.sin(localTime * 3) * 0.006);
}

function datasetCsv(options: SyntheticArchiveOptions, seriesOffset = 0) {
  const repetitions = options.generatedRepetitions ?? options.expectedRepetitions ?? 8;
  const unit = options.unit ?? "kg";
  const leftTarget = unit === "N" ? 392.266 : unit === "lb" ? 88.1848 : 40;
  const rightTarget = unit === "N" ? 407.95664 : unit === "lb" ? 91.712 : 41.6;
  const rows = ["time left,weight left,time right,weight right"];
  const totalDuration = 1 + repetitions * (workDurationSeconds + pauseSeconds) + 1;
  const sampleCount = Math.floor(totalDuration / sampleIntervalSeconds) + 1;
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index * sampleIntervalSeconds;
    const left = forceAt(time, leftTarget, repetitions, -0.004 + seriesOffset);
    const right = forceAt(time, rightTarget, repetitions, 0.004 + seriesOffset);
    rows.push(`${time.toFixed(2)},${left.toFixed(4)},${time.toFixed(2)},${right.toFixed(4)}`);
  }
  return `${rows.join("\n")}\n`;
}

export function syntheticTindeqZip(options: SyntheticArchiveOptions = {}) {
  const files: Record<string, Uint8Array> = {};
  if (options.includeInfo !== false) files["info.csv"] = strToU8(infoCsv(options));
  if (options.includeDataset !== false) {
    const datasetCount = options.datasetCount ?? 1;
    for (let index = 1; index <= datasetCount; index += 1) {
      files[`data_set_${index}.csv`] = strToU8(datasetCsv(options, -(index - 1) * 0.01));
    }
  }
  return zipSync(files, { level: 0 });
}

export function syntheticTindeqBatchZip() {
  return zipSync(
    {
      "session-a.zip": syntheticTindeqZip({ tag: "Klient A" }),
      "session-b.zip": syntheticTindeqZip({ tag: "Klient B" }),
    },
    { level: 0 },
  );
}

export function fileFromBytes(name: string, bytes: Uint8Array): File {
  return {
    name,
    async arrayBuffer() {
      return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    },
  } as File;
}
