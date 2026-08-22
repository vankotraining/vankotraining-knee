import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { importTindeqArchive, type TindeqSession } from "./tindeq-browser.js";
import {
  forceToKg,
  loadTindeqHistory,
  mapTindeqSessionToInsert,
  saveTindeqSessions,
  TINDEQ_ANALYSIS_VERSION,
  validateTindeqSessionForSave,
} from "./tindeq-persistence.js";
import { fileFromBytes, syntheticTindeqZip } from "./tindeq-test-fixture.js";

const athleteId = "11111111-1111-4111-8111-111111111111";

async function fixture(options: Parameters<typeof syntheticTindeqZip>[0] = {}) {
  const result = await importTindeqArchive(
    fileFromBytes("session.zip", syntheticTindeqZip(options)),
  );
  return result.sessions[0];
}

type SaveMockOptions = {
  duplicates?: unknown[][];
  outcomes?: Array<{ data: unknown; error: { message: string } | null }>;
};

function saveClient(options: SaveMockOptions = {}) {
  const inserted: unknown[] = [];
  const duplicateQueries: unknown[] = [];
  const duplicates = [...(options.duplicates ?? [])];
  const outcomes = [...(options.outcomes ?? [])];

  const client = {
    from(table: string) {
      assert.equal(table, "tindeq_sessions");
      return {
        select() {
          const chain = {
            eq() { return chain; },
            contains(_column: string, value: unknown) {
              duplicateQueries.push(value);
              return chain;
            },
            is() { return chain; },
            async limit() {
              return { data: duplicates.shift() ?? [], error: null };
            },
          };
          return chain;
        },
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
  return { client, inserted, duplicateQueries };
}

test("mapování zachová klienta, ZIP zdroj a normalizovaná pole", async () => {
  const payload = mapTindeqSessionToInsert(await fixture(), athleteId);
  assert.equal(payload.athlete_id, athleteId);
  assert.equal(payload.source_filename, "session.zip");
  assert.equal(payload.source_dataset_name, "data_set_1.csv");
  assert.equal(payload.protocol_name, "Repeaters");
  assert.equal(payload.raw_metadata.importSource, "tindeq-zip");
  assert.match(payload.raw_metadata.tindeqSessionId, /^[0-9a-f]{20}$/);
  assert.equal(payload.repetitions.length, 8);
});

test("síla v newtonech se při uložení převádí na kg", async () => {
  assert.ok(Math.abs((forceToKg(98.0665, "N") ?? 0) - 10) < 0.00001);
  const payload = mapTindeqSessionToInsert(await fixture({ unit: "N" }), athleteId);
  assert.ok(Math.abs((payload.target_force_left_kg ?? 0) - 40) < 0.01);
  assert.ok(Math.abs((payload.raw_metadata.mvcLeftKg ?? 0) - 50) < 0.01);
  assert.equal(payload.overall_summary.storedForceUnit, "kg");
  assert.equal(payload.overall_summary.sourceForceUnit, "N");
});

test("reálná Tindeq jednotka SI se ukládá jako metrické kg", async () => {
  assert.equal(forceToKg(61.6, "SI"), 61.6);
  const session = await fixture();
  session.metadata.unit = "SI";
  const payload = mapTindeqSessionToInsert(session, athleteId);
  assert.ok(Math.abs((payload.target_force_left_kg ?? 0) - 40) < 0.01);
  assert.ok(Math.abs((payload.raw_metadata.mvcLeftKg ?? 0) - 50) < 0.01);
  assert.equal(payload.overall_summary.storedForceUnit, "kg");
  assert.equal(payload.overall_summary.sourceForceUnit, "SI");
  assert.equal(payload.raw_metadata.sourceForceUnit, "SI");
});

test("payload vždy zapisuje podporovanou analysis_version", async () => {
  assert.equal(
    mapTindeqSessionToInsert(await fixture(), athleteId).analysis_version,
    TINDEQ_ANALYSIS_VERSION,
  );
});

test("validace odmítne nepodporovanou analysis_version", async () => {
  const errors = validateTindeqSessionForSave(
    await fixture(),
    athleteId,
    "tindeq-repeaters-v0",
  );
  assert.match(errors.join(" "), /nepodporovanou verzi/);
});

test("validace odmítne chybějící klientské ID", async () => {
  assert.match(validateTindeqSessionForSave(await fixture(), "").join(" "), /athlete_id/);
});

test("ručně sestavený souhrnný objekt bez parserového tvaru nelze uložit", async () => {
  const manual = structuredClone(await fixture()) as TindeqSession;
  manual.id = "manual-session";
  manual.analysis.repetitions[0].curveLeftPct = [100];
  const errors = validateTindeqSessionForSave(manual, athleteId).join(" ");
  assert.match(errors, /ZIP analyzátorem/);
  assert.throws(() => mapTindeqSessionToInsert(manual, athleteId), /ZIP analyzátorem/);
});

test("NaN ani Infinity nelze předat do persistence", async () => {
  const invalid = await fixture();
  invalid.analysis.summary.left.meanPctTarget = Number.NaN;
  assert.match(validateTindeqSessionForSave(invalid, athleteId).join(" "), /NaN nebo Infinity/);
});

test("uložení jedné session vrací nový záznam", async () => {
  const session = await fixture();
  const stored = { id: "db-1", athlete_id: athleteId };
  const { client, inserted } = saveClient({ outcomes: [{ data: stored, error: null }] });
  const results = await saveTindeqSessions(client, [session], athleteId);
  assert.equal(results.length, 1);
  assert.equal(results[0].ok, true);
  if (results[0].ok) assert.equal(results[0].duplicate, false);
  assert.equal(inserted.length, 1);
});

test("opakovaný import stejné session pro stejného klienta je idempotentní", async () => {
  const session = await fixture();
  const existing = { id: "db-existing", athlete_id: athleteId };
  const { client, inserted, duplicateQueries } = saveClient({ duplicates: [[existing]] });
  const results = await saveTindeqSessions(client, [session], athleteId);
  assert.equal(results[0].ok, true);
  if (results[0].ok) assert.equal(results[0].duplicate, true);
  assert.equal(inserted.length, 0);
  const query = duplicateQueries[0] as { tindeqSessionId: string };
  assert.match(query.tindeqSessionId, /^v2:[0-9a-f]{64}$/);
  assert.notEqual(query.tindeqSessionId, session.id);
});

test("stable save ID nezávisí na názvu ZIPu ani legacy parser ID", async () => {
  const first = await fixture();
  const second = structuredClone(first) as TindeqSession;
  second.id = "cccccccccccccccccccc";
  second.sourceName = "same-measurement-reexport.zip";
  const existing = { id: "db-existing", athlete_id: athleteId };
  const firstMock = saveClient({ duplicates: [[existing]] });
  const secondMock = saveClient({ duplicates: [[existing]] });

  await saveTindeqSessions(firstMock.client, [first], athleteId);
  await saveTindeqSessions(secondMock.client, [second], athleteId);

  const firstQuery = firstMock.duplicateQueries[0] as { tindeqSessionId: string };
  const secondQuery = secondMock.duplicateQueries[0] as { tindeqSessionId: string };
  assert.equal(firstQuery.tindeqSessionId, secondQuery.tindeqSessionId);
});

test("re-export stejného měření s jiným legacy session ID je stále duplicita", async () => {
  const session = await fixture();
  const payload = mapTindeqSessionToInsert(session, athleteId);
  const legacyExisting = {
    ...payload,
    id: "db-legacy",
    imported_at: "2026-08-01T10:00:00.000Z",
    created_at: "2026-08-01T10:00:00.000Z",
    source_filename: "older-export-name.zip",
    raw_metadata: {
      ...payload.raw_metadata,
      tindeqSessionId: "aaaaaaaaaaaaaaaaaaaa",
    },
  };
  const { client, inserted } = saveClient({ duplicates: [[], [legacyExisting]] });
  const results = await saveTindeqSessions(client, [session], athleteId);
  assert.equal(results[0].ok, true);
  if (results[0].ok) assert.equal(results[0].duplicate, true);
  assert.equal(inserted.length, 0);
});

test("stejný čas nestačí k označení odlišného obsahu jako duplicity", async () => {
  const session = await fixture();
  const payload = mapTindeqSessionToInsert(session, athleteId);
  const differentExisting = {
    ...payload,
    id: "db-different",
    imported_at: "2026-08-01T10:00:00.000Z",
    created_at: "2026-08-01T10:00:00.000Z",
    repetitions: structuredClone(payload.repetitions),
    raw_metadata: {
      ...payload.raw_metadata,
      tindeqSessionId: "bbbbbbbbbbbbbbbbbbbb",
    },
  };
  differentExisting.repetitions[0].durationSeconds += 0.01;
  const { client, inserted } = saveClient({
    duplicates: [[], [differentExisting]],
    outcomes: [{ data: { id: "db-new" }, error: null }],
  });
  const results = await saveTindeqSessions(client, [session], athleteId);
  assert.equal(results[0].ok, true);
  if (results[0].ok) assert.equal(results[0].duplicate, false);
  assert.equal(inserted.length, 1);
});

test("více sessions se ukládá samostatně v pořadí importu", async () => {
  const first = await fixture({ tag: "Klient A" });
  const secondResult = await importTindeqArchive(
    fileFromBytes("second.zip", syntheticTindeqZip({ tag: "Klient B" })),
  );
  const { client, inserted } = saveClient({
    duplicates: [[], [], [], []],
    outcomes: [
      { data: { id: "db-1" }, error: null },
      { data: { id: "db-2" }, error: null },
    ],
  });
  const results = await saveTindeqSessions(client, [first, secondResult.sessions[0]], athleteId);
  assert.equal(results.filter((result) => result.ok).length, 2);
  assert.equal(inserted.length, 2);
});

test("částečné selhání je transparentní pro každou session", async () => {
  const first = await fixture({ tag: "Klient A" });
  const secondResult = await importTindeqArchive(
    fileFromBytes("second.zip", syntheticTindeqZip({ tag: "Klient B" })),
  );
  const { client } = saveClient({
    duplicates: [[], [], [], []],
    outcomes: [
      { data: { id: "db-1" }, error: null },
      { data: null, error: { message: "RLS rejected insert" } },
    ],
  });
  const results = await saveTindeqSessions(client, [first, secondResult.sessions[0]], athleteId);
  assert.equal(results[0].ok, true);
  assert.equal(results[1].ok, false);
  if (!results[1].ok) assert.equal(results[1].error, "RLS rejected insert");
});

test("prázdný batch se neodesílá", async () => {
  const { client, inserted } = saveClient();
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
      return { select() { return chain; } };
    },
  } as unknown as SupabaseClient;

  const history = await loadTindeqHistory(client, athleteId);
  assert.equal(history.length, 1);
  assert.deepEqual(calls[0], ["eq:athlete_id", athleteId]);
  assert.deepEqual(calls[1], ["is:deleted_at", null]);
  assert.equal(calls[2][0], "order:measured_at");
  assert.equal(calls[3][0], "order:created_at");
});
