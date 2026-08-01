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
