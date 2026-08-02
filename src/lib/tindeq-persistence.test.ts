import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TindeqSession } from "./tindeq-browser.js";
import {
  forceToKg,
  loadTindeqHistory,
  mapTindeqSessionToInsert,
  saveTindeqSessions,
  TINDEQ_ANALYSIS_VERSION,
  validateTindeqSessionForSave,
} from "./tindeq-persistence.js";

const athleteId = "11111111-1111-4111-8111-111111111111";

function sideMetrics(meanForce: number) {
  return {
    meanForce,
    meanPctTarget: 99,
    cvPct: 3,
    meanAbsErrorPctPoints: 2,
    timeIn5Pct: 88,
    timeIn10Pct: 96,
    peakPctTarget: 103,
    overshootPctPoints: 3,
    driftPctTargetPerSecond: -0.1,
    timeTo95Seconds: 0.4,
  };
}

function sideSummary() {
  return {
    meanPctTarget: 99,
    betweenRepCvPct: 2.5,
    medianWithinRepCvPct: 3,
    meanTimeIn5Pct: 88,
    meanTimeIn10Pct: 96,
    meanAbsErrorPctPoints: 2,
    trendPctTargetPerRep: -0.2,
    firstToLastChangePctPoints: -1.4,
  };
}

function fixture(id = "session-1", unit = "kg"): TindeqSession {
  return {
    id,
    sourceName: `${id}.zip`,
    datasetName: "data_set_1.csv",
    metadata: {
      measuredAt: "2026-08-02T10:00:00+02:00",
      tag: `Klient ${id}`,
      tagKey: `klient ${id}`,
      comment: "Kontrolní měření",
      unit,
      repetitions: 8,
      workDurationSeconds: 5,
      pauseBetweenRepetitionsSeconds: 2,
      sets: 1,
      pauseBetweenSetsSeconds: 0,
      type: "Repeaters",
      mvcLeft: unit === "N" ? 490.3325 : 50,
      mvcRight: unit === "N" ? 509.9458 : 52,
      workLevelPct: 80,
      restLevelPct: 0,
    },
    analysis: {
      samplingHz: 20,
      targets: {
        left: unit === "N" ? 392.266 : 40,
        right: unit === "N" ? 407.95664 : 41.6,
      },
      restTargets: { left: 0, right: 0 },
      detectedRepetitions: 8,
      expectedRepetitions: 8,
      repetitions: [
        {
          repetition: 1,
          onsetSeconds: 1,
          endSeconds: 6,
          durationSeconds: 5,
          incompleteEnd: false,
          releaseRecorded: true,
          rightMinusLeftOnsetSeconds: 0.02,
          left: sideMetrics(unit === "N" ? 388.342 : 39.6),
          right: sideMetrics(unit === "N" ? 411.878 : 42),
          flags: [],
          curveLeftPct: [95, 100, 99],
          curveRightPct: [96, 101, 100],
        },
      ],
      summary: {
        left: sideSummary(),
        right: sideSummary(),
        meanAbsOnsetDifferenceSeconds: 0.02,
        meanSignedOnsetDifferenceSeconds: 0.02,
        domains: {
          accuracy: "Dobrá",
          control: "Stabilní",
          maintenance: "Bez poklesu",
        },
      },
      warnings: [],
    },
  };
}

function saveClient(outcomes: Array<{ data: unknown; error: { message: string } | null }>) {
  const inserted: unknown[] = [];
  const client = {
    from(table: string) {
      assert.equal(table, "tindeq_sessions");
      return {
        insert(payload: unknown) {
          inserted.push(payload);
          return {
            select() {
              return {
                async single() {
                  return outcomes.shift() ?? { data: null, error: { message: "Missing mock" } };
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { client, inserted };
}

test("mapování zachová athlete_id a klíčová relační pole", () => {
  const payload = mapTindeqSessionToInsert(fixture(), athleteId);
  assert.equal(payload.athlete_id, athleteId);
  assert.equal(payload.source_filename, "session-1.zip");
  assert.equal(payload.protocol_name, "Repeaters");
  assert.equal(payload.target_force_left_kg, 40);
  assert.equal(payload.target_force_right_kg, 41.6);
  assert.equal(payload.detected_repetitions, 8);
  assert.equal(payload.repetitions.length, 1);
});

test("síla v newtonech se při uložení jednoznačně převádí na kg", () => {
  assert.ok(Math.abs((forceToKg(98.0665, "N") ?? 0) - 10) < 0.00001);
  const payload = mapTindeqSessionToInsert(fixture("newtons", "N"), athleteId);
  assert.ok(Math.abs((payload.target_force_left_kg ?? 0) - 40) < 0.001);
  assert.ok(Math.abs((payload.repetitions[0].left.meanForceKg ?? 0) - 39.6) < 0.01);
  assert.ok(Math.abs((payload.raw_metadata.mvcLeftKg ?? 0) - 50) < 0.01);
  assert.equal(payload.overall_summary.storedForceUnit, "kg");
  assert.equal(payload.overall_summary.sourceForceUnit, "N");
});

test("payload vždy zapisuje podporovanou analysis_version", () => {
  assert.equal(mapTindeqSessionToInsert(fixture(), athleteId).analysis_version, TINDEQ_ANALYSIS_VERSION);
});

test("validace odmítne nepodporovanou analysis_version", () => {
  const errors = validateTindeqSessionForSave(
    fixture(),
    athleteId,
    "tindeq-repeaters-v0",
  );
  assert.match(errors.join(" "), /nepodporovanou verzi/);
});

test("validace odmítne chybějící nebo neplatné athlete_id", () => {
  assert.match(validateTindeqSessionForSave(fixture(), "").join(" "), /athlete_id/);
  assert.throws(() => mapTindeqSessionToInsert(fixture(), "not-a-uuid"), /athlete_id/);
});

test("validace odmítne neúplný analytický výsledek", () => {
  const incomplete = fixture();
  incomplete.analysis.detectedRepetitions = 0;
  incomplete.analysis.repetitions = [];
  const errors = validateTindeqSessionForSave(incomplete, athleteId).join(" ");
  assert.match(errors, /žádné analyzované opakování/);
  assert.match(errors, /detail analyzovaných opakování/);
});

test("uložení jedné session vrací uložený záznam", async () => {
  const stored = { id: "db-1", athlete_id: athleteId };
  const { client, inserted } = saveClient([{ data: stored, error: null }]);
  const results = await saveTindeqSessions(client, [fixture()], athleteId);
  assert.equal(results.length, 1);
  assert.equal(results[0].ok, true);
  assert.equal((inserted[0] as { athlete_id: string }).athlete_id, athleteId);
});

test("více sessions se ukládá samostatně v pořadí importu", async () => {
  const { client, inserted } = saveClient([
    { data: { id: "db-1" }, error: null },
    { data: { id: "db-2" }, error: null },
  ]);
  const results = await saveTindeqSessions(
    client,
    [fixture("session-1"), fixture("session-2")],
    athleteId,
  );
  assert.equal(results.filter((result) => result.ok).length, 2);
  assert.equal(inserted.length, 2);
});

test("částečné selhání je transparentní pro každou session", async () => {
  const { client } = saveClient([
    { data: { id: "db-1" }, error: null },
    { data: null, error: { message: "RLS rejected insert" } },
  ]);
  const results = await saveTindeqSessions(
    client,
    [fixture("session-1"), fixture("session-2")],
    athleteId,
  );
  assert.equal(results[0].ok, true);
  assert.equal(results[1].ok, false);
  if (!results[1].ok) assert.equal(results[1].error, "RLS rejected insert");
});

test("prázdný batch se neodesílá", async () => {
  const { client, inserted } = saveClient([]);
  const results = await saveTindeqSessions(client, [], athleteId);
  assert.equal(results[0].ok, false);
  assert.equal(inserted.length, 0);
});

test("historie se filtruje podle klienta a řadí od nejnovějšího měření", async () => {
  const calls: Array<[string, unknown]> = [];
  let orderCount = 0;
  const expected = [{ id: "history-1", athlete_id: athleteId }];
  const chain = {
    eq(column: string, value: unknown) {
      calls.push([`eq:${column}`, value]);
      return chain;
    },
    is(column: string, value: unknown) {
      calls.push([`is:${column}`, value]);
      return chain;
    },
    order(column: string, options: unknown) {
      calls.push([`order:${column}`, options]);
      orderCount += 1;
      if (orderCount === 1) return chain;
      return Promise.resolve({ data: expected, error: null });
    },
  };
  const client = {
    from(table: string) {
      assert.equal(table, "tindeq_sessions");
      return {
        select() {
          return chain;
        },
      };
    },
  } as unknown as SupabaseClient;

  const history = await loadTindeqHistory(client, athleteId);
  assert.equal(history.length, 1);
  assert.deepEqual(calls[0], ["eq:athlete_id", athleteId]);
  assert.deepEqual(calls[1], ["is:deleted_at", null]);
  assert.equal(calls[2][0], "order:measured_at");
  assert.equal(calls[3][0], "order:created_at");
});
