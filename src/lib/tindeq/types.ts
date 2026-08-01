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
