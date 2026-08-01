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
      firstToLastChangePct: firstLastChangePct,
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
