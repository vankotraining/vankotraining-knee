import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TindeqSession } from "./tindeq-browser.js";
import {
  buildWorkflowInsertPayload,
  saveWorkflowSession,
} from "./tindeq-workflow-persistence.js";

const athleteId = "11111111-1111-4111-8111-111111111111";

function sideMetrics(meanForce: number) {
  return {
    meanForce,
    meanPctTarget: 100,
    cvPct: 2,
    meanAbsErrorPctPoints: 1,
    timeIn5Pct: 90,
    timeIn10Pct: 98,
    peakPctTarget: 102,
    overshootPctPoints: 2,
    driftPctTargetPerSecond: -0.1,
    timeTo95Seconds: 0.3,
  };
}

function summary() {
  return {
    meanPctTarget: 100,
    betweenRepCvPct: 2,
    medianWithinRepCvPct: 2,
    meanTimeIn5Pct: 90,
    meanTimeIn10Pct: 98,
    meanAbsErrorPctPoints: 1,
    trendPctTargetPerRep: 0,
    firstToLastChangePctPoints: 0,
  };
}

function fixture(): TindeqSession {
  return {
    id: "source-session",
    sourceName: "repeaters_2026_31_07_11_34_20260731 Client Name.zip",
    datasetName: "data_set_1.csv",
    metadata: {
      measuredAt: "2026-07-31T11:34:00",
      tag: "Client Name",
      tagKey: "client name",
      comment: "",
      unit: "kg",
      repetitions: 1,
      workDurationSeconds: 5,
      pauseBetweenRepetitionsSeconds: 2,
      sets: 1,
      pauseBetweenSetsSeconds: 0,
      type: "Repeaters",
      mvcLeft: 50,
      mvcRight: 55,
      workLevelPct: 70,
      restLevelPct: 0,
    },
    analysis: {
      samplingHz: 20,
      targets: { left: 35, right: 38.5 },
      restTargets: { left: 0, right: 0 },
      detectedRepetitions: 1,
      expectedRepetitions: 1,
      repetitions: [{
        repetition: 1,
        onsetSeconds: 1,
        endSeconds: 6,
        durationSeconds: 5,
        incompleteEnd: false,
        releaseRecorded: true,
        rightMinusLeftOnsetSeconds: 0,
        left: sideMetrics(35),
        right: sideMetrics(38.5),
        flags: [],
        curveLeftPct: [95, 100, 99],
        curveRightPct: [95, 100, 99],
      }],
      summary: {
        left: summary(),
        right: summary(),
        meanAbsOnsetDifferenceSeconds: 0,
        meanSignedOnsetDifferenceSeconds: 0,
        domains: { accuracy: "Dobrá", control: "Stabilní", maintenance: "Bez poklesu" },
      },
      warnings: [],
    },
  };
}

const context = {
  athleteId,
  side: "left" as const,
  prescription: {
    id: "22222222-2222-4222-8222-222222222222",
    referenceTestId: "33333333-3333-4333-8333-333333333333",
    referenceTestDate: "2026-07-25",
    referenceForceKg: 50,
    prescribedPct: 70,
    targetForceKg: 35,
  },
  sourceClientName: "Client Name",
  matchMethod: "exact" as const,
  pain: { before: null, duringMax: 0, after: 1 },
};

test("workflow payload stores interpretation snapshots and optional pain", async () => {
  const payload = await buildWorkflowInsertPayload(fixture(), context);
  assert.equal(payload.athlete_id, athleteId);
  assert.equal(payload.exercise_side, "left");
  assert.equal(payload.reference_test_id, context.prescription.referenceTestId);
  assert.equal(payload.reference_test_date, "2026-07-25");
  assert.equal(payload.reference_force_kg, 50);
  assert.equal(payload.prescribed_pct, 70);
  assert.equal(payload.prescribed_target_force_kg, 35);
  assert.equal(payload.mean_force_kg, 35);
  assert.equal(payload.mean_pct_reference, 70);
  assert.equal(payload.mean_pct_target, 100);
  assert.equal(payload.pain_before, null);
  assert.equal(payload.pain_during_max, 0);
  assert.equal(payload.pain_after, 1);
  assert.equal(payload.client_match_method, "exact");
  assert.match(payload.import_fingerprint, /^[a-f0-9]{64}$/);
});

test("payload contains normalized repetition results but never ZIP bytes or raw source series", async () => {
  const payload = await buildWorkflowInsertPayload(fixture(), context);
  const serialized = JSON.stringify(payload);
  assert.ok(!("file" in payload));
  assert.ok(!("zip" in payload));
  assert.ok(!("rawTimeSeries" in payload));
  assert.ok(!serialized.includes("Time Left"));
  assert.equal(payload.raw_metadata.tindeqSessionId, "source-session");
  assert.deepEqual(payload.repetitions[0].curveLeftPct, [95, 100, 99]);
});

test("inconsistent prescription snapshot is rejected", async () => {
  await assert.rejects(() => buildWorkflowInsertPayload(fixture(), {
    ...context,
    prescription: { ...context.prescription, targetForceKg: 36 },
  }));
});

test("duplicate precheck prevents a second insert", async () => {
  let inserted = false;
  const existing = { id: "existing" };
  const client = {
    from(table: string) {
      assert.equal(table, "tindeq_sessions");
      return {
        select() {
          return {
            eq() {
              return this;
            },
            is() {
              return this;
            },
            async maybeSingle() {
              return { data: existing, error: null };
            },
          };
        },
        insert() {
          inserted = true;
          throw new Error("insert must not be reached");
        },
      };
    },
  } as unknown as SupabaseClient;
  const result = await saveWorkflowSession(client, fixture(), context);
  assert.equal(result.ok, false);
  assert.equal(result.duplicate, true);
  assert.equal(inserted, false);
});

test("database unique race is returned as duplicate after re-read", async () => {
  let selectCalls = 0;
  const existing = { id: "existing-race" };
  const client = {
    from(table: string) {
      assert.equal(table, "tindeq_sessions");
      return {
        select() {
          selectCalls += 1;
          return {
            eq() { return this; },
            is() { return this; },
            async maybeSingle() {
              return selectCalls === 1
                ? { data: null, error: null }
                : { data: existing, error: null };
            },
          };
        },
        insert() {
          return {
            select() {
              return {
                async single() {
                  return { data: null, error: { code: "23505", message: "unique violation" } };
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  const result = await saveWorkflowSession(client, fixture(), context);
  assert.equal(result.ok, false);
  assert.equal(result.duplicate, true);
  if (!result.ok && result.duplicate) assert.equal(result.existing.id, "existing-race");
});
